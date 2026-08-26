# Pre-order Readiness Rescue Implementation Plan

**Decision:** Courtroom hybrid ruling: adopt the focused Pre-order Readiness Dossier as the default product path while preserving the existing agent, evidence, case, document, calculation, and India-to-China capabilities behind an explicit deep-research path.

**Goal:** In one 3-4 hour execution window, make ordinary chat responses immediate and deterministic, keep full agent research opt-in, and prove the current primary China-to-India preparation journey without deleting prior work.

**Architecture:** `/api/chat` receives an explicit `mode` with a safe default of `instant`. Instant mode uses only saved Trade Case facts and the bundled admitted DGFT reference; it never creates a model runtime or invokes web search. Deep-research mode reuses the current Agents SDK path unchanged. The existing `ReadinessAssessment` remains the dossier renderer; the UI adds only one accessible deep-research action after an incomplete instant result.

**Tech stack:** Next.js 16 App Router, React 19, TypeScript, Zod, `node:sqlite`, OpenAI Agents SDK, Vitest, Playwright, Axe.

## Locked Scope

### Core user

A first-time Indian importer considering a China-origin commercial order before paying the supplier.

### Primary promise

> Immediately show what is confirmed, the admitted baseline import reference, the next missing fact group, what has not been checked, and the next action. Run broader product research only when the user explicitly asks.

### In scope

- Default `/api/chat` mode is `instant`.
- General IEC and baseline-document questions always use the bundled admitted DGFT reference, even when AI is configured.
- Shipment questions immediately persist clearly stated facts and return one next missing fact group.
- China-to-India instant triage may cite the bundled DGFT IEC/baseline-document reference; it must label all product-specific rules, classification, agencies, controls, rates, and Customs status as not checked.
- India-to-China code and data remain intact. Instant mode may capture that lane, but it must state that product-specific destination research was not run.
- Existing full agent execution remains available only through explicit `deep_research` mode.
- One visible, accessible `Research this case deeply` action appears only after an incomplete instant result and warns that it may take longer.
- Existing conversation persistence, contradiction handling, uploads, citations, deterministic calculation tools, and no-provider behavior remain intact.
- Tests prove instant mode does not call the provider or hosted search.

### Explicitly out of scope

- Compliance knowledge graph, FTS5, embeddings, corpus expansion, new sources, or new evidence admission.
- New product packs or restoration of the retired fixed-product selector.
- Expanding, deleting, or rewriting India-to-China support.
- Changing the existing deep agent prompt, tool set, `maxTurns`, model, provider, or evidence contracts.
- Background jobs, automatic research, caching infrastructure, authentication, deployment, Plane, commits, or pushes.
- New pages, navigation, branding, illustration, animation, design system, component library, or visual redesign.
- Refactoring unrelated large files, renaming domain concepts, or cleaning the dirty worktree.

### What is removed

No code, database, evidence, test, or capability is deleted. Only the default route changes: the full agent is no longer invoked automatically for every ordinary question.

## Non-negotiable Acceptance Gates

1. Default general-reference and shipment-triage requests complete without constructing or calling a model runtime.
2. A configured provider cannot force a known IEC question through Agents SDK or web search.
3. China-to-India instant triage returns saved facts, one material next question, admitted baseline evidence where applicable, explicit unchecked scope, and no positive clearance conclusion.
4. Deep research requires explicit `mode: "deep_research"` and still uses the existing `runReferenceGuidance` implementation.
5. Initial UI feedback is immediate; the response body for deterministic paths is bounded by local work only.
6. The deep-research action is keyboard-accessible, visible at 360 px, and absent when no incomplete instant result exists.
7. Focused unit tests, route tests, typecheck, lint, production build, targeted desktop/mobile Playwright, Axe, and horizontal-overflow checks pass.
8. No unrelated file is modified, deleted, reset, cleaned, stashed, committed, pushed, or published.

## Scope-change rule

The scope is immutable during execution. A worker encountering a missing prerequisite must stop and report it. It may not add a dependency, new data model, new source, new screen, new product, refactor, or fallback. A scope change requires explicit user approval and removal of work of equal or greater cost from this plan.

## Time and coordination contract

- Total wall-clock budget: 230 minutes maximum.
- Task Chat 1: 80 minutes; coordinator review: 10 minutes.
- Task Chat 2: 65 minutes; coordinator review: 10 minutes.
- Task Chat 3: 45 minutes; final buffer: 20 minutes.
- Tasks execute sequentially because Chat 1 and Chat 2 touch the shared chat contract.
- One task per Codex chat. A worker may not create or dispatch a successor.
- Only the coordinator dispatches the next chat after verifying the prior report.
- The coordinator waits using the existing task/thread monitor and does not create duplicates.
- A worker blocked for 10 minutes stops, preserves the tree, and reports the exact blocker and evidence.
- At the 210-minute mark, implementation stops and the remaining 20 minutes are reserved for the final gates and honest handoff.

