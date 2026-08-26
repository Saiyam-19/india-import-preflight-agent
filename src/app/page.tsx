import { ChatFirstWorkspace } from "@/components/chat-first-workspace";
import { getAiAvailability } from "@/server/agent/guidance";
import { bootstrapApplication } from "@/server/bootstrap";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const application = await bootstrapApplication();
  try {
    const activeCaseId = (await cookies()).get("bwmi-active-case")?.value;
    const tradeCases = application.conversationStore.listTradeCases();
    const initialCases = activeCaseId
      ? [...tradeCases].sort((left, right) => Number(right.id === activeCaseId) - Number(left.id === activeCaseId))
      : tradeCases;
    return (
      <ChatFirstWorkspace
        assessmentDate={new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date())}
        ai={getAiAvailability()}
        initialCases={initialCases}
        source={{
          authority: application.evidence.authority,
          effectiveFrom: application.evidence.effectiveFrom,
          label: application.evidence.label,
          locator: application.evidence.locator,
          retrievedAt: application.evidence.retrievedAt,
          sha256: application.evidence.sha256,
          url: application.evidence.url,
          versionLabel: application.evidence.versionLabel,
        }}
      />
    );
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}
