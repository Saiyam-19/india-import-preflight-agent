import {
  OpenAIProvider,
  type Model,
  type ModelProvider,
  type ModelRequest,
  type SerializedTool,
} from "@openai/agents";

export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const OPENAI_MODEL = "gpt-5.6-sol";
export const OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";
export const GROQ_MODEL = "openai/gpt-oss-120b";

type ProviderEnvironment = Partial<Record<
  "BWMI_AI_PROVIDER" | "BWMI_OPENAI_BASE_URL" | "BWMI_OPENAI_MODEL" | "GROQ_API_KEY" | "OPENAI_API_KEY" | "OPENROUTER_API_KEY",
  string | undefined
>>;

export type AvailableAiProviderConfiguration = {
  available: true;
  apiKeyEnvironmentVariable: "GROQ_API_KEY" | "OPENAI_API_KEY" | "OPENROUTER_API_KEY";
  baseURL: typeof GROQ_BASE_URL | typeof OPENAI_BASE_URL | typeof OPENROUTER_BASE_URL;
  model: typeof GROQ_MODEL | typeof OPENAI_MODEL | typeof OPENROUTER_MODEL;
  provider: "groq" | "openai" | "openrouter";
  useResponses: boolean;
};

export type AiProviderConfiguration = AvailableAiProviderConfiguration | {
  available: false;
  message: string;
};

export type AiProviderCapability =
  | { available: true; message: "Deep research available"; model: string }
  | { available: false; message: "Deep research is temporarily unavailable. Instant guidance and saved-case work remain available." };

const CAPABILITY_FAILURE: AiProviderCapability = {
  available: false,
  message: "Deep research is temporarily unavailable. Instant guidance and saved-case work remain available.",
};
let capabilityCache: { key: string; expiresAt: number; value: AiProviderCapability } | null = null;

function normalizeGroqJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeGroqJsonSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).flatMap(([key, nested]) =>
    key === "format" ? [] : [[key, normalizeGroqJsonSchema(nested)]]
  ));
}

export function normalizeGroqToolSchemas(tools: SerializedTool[]): SerializedTool[] {
  return tools.map((tool) => {
    if (tool.type !== "function") return tool;
    const parameters = normalizeGroqJsonSchema(tool.parameters) as Record<string, unknown>;
    const normalizedParameters = parameters.properties && typeof parameters.properties === "object"
      ? parameters
      : { ...parameters, properties: {} };
    return {
      ...tool,
      parameters: normalizedParameters as typeof tool.parameters,
    };
  });
}

function normalizeGroqModelRequest(request: ModelRequest): ModelRequest {
  const tools = normalizeGroqToolSchemas(request.tools);
  const toolChoice = selectGroqToolChoice(tools);
  return {
    ...request,
    modelSettings: {
      ...request.modelSettings,
      maxTokens: Math.min(request.modelSettings.maxTokens ?? 768, 768),
      ...(toolChoice ? { toolChoice } : {}),
    },
    tools,
  };
}

const GROQ_TOOL_ORDER = [
  "finish_general_trade_question",
  "assess_shipment_readiness",
  "read_confirmed_shipment_context",
  "retrieve_general_india_trade_reference",
  "research_product_specifications",
  "record_product_specification_research",
  "propose_classification_candidates",
  "search_official_india_china_sources",
  "admit_source_evidence",
  "retrieve_admitted_compliance_claims",
  "identify_applicable_agencies",
  "screen_import_export_controls",
  "build_required_document_checklist",
  "review_uploaded_documents",
  "calculate_deterministic_border_charges",
  "persist_confirmed_fact",
] as const;

export function selectGroqToolChoice(tools: SerializedTool[]): string | undefined {
  const available = new Set(tools.flatMap((tool) => tool.type === "function" ? [tool.name] : []));
  return GROQ_TOOL_ORDER.find((name) => available.has(name))
    ?? tools.find((tool) => tool.type === "function")?.name;
}

function createGroqCompatibleModel(model: Model): Model {
  return {
    getResponse: (request) => model.getResponse(normalizeGroqModelRequest(request)),
    getStreamedResponse: (request) => model.getStreamedResponse(normalizeGroqModelRequest(request)),
    ...(model.getRetryAdvice
      ? {
          getRetryAdvice: (args) => model.getRetryAdvice!({
            ...args,
            request: normalizeGroqModelRequest(args.request),
          }),
        }
      : {}),
  };
}

function capabilityCacheKey(configuration: AvailableAiProviderConfiguration) {
  return `${configuration.provider}:${configuration.baseURL}:${configuration.model}`;
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return "invalid";
    return parsed.href.replace(/\/$/, "");
  } catch {
    return "invalid";
  }
}

