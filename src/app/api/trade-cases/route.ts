import { z } from "zod";

import { bootstrapApplication } from "@/server/bootstrap";

export const runtime = "nodejs";

const RequestSchema = z
  .object({
    automatic: z.boolean().default(false),
    title: z.string().trim().min(1).max(80).optional(),
    tradeDirection: z.enum(["china_to_india", "india_to_china"]).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.automatic && !value.title) {
      context.addIssue({ code: "custom", message: "A title is required for explicit creation." });
    }
  });

const DeleteSchema = z.strictObject({ tradeCaseId: z.string().uuid() });

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

function activeCaseCookie(tradeCaseId: string) {
  return `bwmi-active-case=${tradeCaseId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}

export async function GET() {
  const application = await bootstrapApplication();
  try {
    return Response.json(
      { tradeCases: application.conversationStore.listTradeCases() },
      { headers: NO_STORE_HEADERS },
    );
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof RequestSchema>;
  try {
    parsed = RequestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Enter a title between 1 and 80 characters for explicit creation." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const application = await bootstrapApplication();
  try {
    const title = parsed.title ?? "Document review";
    const conversation = application.conversationStore.createConversation(title);
    const created = application.conversationStore.createTradeCase(
      conversation.id,
      title,
    );
    if (!parsed.automatic) {
      const direction = parsed.tradeDirection ?? "china_to_india";
      const countries = direction === "china_to_india"
        ? { origin: "China", destination: "India" }
        : { origin: "India", destination: "China" };
      application.conversationStore.confirmFact(created.id, "origin_country", countries.origin);
      application.conversationStore.confirmFact(created.id, "destination_country", countries.destination);
      application.conversationStore.confirmFact(created.id, "trade_direction", direction);
    }
    return Response.json(
      { tradeCase: application.conversationStore.getTradeCase(created.id) },
      { status: 201, headers: { ...NO_STORE_HEADERS, "Set-Cookie": activeCaseCookie(created.id) } },
    );
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}

export async function DELETE(request: Request) {
  const parsed = DeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "A valid explicit Trade Case ID is required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  const application = await bootstrapApplication();
  try {
    application.conversationStore.deleteTradeCase(parsed.data.tradeCaseId);
    return Response.json(
      {
        deletedTradeCaseId: parsed.data.tradeCaseId,
        tradeCases: application.conversationStore.listTradeCases(),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The Trade Case was unavailable." },
      { status: 409, headers: NO_STORE_HEADERS },
    );
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}
