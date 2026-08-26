import { MAX_DOCUMENT_BYTES } from "./intake";

export const MAX_DOCUMENT_COUNT = 3;
export const MAX_MULTIPART_BYTES = MAX_DOCUMENT_COUNT * MAX_DOCUMENT_BYTES + 1024 * 1024;

export class DocumentRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function readBoundedMultipartForm(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new DocumentRequestError("Request body must be multipart form data.", 400);
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
    throw new DocumentRequestError("The document request is too large.", 413);
  }
  if (!request.body) throw new DocumentRequestError("The document request body is empty.", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        throw new DocumentRequestError("The document request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const boundedRequest = new Request(request.url, {
    method: "POST",
    headers: { "content-type": contentType },
    body: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
  });
  try {
    return await boundedRequest.formData();
  } catch {
    throw new DocumentRequestError("The multipart document request is corrupt.", 400);
  }
}