export function resolveAiProviderConfiguration(
  environment: ProviderEnvironment = process.env as ProviderEnvironment,
): AiProviderConfiguration {
  if (environment.BWMI_AI_PROVIDER?.trim() === "groq") {
    if (!environment.GROQ_API_KEY?.trim()) {
      return { available: false, message: "AI integration unavailable: configure GROQ_API_KEY" };
    }
    return {
      available: true,
      apiKeyEnvironmentVariable: "GROQ_API_KEY",
      baseURL: GROQ_BASE_URL,
      model: GROQ_MODEL,
      provider: "groq",
      useResponses: false,
    };
  }
  const model = environment.BWMI_OPENAI_MODEL?.trim();
  const baseURL = normalizeBaseUrl(environment.BWMI_OPENAI_BASE_URL?.trim());
  const hasOpenAiKey = Boolean(environment.OPENAI_API_KEY?.trim());
  const hasOpenRouterKey = Boolean(environment.OPENROUTER_API_KEY?.trim());

  if (!model) {
    return hasOpenAiKey || hasOpenRouterKey || baseURL
      ? { available: false, message: "AI integration unavailable: configure an allowed model" }
      : { available: false, message: "AI integration unavailable" };
  }
  if (model !== OPENAI_MODEL && model !== OPENROUTER_MODEL) {
    return { available: false, message: "AI integration unavailable: model is not allowed" };
  }
  if (model === OPENAI_MODEL && (baseURL === null || baseURL === OPENAI_BASE_URL)) {
    if (!hasOpenAiKey) {
      return { available: false, message: "AI integration unavailable: configure OPENAI_API_KEY" };
    }
    return {
      available: true,
      apiKeyEnvironmentVariable: "OPENAI_API_KEY",
      baseURL: OPENAI_BASE_URL,
      model: OPENAI_MODEL,
      provider: "openai",
      useResponses: true,
    };
  }
  if (model === OPENROUTER_MODEL && baseURL === OPENROUTER_BASE_URL) {
    if (!hasOpenRouterKey) {
      return { available: false, message: "AI integration unavailable: configure OPENROUTER_API_KEY" };
    }
    return {
      available: true,
      apiKeyEnvironmentVariable: "OPENROUTER_API_KEY",
      baseURL: OPENROUTER_BASE_URL,
      model: OPENROUTER_MODEL,
      provider: "openrouter",
      useResponses: false,
    };
  }
  return {
    available: false,
    message: "AI integration unavailable: provider and model are not an allowed combination",
  };
}

export function createConfiguredModelProvider(
  configuration: AvailableAiProviderConfiguration,
  environment: ProviderEnvironment = process.env as ProviderEnvironment,
): ModelProvider & { close(): Promise<void> } {
  const apiKey = environment[configuration.apiKeyEnvironmentVariable];
  if (!apiKey?.trim()) throw new Error("AI integration unavailable");
  const provider = new OpenAIProvider({
    apiKey,
    baseURL: configuration.baseURL,
    useResponses: configuration.useResponses,
  });
  if (configuration.provider !== "groq") return provider;
  return {
    async getModel(modelName) {
      return createGroqCompatibleModel(await provider.getModel(modelName));
    },
    close: () => provider.close(),
  };
}

export function resetAiCapabilityCache() {
  capabilityCache = null;
}

export function recordAiProviderRuntimeFailure(
  environment: ProviderEnvironment = process.env as ProviderEnvironment,
) {
  const configuration = resolveAiProviderConfiguration(environment);
  if (!configuration.available) return CAPABILITY_FAILURE;
  capabilityCache = {
    key: capabilityCacheKey(configuration),
    expiresAt: Date.now() + 15 * 60_000,
    value: CAPABILITY_FAILURE,
  };
  return CAPABILITY_FAILURE;
}

export async function checkAiProviderCapability({
  environment = process.env as ProviderEnvironment,
  fetchImpl = fetch,
  timeoutMs = 5_000,
}: {
  environment?: ProviderEnvironment;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
} = {}): Promise<AiProviderCapability> {
  const configuration = resolveAiProviderConfiguration(environment);
  if (!configuration.available) return CAPABILITY_FAILURE;
  const cacheKey = capabilityCacheKey(configuration);
  if (fetchImpl === fetch && capabilityCache?.key === cacheKey && capabilityCache.expiresAt > Date.now()) {
    return capabilityCache.value;
  }

  const apiKey = environment[configuration.apiKeyEnvironmentVariable]?.trim();
  if (!apiKey) return CAPABILITY_FAILURE;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = configuration.provider === "openrouter"
      ? `${configuration.baseURL}/models/${configuration.model}/endpoints`
      : `${configuration.baseURL}/models/${configuration.model}`;
    const response = await fetchImpl(url, {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!response.ok) return CAPABILITY_FAILURE;
    const body = await response.json() as {
      data?: { id?: string; endpoints?: Array<{ supported_parameters?: string[] }> };
      id?: string;
    };
    const matchingModel = (body.data?.id ?? body.id) === configuration.model;
    const toolCapable = configuration.provider === "openai" || configuration.provider === "groq"
      || Boolean(body.data?.endpoints?.some((endpoint) =>
        endpoint.supported_parameters?.includes("tools")
        && endpoint.supported_parameters.includes("tool_choice")
      ));
    let accountReady = true;
    if (configuration.provider === "openrouter" && !configuration.model.endsWith(":free") && matchingModel && toolCapable) {
      const creditsResponse = await fetchImpl(`${configuration.baseURL}/credits`, {
        headers: { authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      if (!creditsResponse.ok) accountReady = false;
      else {
        const credits = await creditsResponse.json() as { data?: { total_credits?: number; total_usage?: number } };
        const totalCredits = credits.data?.total_credits;
        const totalUsage = credits.data?.total_usage;
        accountReady = Number.isFinite(totalCredits) && Number.isFinite(totalUsage) && totalCredits! > totalUsage!;
      }
    }
    const value: AiProviderCapability = matchingModel && toolCapable && accountReady
      ? { available: true, message: "Deep research available", model: configuration.model }
      : CAPABILITY_FAILURE;
    if (fetchImpl === fetch) capabilityCache = { key: cacheKey, expiresAt: Date.now() + 300_000, value };
    return value;
  } catch {
    return CAPABILITY_FAILURE;
  } finally {
    clearTimeout(timeout);
  }
}