## Required worker report

Every task chat returns only:

1. Outcome: complete or blocked.
2. Exact files changed.
3. Red test observed before implementation.
4. Exact verification commands and results.
5. Scope audit: additions outside the allowlist, expected `none`.
6. Processes started, reused, stopped, and preserved.
7. Remaining blocker, expected `none` when complete.

---

## Task Chat 1: Make instant guidance the default vertical slice

**Timebox:** 80 minutes.

**User-visible result:** A known IEC question or ordinary shipment message returns local, cited guidance or the next missing fact without waiting for the provider. Existing deep research remains reachable through the API only when explicitly requested.

**Allowed files:**

- Modify: `src/app/api/chat/route.ts`
- Modify: `src/server/agent/guidance.ts`
- Modify: `src/server/agent/compliance-tools.ts`
- Modify: `tests/agent-first/routes.test.ts`
- Modify: `tests/agent-first/live-guidance.test.ts` only if its request must opt into deep research

**Forbidden files:** Every path not listed above.

**Interfaces produced:**

```ts
type GuidanceMode = "instant" | "deep_research";

type ChatExecutionMode =
  | "instant_reference"
  | "instant_preorder_triage"
  | "agents_sdk_deep_research"
  | "deep_research_unavailable";

const RequestSchema = z.object({
  tradeCaseId: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(2_000),
  mode: z.enum(["instant", "deep_research"]).default("instant"),
}).strict();
```

```ts
export function resolveChatExecutionMode(input: {
  aiAvailable: boolean;
  generalReferenceQuestion: boolean;
  requestedMode: GuidanceMode;
}): ChatExecutionMode;
```

```ts
export async function runInstantGuidance(input: {
  conversationStore: ConversationStore;
  kind: "general_reference" | "shipment_triage";
  question: string;
  regulatoryStore: RegulatoryStore;
  sourcesRoot: string;
  tradeCaseId: string;
  onActivity?: ResearchActivitySink;
}): Promise<{ output: ComplianceOutput; citations: CitationRecord[] }>;
```

`runDeterministicReferenceGuidance` remains as a compatibility wrapper around `runInstantGuidance({ kind: "general_reference" })`; no current caller or test loses its import.

- [ ] **Step 1: Write the route regressions before production edits**

Add route tests that configure the provider environment with test-only values, call `/api/chat` without `mode`, and assert:

```ts
expect(result.mode).toBe("instant_reference");
expect(result.output.claims).toHaveLength(1);
expect(result.output.summary).not.toMatch(/AI is unavailable/i);
expect(result.tradeCase.confirmedFacts).not.toEqual(expect.arrayContaining([
  expect.objectContaining({ name: "trade_direction" }),
]));
```

Add an ordinary shipment test and assert:

```ts
expect(result.mode).toBe("instant_preorder_triage");
expect(result.output.state).toBe("assessment_incomplete");
expect(result.output.confirmedFacts).toEqual(expect.arrayContaining([
  { name: "trade_direction", value: "china_to_india" },
  expect.objectContaining({ name: "product_description" }),
]));
expect(result.output.nextQuestion).toMatch(/make|model|part number|principal function/i);
expect(result.output.notChecked.join(" ")).toMatch(/classification.*product-specific.*Customs/i);
expect(result.output.summary).not.toMatch(/approved|compliant|will clear|AI is unavailable/i);
```

Add pure routing-decision assertions without constructing a model runtime:

```ts
expect(resolveChatExecutionMode({
  aiAvailable: true,
  generalReferenceQuestion: false,
  requestedMode: "deep_research",
})).toBe("agents_sdk_deep_research");

expect(resolveChatExecutionMode({
  aiAvailable: false,
  generalReferenceQuestion: false,
  requestedMode: "deep_research",
})).toBe("deep_research_unavailable");
```

Also call the route with `mode: "deep_research"` while provider configuration is absent and assert a bounded `deep_research_unavailable` result. Do not mock or contact a provider in this test.

- [ ] **Step 2: Run the focused test and record the expected red state**

Run:

```bash
pnpm vitest run tests/agent-first/routes.test.ts
```

Expected before implementation: the new assertions fail because configured AI still selects `agents_sdk_compliance`, the request schema rejects `mode`, or the new instant modes do not exist.

- [ ] **Step 3: Expose the existing next-missing-fact decision**

Export the existing `nextMissingGroup` helper from `compliance-tools.ts` without changing its ordering or wording. `runInstantGuidance` calls it with the active facts, existing classification memory if already present, and current document reviews. Do not create a second missing-fact algorithm.

