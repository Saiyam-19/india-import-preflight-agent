import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { Readable } from "node:stream";
import { connect as connectTls } from "node:tls";

import { hostMatchesAllowedDomain, type OfficialConnector } from "./registry";

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_REDIRECTS = 5;
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/xhtml+xml",
  "application/xml",
  "text/html",
  "text/plain",
  "text/xml",
]);

export class RetrievalBoundaryError extends Error {
  constructor(
    readonly code:
      | "unsafe_scheme"
      | "credentials_forbidden"
      | "port_forbidden"
      | "domain_not_allowed"
      | "unsafe_destination"
      | "unsafe_redirect"
      | "too_many_redirects"
      | "content_type_not_allowed"
      | "response_too_large"
      | "tls_certificate_invalid"
      | "retrieval_failed"
      | "timeout",
    message: string,
  ) {
    super(message);
  }
}

const TLS_CERTIFICATE_ERROR_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? errorCode(error.cause) : undefined;
}

export interface RemoteRetrievalResult {
  bytes: Uint8Array;
  contentType: string;
  finalUrl: string;
  redirectHistory: string[];
}

type ResolveHost = (hostname: string) => Promise<Array<{ address: string; family: number }>>;

export interface RemoteRetrievalOptions {
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  maxRedirects?: number;
  resolveHost?: ResolveHost;
  timeoutMs?: number;
}

function isUnsafeIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a = -1, b = -1, c = -1] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function parseIpv6Words(address: string) {
  let normalized = (address.toLowerCase().split("%")[0] ?? "").trim();
  const dotted = normalized.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted?.[1] && dotted[2]) {
    const octets = dotted[2].split(".").map(Number);
    if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
      return null;
    }
    normalized = `${dotted[1]}${((octets[0]! << 8) | octets[1]!).toString(16)}:${((octets[2]! << 8) | octets[3]!).toString(16)}`;
  }
  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const words = [...left, ...Array.from({ length: Math.max(0, missing) }, () => "0"), ...right]
    .map((word) => (/^[0-9a-f]{1,4}$/.test(word) ? Number.parseInt(word, 16) : Number.NaN));
  return words.length === 8 && words.every(Number.isInteger) ? words : null;
}

function isUnsafeIpv6(address: string) {
  const words = parseIpv6Words(address);
  if (!words) return true;
  if (words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff) {
    return true;
  }
  const [first = 0, second = 0] = words;
  if (first < 0x2000 || first > 0x3fff) return true;
  if (first === 0x2001 && (second <= 0x01ff || second === 0x0db8)) return true;
  if (first === 0x2002) return true;
  if (first === 0x3fff && (second & 0xf000) === 0) return true;
  return false;
}

export function isUnsafeAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? isUnsafeIpv4(address) : family === 6 ? isUnsafeIpv6(address) : true;
}

async function validateDestination(
  rawUrl: string,
  connector: OfficialConnector,
  resolveHost: ResolveHost,
  redirect: boolean,
) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new RetrievalBoundaryError(redirect ? "unsafe_redirect" : "unsafe_scheme", "Invalid URL.");
  }
  if (url.protocol !== "https:") {
    throw new RetrievalBoundaryError(
      redirect ? "unsafe_redirect" : "unsafe_scheme",
      "Only HTTPS official sources may be retrieved.",
    );
  }
  if (url.username || url.password) {
    throw new RetrievalBoundaryError("credentials_forbidden", "URL credentials are forbidden.");
  }
  if (url.port && url.port !== "443") {
    throw new RetrievalBoundaryError("port_forbidden", "Only the standard HTTPS port is allowed.");
  }
  if (!hostMatchesAllowedDomain(url.hostname, connector.allowedDomains)) {
    throw new RetrievalBoundaryError(
      redirect ? "unsafe_redirect" : "domain_not_allowed",
      "The destination is outside the connector's official-domain registry.",
    );
  }
  if (isIP(url.hostname) !== 0) {
    throw new RetrievalBoundaryError("unsafe_destination", "IP-literal destinations are forbidden.");
  }
  let resolved: Array<{ address: string; family: number }>;
  try {
    resolved = await resolveHost(url.hostname);
  } catch {
    throw new RetrievalBoundaryError("retrieval_failed", "The official hostname could not be resolved.");
  }
  if (resolved.length === 0 || resolved.some((entry) => isUnsafeAddress(entry.address))) {
    throw new RetrievalBoundaryError(
      redirect ? "unsafe_redirect" : "unsafe_destination",
      "The destination resolved to a blocked network address.",
    );
  }
  return { url, resolved };
}

