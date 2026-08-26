import { checkAiProviderCapability } from "@/server/agent/provider-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const capability = await checkAiProviderCapability();
  return Response.json(capability, {
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}
