# BWMI-14 Verification — Fail-Closed Other Product

Date: 24 August 2026  
Scope: Plane ticket `BWMI-14` only

## Delivered boundary

- Added `Other product` as a selector path outside the independently admitted product-pack registry.
- Added a strict universal-facts request and a separate unsupported-product report schema.
- Preserved product description, model, manufacturer, supplier, origin, importer, producer, exporter, quantity, Incoterm, destination, and entered item/freight/insurance facts.
- Returned `Needs verification` and explicitly withheld classification and numeric cost because this release has no independently admitted universal Customs blocker.
- Named supported checks, unsupported checks, unresolved facts, and licensed Customs Broker review needed.
- Rendered the Customs Broker summary on screen without a dashboard, download, account, or override flow.
- Kept all three admitted product packs, their promotion evidence, their evaluator, and their existing Ready/Blocked/Needs verification behavior unchanged.

## Test-first evidence

The first focused run failed before implementation:

- `OtherProductAssessmentRequestSchema` was undefined.
- `evaluateOtherProduct` did not exist.
- Result: 2 failed tests in `tests/preflight/other-product.test.ts`.

After implementation, the focused evaluator, route, existing engine, and promotion checks passed together:

- 3 test files passed.
- 15 tests passed.
- Strict TypeScript passed.

The Other-product browser journey then passed independently on desktop and 360-pixel viewports, including Axe and horizontal-overflow assertions.

## Final gates

- `npm test`: 45 passed; the opt-in live OpenAI extraction test remained intentionally skipped.
- `npm run typecheck`: passed under strict TypeScript.
- `npm run lint`: passed.
- `npm run build`: Next.js 16.3 production build passed.
- Production `node_modules/.bin/playwright test`: 26/26 passed across desktop and 360-pixel projects.
- The full production matrix reverified all three outcomes for each admitted product, public selector/keyboard/Axe behavior, restricted-harness isolation, Other-product fail-closed behavior, and the synthetic router document journey.
- Impeccable detector after the UI changes: no warning-severity anti-patterns.
- Manual visual review used:
  - `/private/tmp/bwmi-14-other-product-desktop.png`
  - `/private/tmp/bwmi-14-other-product-mobile-360.png`

## Graph and process evidence

- The watched codebase graph refreshed to 746 nodes and 1,657 edges.
- Every operated source and test path reported no recorded indexing issue; no parse-partial or skipped source files were reported.
- The graph traced `POST /api/preflight` as the inbound caller of `evaluateOtherProduct`.
- Focused Playwright dev servers stopped after each run.
- The production verification server listened on `127.0.0.1:3210` as PID 75385 from this project and was stopped after the suite.
- Port 3210 was clear after cleanup; the pre-existing codebase-memory service on port 9749 was preserved.

## Explicit non-deliverables

No fourth product pack, guessed classification, product-specific rule, document list, rate, cost, dashboard, download, broker workspace, account, persistence, override, deployment, or release-ticket work was added.