function fetchPinnedOfficial(
  url: URL,
  resolved: Array<{ address: string; family: number }>,
  init: RequestInit,
): Promise<Response> {
  const pinned = resolved[0];
  if (!pinned) {
    throw new RetrievalBoundaryError("unsafe_destination", "The official hostname had no safe address.");
  }
  const outgoingHeaders: Record<string, string> = {};
  new Headers(init.headers).forEach((value, name) => {
    outgoingHeaders[name] = value;
  });
  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      url,
      {
        headers: outgoingHeaders,
        method: "GET",
        signal: init.signal ?? undefined,
        createConnection: (_options, onConnected) => {
          const socket = connectTls(
            {
              host: pinned.address,
              port: 443,
              servername: url.hostname,
              rejectUnauthorized: true,
              ALPNProtocols: ["http/1.1"],
            },
          );
          let settled = false;
          socket.once("secureConnect", () => {
            settled = true;
            onConnected(null, socket);
          });
          socket.once("error", (error) => {
            if (!settled) onConnected(error, socket);
          });
          return socket;
        },
      },
      (incoming) => {
        const headers = new Headers();
        for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
          const name = incoming.rawHeaders[index];
          const value = incoming.rawHeaders[index + 1];
          if (name && value) headers.append(name, value);
        }
        resolve(
          new Response(Readable.toWeb(incoming) as ReadableStream<Uint8Array>, {
            headers,
            status: incoming.statusCode ?? 500,
            ...(incoming.statusMessage ? { statusText: incoming.statusMessage } : {}),
          }),
        );
      },
    );
    request.once("error", reject);
    request.end();
  });
}

async function readBoundedBody(response: Response, maxBytes: number, signal: AbortSignal) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new RetrievalBoundaryError("response_too_large", "The official response exceeds the size limit.");
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const cancelOnAbort = () => void reader.cancel("retrieval timeout");
  signal.addEventListener("abort", cancelOnAbort, { once: true });
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) {
        throw new RetrievalBoundaryError("timeout", "The official source retrieval timed out.");
      }
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new RetrievalBoundaryError("response_too_large", "The official response exceeds the size limit.");
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", cancelOnAbort);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function retrieveOfficialSource(
  rawUrl: string,
  connector: OfficialConnector,
  options: RemoteRetrievalOptions = {},
): Promise<RemoteRetrievalResult> {
  const resolveHost: ResolveHost =
    options.resolveHost ??
    (async (hostname) => lookup(hostname, { all: true, verbatim: true }));
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const timeoutFailure = new Promise<never>((_resolve, reject) => {
    controller.signal.addEventListener(
      "abort",
      () => reject(new RetrievalBoundaryError("timeout", "The official source retrieval timed out.")),
      { once: true },
    );
  });
  const withinTimeout = <T>(operation: Promise<T>) => Promise.race([operation, timeoutFailure]);
  const redirectHistory: string[] = [];

  try {
    let current = await withinTimeout(validateDestination(rawUrl, connector, resolveHost, false));
    for (let redirectCount = 0; ; redirectCount += 1) {
      let response: Response;
      try {
        const requestInit = {
          redirect: "manual",
          signal: controller.signal,
          headers: { Accept: "application/pdf,text/html,text/plain,application/xml;q=0.8" },
        } satisfies RequestInit;
        response = options.fetchImpl
          ? await options.fetchImpl(current.url, requestInit)
          : await fetchPinnedOfficial(current.url, current.resolved, requestInit);
      } catch (error) {
        if (controller.signal.aborted) {
          throw new RetrievalBoundaryError("timeout", "The official source retrieval timed out.");
        }
        const tlsFailure = TLS_CERTIFICATE_ERROR_CODES.has(errorCode(error) ?? "");
        throw new RetrievalBoundaryError(
          tlsFailure ? "tls_certificate_invalid" : "retrieval_failed",
          tlsFailure
            ? "The official source TLS certificate could not be validated."
            : error instanceof Error ? error.message : "The official source could not be retrieved.",
        );
      }
      if (response.status >= 300 && response.status < 400) {
        if (redirectCount >= maxRedirects) {
          throw new RetrievalBoundaryError("too_many_redirects", "The redirect limit was exceeded.");
        }
        const location = response.headers.get("location");
        if (!location) {
          throw new RetrievalBoundaryError("unsafe_redirect", "A redirect had no destination.");
        }
        redirectHistory.push(current.url.href);
        let redirectUrl: string;
        try {
          redirectUrl = new URL(location, current.url).href;
        } catch {
          throw new RetrievalBoundaryError("unsafe_redirect", "A redirect destination was invalid.");
        }
        current = await withinTimeout(validateDestination(redirectUrl, connector, resolveHost, true));
        continue;
      }
      if (!response.ok) {
        throw new RetrievalBoundaryError(
          "retrieval_failed",
          `The official source returned HTTP ${response.status}.`,
        );
      }
      const contentType = (response.headers.get("content-type") ?? "")
        .split(";", 1)[0]
        ?.trim()
        .toLowerCase();
      if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
        throw new RetrievalBoundaryError(
          "content_type_not_allowed",
          "The official response content type is not allowed.",
        );
      }
      return {
        bytes: await withinTimeout(readBoundedBody(response, maxBytes, controller.signal)),
        contentType,
        finalUrl: current.url.href,
        redirectHistory,
      };
    }
  } finally {
    clearTimeout(timeout);
  }
}
