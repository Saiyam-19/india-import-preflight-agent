import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GuidanceOutputSchema,
  createConfiguredModelRuntime,
  getAiAvailability,
  validateGuidanceOutput,
} from "@/server/agent/guidance";
import { checkAiProviderCapability, normalizeGroqToolSchemas, recordAiProviderRuntimeFailure, resolveAiProviderConfiguration, resetAiCapabilityCache, selectGroqToolChoice } from "@/server/agent/provider-config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetAiCapabilityCache();
});

describe("strict agent boundary", () => {
  it("reports AI unavailable without a key and explicit allowed provider/model", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_BASE_URL", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");
    expect(getAiAvailability()).toEqual({
      available: false,
      message: "AI integration unavailable",
    });

    vi.stubEnv("OPENAI_API_KEY", "configured-for-test");
    expect(getAiAvailability()).toEqual({
      available: false,
      message: "AI integration unavailable: configure an allowed model",
    });
  });

  it("admits gpt-5.6-sol only on the official OpenAI Responses endpoint", () => {
    vi.stubEnv("OPENAI_API_KEY", "configured-for-test");
    vi.stubEnv("BWMI_OPENAI_MODEL", "gpt-5.6-sol");
    expect(getAiAvailability()).toEqual({
      available: true,
      message: "AI integration available",
      model: "gpt-5.6-sol",
    });

    vi.stubEnv("BWMI_OPENAI_BASE_URL", "https://openrouter.ai/api/v1");
    expect(getAiAvailability()).toEqual({
      available: false,
      message: "AI integration unavailable: provider and model are not an allowed combination",
    });

    vi.stubEnv("BWMI_OPENAI_MODEL", "gpt-5-mini");
    expect(getAiAvailability()).toEqual({
      available: false,
      message: "AI integration unavailable: model is not allowed",
    });
  });

  it("admits the verified free OpenRouter Nemotron model only with the matching key and transport", () => {
    const configuration = resolveAiProviderConfiguration({
      OPENROUTER_API_KEY: "configured-for-test",
      BWMI_OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
      BWMI_OPENAI_MODEL: "nvidia/nemotron-3.5-lightning:free",
    });
    expect(configuration).toEqual({
      available: true,
      apiKeyEnvironmentVariable: "OPENROUTER_API_KEY",
      baseURL: "https://openrouter.ai/api/v1",
      model: "nvidia/nemotron-3.5-lightning:free",
      provider: "openrouter",
      useResponses: false,
    });
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "configured-for-test");
    vi.stubEnv("BWMI_OPENAI_BASE_URL", "https://openrouter.ai/api/v1");
    vi.stubEnv("BWMI_OPENAI_MODEL", "nvidia/nemotron-3.5-lightning:free");
    expect(getAiAvailability()).toEqual({
      available: true,
      message: "AI integration available",
      model: "nvidia/nemotron-3.5-lightning:free",
    });

    expect(resolveAiProviderConfiguration({
      OPENAI_API_KEY: "wrong-provider-key",
      BWMI_OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
      BWMI_OPENAI_MODEL: "nvidia/nemotron-3.5-lightning:free",
    })).toEqual({
      available: false,
      message: "AI integration unavailable: configure OPENROUTER_API_KEY",
    });

    expect(resolveAiProviderConfiguration({
      OPENROUTER_API_KEY: "configured-for-test",
      BWMI_OPENAI_MODEL: "nvidia/nemotron-3.5-lightning:free",
    })).toEqual({
      available: false,
      message: "AI integration unavailable: provider and model are not an allowed combination",
    });
  });

  it("admits GPT-OSS 120B only through the direct Groq endpoint and key", () => {
    expect(resolveAiProviderConfiguration({
      BWMI_AI_PROVIDER: "groq",
      GROQ_API_KEY: "configured-for-test",
    })).toEqual({
      available: true,
      apiKeyEnvironmentVariable: "GROQ_API_KEY",
      baseURL: "https://api.groq.com/openai/v1",
      model: "openai/gpt-oss-120b",
      provider: "groq",
      useResponses: false,
    });

    expect(resolveAiProviderConfiguration({
      BWMI_AI_PROVIDER: "groq",
      OPENROUTER_API_KEY: "wrong-provider-key",
    })).toEqual({
      available: false,
      message: "AI integration unavailable: configure GROQ_API_KEY",
    });
  });

  it("adds the empty properties object Groq requires without changing populated tool schemas", () => {
    const tools = [
      {
        type: "function",
        name: "read_context",
        description: "Read confirmed context",
        strict: true,
        parameters: { type: "object", properties: undefined, additionalProperties: false, required: [] },
      },
      {
        type: "function",
        name: "save_fact",
        description: "Save one fact",
        strict: true,
        parameters: {
          type: "object",
          properties: { value: { type: "string" } },
          additionalProperties: false,
          required: ["value"],
        },
      },
      {
        type: "function",
        name: "save_source",
        description: "Save one source",
        strict: true,
        parameters: {
          type: "object",
          properties: { sourceUrl: { type: "string", format: "uri" } },
          additionalProperties: false,
          required: ["sourceUrl"],
        },
      },
    ];

    expect(normalizeGroqToolSchemas(tools as never)).toEqual([
      expect.objectContaining({
        name: "read_context",
        parameters: expect.objectContaining({ properties: {} }),
      }),
      tools[1],
      expect.objectContaining({
        name: "save_source",
        parameters: expect.objectContaining({
          properties: { sourceUrl: { type: "string" } },
        }),
      }),
    ]);
    expect(tools[0]!.parameters.properties).toBeUndefined();
    expect(selectGroqToolChoice([
      { ...tools[0], name: "research_product_specifications" },
      { ...tools[0], name: "read_confirmed_shipment_context" },
    ] as never)).toBe("read_confirmed_shipment_context");
  });

  it("uses the official key and Responses transport for the allowlisted OpenAI configuration", () => {
    expect(resolveAiProviderConfiguration({
      OPENAI_API_KEY: "configured-for-test",
      BWMI_OPENAI_BASE_URL: "https://api.openai.com/v1/",
      BWMI_OPENAI_MODEL: "gpt-5.6-sol",
    })).toEqual({
      available: true,
      apiKeyEnvironmentVariable: "OPENAI_API_KEY",
      baseURL: "https://api.openai.com/v1",
      model: "gpt-5.6-sol",
      provider: "openai",
      useResponses: true,
    });
  });

  it("constructs the primary runtime with function search tools for OpenRouter and hosted search for OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "configured-for-test");
    vi.stubEnv("BWMI_OPENAI_BASE_URL", "https://openrouter.ai/api/v1");
    vi.stubEnv("BWMI_OPENAI_MODEL", "nvidia/nemotron-3.5-lightning:free");
    const openRouter = createConfiguredModelRuntime();
    expect(openRouter.model).toBe("nvidia/nemotron-3.5-lightning:free");
    expect(openRouter.searchTools?.official.type).toBe("function");
    expect(openRouter.searchTools?.product.type).toBe("function");
    await openRouter.dispose?.();

    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "configured-for-test");
    vi.stubEnv("BWMI_OPENAI_BASE_URL", "https://api.openai.com/v1");
    vi.stubEnv("BWMI_OPENAI_MODEL", "gpt-5.6-sol");
    const openAi = createConfiguredModelRuntime();
    expect(openAi.model).toBe("gpt-5.6-sol");
    expect(openAi.searchTools).toBeUndefined();
    await openAi.dispose?.();
  });

  it("offers deep research only after the configured model has a live tool-capable endpoint", async () => {
    const environment = {
      OPENROUTER_API_KEY: "configured-for-test",
      BWMI_OPENAI_BASE_URL: "https://openrouter.ai/api/v1",
      BWMI_OPENAI_MODEL: "nvidia/nemotron-3.5-lightning:free",
    };
    const fetchReady = vi.fn(async () => new Response(JSON.stringify({
      data: { id: "nvidia/nemotron-3.5-lightning:free", endpoints: [{ supported_parameters: ["tools", "tool_choice"] }] },
    }), { status: 200 }));
    await expect(checkAiProviderCapability({ environment, fetchImpl: fetchReady })).resolves.toMatchObject({
      available: true,
      model: "nvidia/nemotron-3.5-lightning:free",
    });
    expect(fetchReady).toHaveBeenNthCalledWith(1,
      "https://openrouter.ai/api/v1/models/nvidia/nemotron-3.5-lightning:free/endpoints",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchReady).toHaveBeenCalledTimes(1);

    resetAiCapabilityCache();
    const fetchDead = vi.fn(async () => new Response("not found", { status: 404 }));
    await expect(checkAiProviderCapability({ environment, fetchImpl: fetchDead })).resolves.toEqual({
      available: false,
      message: "Deep research is temporarily unavailable. Instant guidance and saved-case work remain available.",
    });
  });

  it("opens a cooldown circuit after a configured provider times out at runtime", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "configured-for-test");
    vi.stubEnv("BWMI_OPENAI_BASE_URL", "https://openrouter.ai/api/v1");
    vi.stubEnv("BWMI_OPENAI_MODEL", "nvidia/nemotron-3.5-lightning:free");
    const fetchReady = vi.fn(async () => new Response(JSON.stringify({
      data: { id: "nvidia/nemotron-3.5-lightning:free", endpoints: [{ supported_parameters: ["tools", "tool_choice"] }] },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchReady);

    expect(recordAiProviderRuntimeFailure()).toEqual({
      available: false,
      message: "Deep research is temporarily unavailable. Instant guidance and saved-case work remain available.",
    });
    await expect(checkAiProviderCapability()).resolves.toEqual({
      available: false,
      message: "Deep research is temporarily unavailable. Instant guidance and saved-case work remain available.",
    });
    expect(fetchReady).not.toHaveBeenCalled();
  });

  it("fails closed for unsupported states and unresolved citations", () => {
    expect(
      GuidanceOutputSchema.safeParse({
        state: "ready",
        summary: "You are cleared to import.",
        claims: [],
      }).success,
    ).toBe(false);

    expect(() => validateGuidanceOutput(validOutput(), () => {
      throw new Error("source is not admitted");
    })).toThrow(/source is not admitted/i);
  });

  it("rejects positive or invented conclusions even when they carry an admitted citation", () => {
    const admittedGuidance = validOutput();

    expect(() =>
      validateGuidanceOutput(
        {
          ...admittedGuidance,
          summary: "This import is permitted and meets every requirement.",
        },
        () => ({}),
      ),
    ).toThrow();

    expect(() =>
      validateGuidanceOutput(
        {
          ...admittedGuidance,
          claims: [
            {
              ...admittedGuidance.claims[0],
              text: "This product satisfies every applicable import requirement.",
            },
          ],
        },
        () => ({ claimText: admittedGuidance.claims[0]!.text }),
      ),
    ).toThrow(/does not match/i);
  });
});

function validOutput() {
  return {
    state: "research_guidance" as const,
    summary: "This is limited official-reference guidance with unresolved shipment applicability.",
    claims: [{
      appliesIn: "India" as const,
      authority: "Test authority",
      claimId: "claim-12345678",
      locator: "Section 1",
      productScope: "all goods",
      regulatoryDomain: "baseline import documents",
      sourceVersionId: "source-12345678",
      text: "A baseline import document claim.",
      tradeDirection: "china_to_india" as const,
      url: "https://example.gov.in/source",
    }],
    missingInformation: [], confirmedFacts: [], productResearch: [], classificationCandidates: [],
    agencies: [], controls: [], documents: [], documentReviews: [], calculation: null,
    risks: [], nextActions: [], nextQuestion: null, checked: [], notChecked: [],
  };
}