- [ ] **Step 4: Implement neutral deterministic guidance**

Add `runInstantGuidance` in `guidance.ts` using the existing bundled reference, `ComplianceOutputSchema`, `resolveOutputCitations`, `TradeCaseSession`, and `persistGuidance` seams.

For `general_reference`:

- return `research_guidance`;
- include the admitted DGFT claim and citation;
- use neutral copy: `Checked the bundled admitted DGFT reference.`;
- do not mention provider availability.

For `shipment_triage`:

- return `assessment_incomplete`;
- include the DGFT baseline claim only when the saved direction is `china_to_india`;
- return the one missing group from `nextMissingGroup`;
- put that group in `missingInformation`, `nextActions`, and `nextQuestion`;
- keep product research, classifications, agencies, controls, document findings, and calculation empty unless they already exist as saved case state;
- state that product-specific applicability, rates, filing, inspection, and Customs clearance were not checked;
- never run web search or evidence admission.

- [ ] **Step 5: Route explicitly by mode**

After conflict handling and fact persistence, use this branch order in `route.ts`:

```ts
if (generalReferenceQuestion) {
  // Always local, regardless of provider availability.
  return emitInstantReference();
}

if (parsed.mode === "deep_research") {
  // Existing runReferenceGuidance path; emit a clear unavailable result when no provider exists.
  return emitDeepResearch();
}

return emitInstantShipmentTriage();
```

Use response modes `instant_reference`, `instant_preorder_triage`, `agents_sdk_deep_research`, and `deep_research_unavailable`. Preserve conflict-resolution precedence and database cleanup in `finally`.

- [ ] **Step 6: Keep the live provider gate explicit**

Update the live guidance entry point only if necessary so it explicitly requests deep research. The live test must continue to test Agents SDK; it must not accidentally pass through instant mode.

- [ ] **Step 7: Verify Task Chat 1**

Run:

```bash
pnpm vitest run tests/agent-first/routes.test.ts tests/agent-first/live-research.test.ts tests/agent-first/agents-sdk-orchestration.test.ts
pnpm typecheck
```

Expected: all selected tests and typecheck pass. Do not run the live provider in this task.

**Stop condition:** Instant reference, instant shipment triage, and explicit deep routing are green without modifying any forbidden file.

---

## Task Chat 2: Expose opt-in deep research without redesigning chat

**Blocked by:** Task Chat 1 accepted by the coordinator.

**Timebox:** 65 minutes.

**User-visible result:** The default chat remains immediate. After an incomplete instant shipment result, one secondary action lets the user explicitly run the preserved deeper agent path with a clear time warning.

**Allowed files:**

- Modify: `src/components/chat-first-workspace.tsx`
- Modify: `src/app/styles.css` only if an existing button style cannot express the secondary action
- Modify: `tests/browser/preflight.spec.ts`

**Forbidden files:** Every path not listed above. No new dependency or component file.

**Interface consumed:** `/api/chat` accepts `mode: "instant" | "deep_research"` and returns the three Task Chat 1 modes.

- [ ] **Step 1: Write the browser regression before UI edits**

Extend the existing `send` helper to accept an optional mode and capture the request body. Add a desktop test that:

1. sends a China-to-India product question;
2. verifies the request body defaults to `mode: "instant"`;
3. sees an `Assessment incomplete` result and the next material question;
4. sees one `Research this case deeply` button with text warning that it may take longer;
5. clicks it;
6. verifies the next `/api/chat` request contains `mode: "deep_research"`.

Update the existing opt-in live black-box browser test to call `send` with `deep_research`; otherwise it would correctly exercise only instant triage after Task Chat 1.

Add 360 px and keyboard assertions:

```ts
await expect(page.getByRole("button", { name: "Research this case deeply" })).toBeVisible();
await page.getByRole("button", { name: "Research this case deeply" }).focus();
await expect(page.getByRole("button", { name: "Research this case deeply" })).toBeFocused();
await expectNoHorizontalOverflow(page);
```

- [ ] **Step 2: Run the focused browser test and record the expected red state**

Run only the new deterministic desktop test against the existing Playwright-managed app. Expected before implementation: the action is absent and request mode is not present.

- [ ] **Step 3: Refactor submission without changing layout**

Extract the existing fetch/NDJSON body of `sendMessage` into:

```ts
async function submitQuestion(question: string, mode: "instant" | "deep_research")
```

The form calls `submitQuestion(question, "instant")`. The deep action calls:

```ts
submitQuestion(
  "Research the unresolved product-specific requirements for this saved shipment case.",
  "deep_research",
)
```

Keep the current pending-message, activity-stream, error restoration, focus return, persistence, citation, upload, and active-case behavior.

- [ ] **Step 4: Add one restrained secondary action**

Show the action only when all are true:

```ts
latestOutput?.state === "assessment_incomplete"
&& activeCase !== null
&& !sending
&& ai.available
```

Copy:

- Button: `Research this case deeply`
- Supporting text: `Optional. This checks broader product-specific sources and may take 10-30 seconds.`

Use the existing button typography, border, focus-visible treatment, responsive spacing, and reduced-motion behavior. Do not add animation, illustration, modal, toast, navigation, side rail, or new color token.

- [ ] **Step 5: Verify Task Chat 2**

Run:

```bash
pnpm vitest run tests/agent-first/routes.test.ts
pnpm playwright test tests/browser/preflight.spec.ts --grep "instant|deeply|desktop chat meets|360px chat keeps"
pnpm typecheck
```

Expected: focused route and browser gates pass with zero Axe violations and no horizontal overflow.

**Stop condition:** Default UI sends instant mode, deep research is explicit and accessible, and no visual redesign or new dependency exists.

---

## Task Chat 3: Integrated gate and scope audit

**Blocked by:** Task Chat 2 accepted by the coordinator.

**Timebox:** 45 minutes.

**Deliverable:** Evidence that the locked rescue works end to end and has not damaged the preserved agent path.

**Allowed production files:** None.

**Allowed test changes:** None unless a test assertion is demonstrably stale because it names the replaced response mode; any such change requires coordinator approval before editing.

- [ ] **Step 1: Inspect processes before tests**

Resolve listeners and ownership before starting Playwright. Reuse a compatible healthy app; otherwise allow Playwright to own and clean its server. Never terminate unrelated listeners.

- [ ] **Step 2: Run deterministic gates**

```bash
pnpm vitest run tests/agent-first tests/contracts
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all non-opt-in tests pass; only explicitly opt-in live tests may be skipped.

- [ ] **Step 3: Run targeted rendered gates**

```bash
pnpm playwright test tests/browser/preflight.spec.ts --grep "opens with|instant|deeply|desktop chat meets|360px chat keeps"
```

Expected: desktop and 360 px journeys pass, Axe reports zero violations, and no horizontal overflow exists.

- [ ] **Step 4: Run one bounded live deep-research gate**

Load the existing provider environment without printing it and run exactly one existing live guidance scenario. Expected: one evidence-backed result completes through the explicit deep-research path without the forced-tool error. Do not run an arbitrary-product matrix.

- [ ] **Step 5: Prove the fast-path boundary**

Report route-test evidence that default instant requests never construct or call the model runtime. Do not claim a latency percentile from a single local run. Report one observed browser duration separately as an observation, not an SLA.

- [ ] **Step 6: Audit scope and processes**

Verify only allowed files changed, `git diff --check` passes on them, no provider secret appears in output or diffs, no new dependency exists, and no task-owned listener remains.

**Stop condition:** All gates are green, or the task reports the first exact failing gate without implementing a workaround.

---

## Coordinator dispatch contract

The coordinator sends each worker the following immutable preamble:

> Execute exactly one named task from `docs/superpowers/plans/2026-08-26-pre-order-readiness-rescue.md`. Read the plan and repository instructions completely. Modify only the allowed files. Use TDD. Do not create successors, Plane work, commits, pushes, sources, dependencies, refactors, or scope changes. Preserve the dirty tree and private provider configuration. Stop after the task's stop condition and report using the Required worker report format.

After dispatch, the coordinator waits for that task's completion or genuine input request. It reviews the diff, red/green evidence, scope audit, and process report before dispatching the next task. A failed review returns only the same task for correction; it never creates a fourth implementation task.

## Adversarial approval checklist

- The plan does not claim the missing compliance knowledge graph can be built in four hours.
- The plan fixes the measured latency cause by removing provider turns from the default path.
- The plan does not make unsupported products appear assessed.
- The plan does not delete broad capabilities or surrender the long-term architecture.
- The plan makes deep research explicit and honestly slower.
- The plan contains no new product, jurisdiction, source, screen, dependency, or visual redesign.
- The plan has a hard time ceiling, file allowlists, stop conditions, and one-task-per-chat control.

## Judge-verdict approval checklist

- Option B supplies the default product promise, fast path, dossier semantics, and primary China-to-India user.
- Option A supplies the preserved agent, evidence admission, memory, documents, calculations, and optional deep research.
- The hybrid is not a compromise-by-addition: the ordinary path becomes smaller while advanced machinery is retained behind explicit intent.
- The outcome is independently demonstrable after Task Chat 1 and remains usable even if the optional live provider is unavailable.

## Final scope lock

Once this plan is approved, execution may change implementation details only when required to satisfy an acceptance gate inside an allowed file. It may not change the user, promise, jurisdictions, modes, evidence boundary, task count, time ceiling, or out-of-scope list without explicit user approval.
