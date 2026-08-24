import { loadSourceAdmittedPacks, type ProductPack } from "@/knowledge";

import { PROMOTION_EVIDENCE } from "./promotion-evidence";
import { getPublicProductCatalog } from "./promotion";

export function currentAssessmentDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((values, part) => {
      values[part.type] = part.value;
      return values;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export interface JourneyProduct {
  id: string;
  displayName: "Wi-Fi router" | "Bluetooth headphones" | "Indoor IP camera";
  title: string;
  version: string;
  lifecycleStatus: ProductPack["lifecycleStatus"];
  hsCode: string;
  hsLabel: string;
  scopeName: string;
  includedFacts: Record<string, unknown>;
  requiredDistinguishingFacts: string[];
  excludedVariants: string[];
  admittedAt: string;
  reviewAfter: string;
  rules: Array<{
    id: string;
    title: string;
    requiredEvidence: string[];
    clearanceEffect: ProductPack["rules"][number]["clearanceEffect"];
    failureEffect: ProductPack["rules"][number]["failureEffect"];
    derivedFromTradeRemedy: boolean;
  }>;
}

function displayName(pack: ProductPack): JourneyProduct["displayName"] {
  if (pack.id.includes("headphones")) return "Bluetooth headphones";
  if (pack.id.includes("camera")) return "Indoor IP camera";
  return "Wi-Fi router";
}

export function toJourneyProduct(pack: ProductPack): JourneyProduct {
  return {
    id: pack.id,
    displayName: displayName(pack),
    title: pack.title,
    version: pack.version,
    lifecycleStatus: pack.lifecycleStatus,
    hsCode: pack.hsMapping.hsCode,
    hsLabel: pack.hsMapping.label,
    scopeName: pack.scenario.name,
    includedFacts: structuredClone(pack.scenario.includedFacts),
    requiredDistinguishingFacts: [...pack.scenario.requiredDistinguishingFacts],
    excludedVariants: [...pack.scenario.excludedVariants],
    admittedAt: pack.admittedAt,
    reviewAfter: pack.sources.reduce(
      (earliest, source) => (source.reviewAfter < earliest ? source.reviewAfter : earliest),
      pack.sources[0]!.reviewAfter,
    ),
    rules: pack.rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      requiredEvidence: [...rule.requiredEvidence],
      clearanceEffect: rule.clearanceEffect,
      failureEffect: rule.failureEffect,
      derivedFromTradeRemedy: /trade_remedy/.test(rule.id),
    })),
  };
}

export async function getPublicJourneyProducts(
  asOf = currentAssessmentDate(),
): Promise<JourneyProduct[]> {
  const sourcePacks = await loadSourceAdmittedPacks();
  return getPublicProductCatalog(sourcePacks, PROMOTION_EVIDENCE, asOf).packs.map(
    toJourneyProduct,
  );
}

export async function getPromotionHarnessProducts(): Promise<JourneyProduct[]> {
  return (await loadSourceAdmittedPacks()).map(toJourneyProduct);
}
