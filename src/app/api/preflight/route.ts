import { NextResponse } from "next/server";

import { loadSourceAdmittedPacks } from "@/knowledge";
import {
  PROMOTION_EVIDENCE,
} from "@/preflight/promotion-evidence";
import {
  currentAssessmentDate,
  evaluatePreflight,
  evaluateOtherProduct,
  getPublicProductCatalog,
  OTHER_PRODUCT_ID,
  OtherProductAssessmentRequestSchema,
  type AssessmentRequest,
} from "@/preflight";

export const dynamic = "force-dynamic";

const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  Expires: "0",
  Pragma: "no-cache",
};

export async function POST(request: Request) {
  const isHarnessRequest = request.headers.get("x-bwmi-promotion-harness") === "restricted";
  const harnessEnabled = process.env.PREFLIGHT_PROMOTION_HARNESS === "1";
  const access = isHarnessRequest && harnessEnabled ? "promotion_harness" : "public";

  let candidate: unknown;
  try {
    candidate = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400, headers: PRIVATE_RESPONSE_HEADERS },
    );
  }

  const productPackId =
    typeof candidate === "object" && candidate !== null && "productPackId" in candidate
      ? (candidate as { productPackId?: unknown }).productPackId
      : undefined;
  if (typeof productPackId !== "string" || productPackId === "") {
    return NextResponse.json(
      { error: "A valid product-pack identity is required." },
      { status: 422, headers: PRIVATE_RESPONSE_HEADERS },
    );
  }

  const assessmentDate = currentAssessmentDate();
  if (productPackId === OTHER_PRODUCT_ID) {
    const parsed = OtherProductAssessmentRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Other product facts do not match the universal shipment contract." },
        { status: 422, headers: PRIVATE_RESPONSE_HEADERS },
      );
    }
    return NextResponse.json(
      evaluateOtherProduct(parsed.data, { asOf: assessmentDate }),
      { headers: PRIVATE_RESPONSE_HEADERS },
    );
  }

  const sourcePacks = await loadSourceAdmittedPacks();
  const eligiblePacks =
    access === "promotion_harness"
      ? sourcePacks
      : getPublicProductCatalog(sourcePacks, PROMOTION_EVIDENCE, assessmentDate).packs;
  const pack = eligiblePacks.find((candidatePack) => candidatePack.id === productPackId);
  if (!pack) {
    return NextResponse.json(
      { error: "That product is not currently eligible for public assessment." },
      { status: 404, headers: PRIVATE_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json(
    evaluatePreflight(pack, candidate as AssessmentRequest, { access, asOf: assessmentDate }),
    { headers: PRIVATE_RESPONSE_HEADERS },
  );
}
