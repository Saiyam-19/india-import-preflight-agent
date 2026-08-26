import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./styles.css";

const DIRECTION_CONTRACT = `<!--
THESIS: A conversation-scoped evidence ledger makes shipment readiness inspectable and keeps unsupported conclusions visibly incomplete.
OWN-WORLD: Cloud canvas, dark ink, one trust-blue accent, square marks, sharp borders, native controls, and citation-led chat records.
STORY: Ask a natural India-China shipment question, let the assistant preserve facts and run explicit evidence-gated tools, then inspect the cited readiness result in the conversation.
FIRST VIEWPORT: Case context, AI availability, the conversation, and official evidence are visible without a marketing preamble.
FORM: Operate, evidence-ledger direction, seed key operate-evidence-ledger.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export const metadata: Metadata = {
  title: "India-China Trade Guidance",
  description: "Case-scoped bilateral India-China Research Guidance and evidence-gated assessments with admitted official citations.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <span
          aria-hidden="true"
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }}
        />
        {children}
      </body>
    </html>
  );
}
