import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./styles.css";

const DIRECTION_CONTRACT = `<!--
THESIS: An evidence ledger makes import uncertainty observable and refuses the generic marketing-page or dashboard arrangement.
OWN-WORLD: Cloud canvas, dark ink, one trust-blue accent, square marks, sharp borders, native controls, and source-led audit rows.
STORY: Describe the planned import, receive a documentation and compliance checklist, then verify evidence and rebuild the plan as facts become available.
FIRST VIEWPORT: Service identity and privacy promise frame a plain-language planning headline, followed by three concrete deliverables and the guided intake.
FORM: Operate, evidence-ledger direction, seed key operate-evidence-ledger.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export const metadata: Metadata = {
  title: "India Import Preflight",
  description: "A public import-planning assistant for documentation, duties, risks, and next steps for India-bound shipments.",
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
