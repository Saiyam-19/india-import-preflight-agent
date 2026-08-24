import { describe, expect, it } from "vitest";

import {
  PROMOTION_EVIDENCE,
} from "@/preflight/promotion-evidence";
import {
  canProducePublicLegalResult,
  loadSourceAdmittedPacks,
  type ProductPack,
} from "@/knowledge";
import {
  PromotionEvidenceSchema,
  currentAssessmentDate,
  getPublicProductCatalog,
  promotePack,
  runRestrictedPromotionHarness,
  type PromotionEvidence,
} from "@/preflight";

const AS_OF = "2026-08-24";
const OUTCOMES = ["ready", "blocked", "needs_verification"] as const;

function completeEvidence(pack: ProductPack): PromotionEvidence {
  return {
    productPackId: pack.id,
    verifiedAt: AS_OF,
    unit: [...OUTCOMES],
    contract: [...OUTCOMES],
    browser: {
      desktop: [...OUTCOMES],
      mobile360: [...OUTCOMES],
    },
  };
}

describe("independent full-support promotion", () => {
  it("uses the India calendar date at the assessment boundary", () => {
    expect(currentAssessmentDate(new Date("2026-08-23T21:30:00.000Z"))).toBe(
      "2026-08-24",
    );
  });

  it("exercises all three source-admitted fixture journeys before each independent promotion", async () => {
    for (const pack of await loadSourceAdmittedPacks()) {
      const harness = runRestrictedPromotionHarness(pack, AS_OF);
      expect(harness).toEqual({
        passed: true,
        productPackId: pack.id,
        outcomes: ["blocked", "needs_verification", "ready"],
        failures: [],
      });

      const evidence = completeEvidence(pack);
      expect(PromotionEvidenceSchema.safeParse(evidence).success).toBe(true);
      const result = promotePack(pack, evidence, AS_OF);

      expect(result.failures).toEqual([]);
      expect(result.pack).toMatchObject({
        id: pack.id,
        lifecycleStatus: "full_support",
        selectable: true,
        publicRuntimeEnabled: true,
      });
      expect(result.pack && canProducePublicLegalResult(result.pack, AS_OF)).toBe(true);
    }
  });

  it("allows only independently verified full-support packs into the selectable catalog", async () => {
    const packs = await loadSourceAdmittedPacks();
    const catalog = getPublicProductCatalog(packs, PROMOTION_EVIDENCE, AS_OF);

    expect(catalog.failures).toEqual([]);
    expect(catalog.packs).toHaveLength(3);
    expect(catalog.packs.map((pack) => pack.id).sort()).toEqual(
      packs.map((pack) => pack.id).sort(),
    );
    for (const pack of catalog.packs) {
      expect(pack.lifecycleStatus).toBe("full_support");
      expect(pack.selectable).toBe(true);
      expect(pack.publicRuntimeEnabled).toBe(true);
    }
    expect(PROMOTION_EVIDENCE.map((record) => record.productPackId).sort()).toEqual(
      packs.map((pack) => pack.id).sort(),
    );
  });

  it("fails promotion closed for candidate, stale, incomplete, mismatched, or product-crossed proof", async () => {
    const [router, headphones] = await loadSourceAdmittedPacks();
    const baseEvidence = completeEvidence(router!);

    const candidate = structuredClone(router!);
    candidate.lifecycleStatus = "candidate";
    expect(promotePack(candidate, baseEvidence, AS_OF).failures).toContain("source_admission");

    const stale = structuredClone(router!);
    stale.sources[0]!.reviewAfter = AS_OF;
    expect(promotePack(stale, baseEvidence, AS_OF).failures).toContain("source_admission");

    const incomplete = structuredClone(baseEvidence);
    incomplete.browser.mobile360 = ["ready", "blocked"];
    expect(promotePack(router!, incomplete, AS_OF).failures).toContain(
      "evidence.browser.mobile360",
    );

    const crossed = completeEvidence(headphones!);
    expect(promotePack(router!, crossed, AS_OF).failures).toContain(
      "evidence.productPackId",
    );

    const mismatchedPack = structuredClone(router!);
    mismatchedPack.fixtures[0] = structuredClone(headphones!.fixtures[0]!);
    expect(promotePack(mismatchedPack, baseEvidence, AS_OF).failures).toContain(
      "source_admission",
    );
  });

  it("does not promote any product when its own browser evidence is absent", async () => {
    const packs = await loadSourceAdmittedPacks();
    const onlyRouterEvidence = [completeEvidence(packs[0]!)];
    const catalog = getPublicProductCatalog(packs, onlyRouterEvidence, AS_OF);

    expect(catalog.packs).toHaveLength(1);
    expect(catalog.packs[0]!.id).toBe(packs[0]!.id);
    expect(catalog.failures).toContainEqual(
      expect.objectContaining({ productPackId: packs[1]!.id }),
    );
    expect(catalog.failures).toContainEqual(
      expect.objectContaining({ productPackId: packs[2]!.id }),
    );
  });

  it("ties promotion proof to admission while enforcing current source-review dates", async () => {
    const packs = await loadSourceAdmittedPacks();
    const afterPromotion = getPublicProductCatalog(
      packs,
      PROMOTION_EVIDENCE,
      "2026-08-25",
    );

    expect(afterPromotion.failures).toEqual([]);
    expect(afterPromotion.packs).toHaveLength(3);

    const afterSourceExpiry = getPublicProductCatalog(
      packs,
      PROMOTION_EVIDENCE,
      "2026-09-25",
    );
    expect(afterSourceExpiry.packs).toEqual([]);
    expect(afterSourceExpiry.failures).toHaveLength(3);
  });
});
