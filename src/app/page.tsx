import { Journey } from "@/components/journey";
import { currentAssessmentDate, getPublicJourneyProducts } from "@/preflight";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const assessmentDate = currentAssessmentDate();
  const products = await getPublicJourneyProducts(assessmentDate);
  return <Journey products={products} assessmentDate={assessmentDate} access="public" />;
}
