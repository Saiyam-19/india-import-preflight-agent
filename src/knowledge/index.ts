export {
  assessPackAdmission,
  calculateProductCosts,
  calculateRouterCosts,
  canProducePublicLegalResult,
  evaluatePackFixture,
  evaluateRouterFixture,
  getPublicRuntimePacks,
  matchProductScenario,
  matchRouterScenario,
} from "./admission";
export { cameraPack } from "./camera-pack";
export { headphonesPack } from "./headphones-pack";
export { routerPack } from "./router-pack";
export { ProductPackSchema } from "./schema";
export type {
  CostLine,
  FixtureFacts,
  FixtureOutcome,
  ProductPack,
  ProductScenario,
  RouterScenario,
} from "./schema";

import { cameraPack } from "./camera-pack";
import { headphonesPack } from "./headphones-pack";
import { routerPack } from "./router-pack";
import type { ProductPack } from "./schema";

export async function loadRouterPack(): Promise<ProductPack> {
  return structuredClone(routerPack);
}

export async function loadHeadphonesPack(): Promise<ProductPack> {
  return structuredClone(headphonesPack);
}

export async function loadCameraPack(): Promise<ProductPack> {
  return structuredClone(cameraPack);
}

export async function loadSourceAdmittedPacks(): Promise<ProductPack[]> {
  return structuredClone([routerPack, headphonesPack, cameraPack]);
}
