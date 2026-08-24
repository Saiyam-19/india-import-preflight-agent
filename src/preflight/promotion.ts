import {
  assessPackAdmission,
  canProducePublicLegalResult,
  getPublicRuntimePacks,
  type ProductPack,
} from "@/knowledge";

import { evaluatePreflight, requestFromFixture } from "./engine";
import {
  PreflightReportSchema,
  PromotionEvidenceSchema,
  type PreflightOutcome,
  type PromotionEvidence,
} from "./schema";

const REQUIRED_OUTCOMES = ["blocked", "needs_verification", "ready"] as const;

function hasExactOutcomes(values: readonly PreflightOutcome[]): boolean {
  return JSON.stringify([...new Set(values)].sort()) === JSON.stringify(REQUIRED_OUTCOMES);
}

export function runRestrictedPromotionHarness(pack: ProductPack, asOf: string) {
  const failures: string[] = [];
  const admission = assessPackAdmission(pack, asOf);
  if (!admission.admitted) failures.push("source_admission");

  const outcomes: PreflightOutcome[] = [];
  if (admission.admitted) {
    for (const fixture of pack.fixtures) {
      const report = evaluatePreflight(pack, requestFromFixture(pack, fixture), {
        access: "promotion_harness",
        asOf: fixture.reviewedAt,
      });
      if (!PreflightReportSchema.safeParse(report).success) {
        failures.push(`fixture.${fixture.id}.schema`);
      }
      if (report.outcome !== fixture.expectedOutcome) {
        failures.push(`fixture.${fixture.id}.outcome`);
      }
      outcomes.push(report.outcome);
    }
  }
  if (!hasExactOutcomes(outcomes)) failures.push("fixtures.outcomes");

  return {
    passed: failures.length === 0,
    productPackId: pack.id,
    outcomes: [...new Set(outcomes)].sort(),
    failures: [...new Set(failures)].sort(),
  };
}

export function promotePack(
  sourcePack: ProductPack,
  candidateEvidence: PromotionEvidence,
  asOf: string,
): { pack: ProductPack | null; failures: string[] } {
  const failures: string[] = [];
  const admission = assessPackAdmission(sourcePack, asOf);
  if (!admission.admitted) failures.push("source_admission");

  const parsedEvidence = PromotionEvidenceSchema.safeParse(candidateEvidence);
  if (!parsedEvidence.success) {
    failures.push(
      ...parsedEvidence.error.issues.map((issue) =>
        issue.path.length > 0 ? `evidence.${issue.path.join(".")}` : "evidence.schema",
      ),
    );
  } else {
    const evidence = parsedEvidence.data;
    if (evidence.productPackId !== sourcePack.id) failures.push("evidence.productPackId");
    if (evidence.verifiedAt !== sourcePack.admittedAt || evidence.verifiedAt > asOf) {
      failures.push("evidence.verifiedAt");
    }
    if (!hasExactOutcomes(evidence.unit)) failures.push("evidence.unit");
    if (!hasExactOutcomes(evidence.contract)) failures.push("evidence.contract");
    if (!hasExactOutcomes(evidence.browser.desktop)) failures.push("evidence.browser.desktop");
    if (!hasExactOutcomes(evidence.browser.mobile360)) failures.push("evidence.browser.mobile360");
  }

  const harness = runRestrictedPromotionHarness(sourcePack, asOf);
  failures.push(...harness.failures.map((failure) => `harness.${failure}`));
  if (failures.length > 0) return { pack: null, failures: [...new Set(failures)].sort() };

  const promoted = structuredClone(sourcePack);
  promoted.lifecycleStatus = "full_support";
  promoted.selectable = true;
  promoted.publicRuntimeEnabled = true;
  promoted.version = promoted.version.replace("source-admitted", "full-support");
  if (!canProducePublicLegalResult(promoted, asOf)) {
    return { pack: null, failures: ["public_runtime_eligibility"] };
  }
  return { pack: promoted, failures: [] };
}

export function getPublicProductCatalog(
  sourcePacks: ProductPack[],
  evidenceRecords: PromotionEvidence[],
  asOf: string,
): {
  packs: ProductPack[];
  failures: Array<{ productPackId: string; failures: string[] }>;
} {
  const promoted: ProductPack[] = [];
  const failures: Array<{ productPackId: string; failures: string[] }> = [];
  for (const sourcePack of sourcePacks) {
    const evidence = evidenceRecords.find((record) => record.productPackId === sourcePack.id);
    if (!evidence) {
      failures.push({ productPackId: sourcePack.id, failures: ["evidence.missing"] });
      continue;
    }
    const result = promotePack(sourcePack, evidence, asOf);
    if (result.pack) promoted.push(result.pack);
    else failures.push({ productPackId: sourcePack.id, failures: result.failures });
  }
  return { packs: getPublicRuntimePacks(promoted, asOf), failures };
}
