import { notFound } from "next/navigation";

import { Journey } from "@/components/journey";
import { currentAssessmentDate, getPromotionHarnessProducts } from "@/preflight";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PromotionHarnessPage() {
  if (process.env.PREFLIGHT_PROMOTION_HARNESS !== "1") notFound();
  const products = await getPromotionHarnessProducts();
  const assessmentDate = currentAssessmentDate();
  return (
    <Journey
      products={products}
      assessmentDate={assessmentDate}
      access="promotion_harness"
    />
  );
}
