import type { PromotionEvidence } from "./schema";

// Evidence is added independently for each product only after its unit, contract,
// desktop-browser, and 360px-browser Ready/Blocked/Needs journeys pass.
const COMPLETE_OUTCOMES = ["ready", "blocked", "needs_verification"] as const;

export const PROMOTION_EVIDENCE: PromotionEvidence[] = [
  {
    productPackId: "india-retail-wifi-router-mimo-v1",
    verifiedAt: "2026-08-24",
    unit: [...COMPLETE_OUTCOMES],
    contract: [...COMPLETE_OUTCOMES],
    browser: {
      desktop: [...COMPLETE_OUTCOMES],
      mobile360: [...COMPLETE_OUTCOMES],
    },
  },
  {
    productPackId: "india-retail-over-ear-bluetooth-headphones-v1",
    verifiedAt: "2026-08-24",
    unit: [...COMPLETE_OUTCOMES],
    contract: [...COMPLETE_OUTCOMES],
    browser: {
      desktop: [...COMPLETE_OUTCOMES],
      mobile360: [...COMPLETE_OUTCOMES],
    },
  },
  {
    productPackId: "india-retail-indoor-wifi-ip-camera-v1",
    verifiedAt: "2026-08-24",
    unit: [...COMPLETE_OUTCOMES],
    contract: [...COMPLETE_OUTCOMES],
    browser: {
      desktop: [...COMPLETE_OUTCOMES],
      mobile360: [...COMPLETE_OUTCOMES],
    },
  },
];
