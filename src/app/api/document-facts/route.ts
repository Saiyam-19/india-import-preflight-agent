import { z } from "zod";

import { bootstrapApplication } from "@/server/bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("confirm"),
    factId: z.string().uuid(),
    tradeCaseId: z.string().uuid(),
  }),
  z.strictObject({
    action: z.literal("correct"),
    factId: z.string().uuid(),
    tradeCaseId: z.string().uuid(),
    value: z.string().trim().min(1).max(500),
  }),
]);

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Expires: "0",
  Pragma: "no-cache",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Confirm a fact or provide a non-empty correction for an explicit Trade Case." }, 400);
  }
  const application = await bootstrapApplication();
  try {
    const tradeCase = application.conversationStore.reviewDocumentFact(
      parsed.data.tradeCaseId,
      parsed.data.factId,
      parsed.data.action === "confirm"
        ? { action: "confirm" }
        : { action: "correct", value: parsed.data.value },
    );
    return json({ tradeCase });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "The document fact was unavailable." }, 409);
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}
