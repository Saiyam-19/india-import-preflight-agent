# BWMI-17 secure evidence-admission verification

**Date:** 2026-08-25  
**Runtime scope:** bilateral India-China trade only, in both directions  
**Work item:** BWMI-17 — Close live official-source gaps with secure evidence admission

## Acceptance evidence

- The Agents SDK `webSearchTool` receives only the available India/China registry domains through `filters.allowedDomains`. Search is discovery-only; its prose and empty results never enter the evidence store.
- `admit_source_evidence` enforces `discovered -> snapshotted -> extracted -> validated -> admitted`. It content-addresses immutable document bytes separately from claim identity, pins the resolved public address through TLS, records redirects and hashes, and validates authority, instrument title/identifier, effectivity and admitted amendment lineage, case-owned applicability, translation state, an exact structural locator-to-excerpt span, and exact claim text. Authority, instrument title/identifier, and applicability each carry a separately persisted exact evidence span rather than relying on document-wide substring presence.
- The retrieval boundary permits HTTPS on port 443 only; rejects URL credentials, IP literals, non-registry domains, private/loopback/link-local/multicast/special-use DNS answers, and unsafe redirects; normalizes dotted and hexadecimal IPv4-mapped IPv6 forms before classification; pins the validated address to close DNS rebinding; and applies the same validation to every redirect while bounding DNS, connection, response-body time, redirects, content type, and bytes.
- Direct classifier and retrieval regressions cover `::ffff:7f00:1`, `::ffff:a9fe:1`, `::ffff:c0a8:1`, IPv4-mapped public forms, `ff02::1`, IPv6 documentation space, and IPv4 TEST-NET ranges, including initial DNS answers and an official-domain redirect that resolves to a mapped private address.
- Retrieved source content is never placed in model instructions. Any detected instruction-like retrieved content is quarantined after immutable snapshotting and cannot be admitted; instruction-like proposed claim or translation text is rejected with a visible gap.
- Only `admitted` rows resolve as citations, and live selection is rechecked against the active case direction and destination. The pinned DGFT reference now has an explicit conservative evidence-review horizon (`2026-09-25`) and conflict state; bootstrap cannot reset either state, and both materialization and citation resolution fail closed when it is stale or conflicting. Stale, same-locator conflicting, manual, login-required, unavailable, unsupported, untranslated, ambiguous, unknown-amendment, scope-mismatched, locator-invalid, hostile-claim, and empty-search states return typed gaps and no positive conclusion.
- The NDJSON chat route streams activity records only while work is in progress. A factual result is emitted after server-side source-ID, locator, and claim-text validation. The UI shows checking/searching/admission activity and incomplete evidence without leaking transient state between Trade Cases.
- Trade Case facts own the bilateral direction. The DGFT India-import reference cannot answer an India-to-China case; live tool callers cannot supply or override `tradeDirection` or `appliesIn`.
- `CONTEXT.md`, ADR 0003 and 0012, the shared-understanding specification, its adversarial review, `PRODUCT.md`, and `DESIGN.md` name India-China as the exclusive v1 runtime and label UAE/US as deferred with no runtime support. The product/design records describe persistent Trade Cases and fail-closed evidence chat without changing the approved visual behavior.

## Pinned real official evidence

| Jurisdiction | Official source | Exact deterministic locator | SHA-256 |
| --- | --- | --- | --- |
| India | DGFT, Foreign Trade Policy 2023, updated Chapter 2 | Chapter 2, paragraphs 2.05(a)-(c) and 2.06(b)-(d) | `f16265d88b82a6ce9f4a8436216e0b237953b587f723236a367960388d41edac` |
| China | National People's Congress Standing Committee, `中华人民共和国进出口商品检验法（2021修正）`, instrument `中华人民共和国主席令第81号` (official MOFCOM-hosted record) | `第五条` | `1b536c3036318944b81ecb1ef51c152f66a1ccb6be3e374d4174456fb8805fc2` |

The China fixture preserves the authoritative Chinese bytes and exact metadata spans: `【发布部门】全国人民代表大会常务委员会`, `【发布文号】中华人民共和国主席令第81号`, the title heading, and a separate applicability span at `第一条`. Its English excerpt is a separately labelled test-only human-reviewed derived translation. Production live admission does not allow the model to create or approve a derived translation.

## Verification commands

- `pnpm test:agent-first` — 56 passed and 2 opt-in live tests skipped because no API key or model environment variable was present.
- `pnpm test` — 100 passed and 3 opt-in live OpenAI tests skipped.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `pnpm build` — passed with Next.js 16.3.0.
- `pnpm test:browser` — 2 passed and 2 intentionally project-skipped; desktop persistence/incomplete evidence and 360 px keyboard/accessibility journeys passed.
- `pnpm verify:privacy` — passed with the pinned official fixture treated as public official test evidence and the content-addressed server snapshot writer explicitly allowlisted.
- `pnpm verify:links` — 53/53 registered official links resolved; 7 access-controlled official responses remained visible rather than being treated as content proof.
- `git diff --check` — passed.

The opt-in live Agents SDK tests require an independently supplied `OPENAI_API_KEY` and `BWMI_OPENAI_MODEL=gpt-5.6-sol`. No key was read from a predecessor task, inferred, stored, or added to the working tree.

## Process and listener ownership audit

- Before browser verification, `lsof -nP -iTCP:3210 -sTCP:LISTEN` showed no listener, so no existing server was reused or displaced.
- Playwright owned the temporary Next verification process tree (observed web-server PIDs `12970` and `12976`) and stopped it through its configured cleanup after the tests.
- After verification, port `3210` was clear and the Playwright/Next verification processes had not respawned.
- Existing unrelated listeners on ports `3000`, `8081`, `8082`, and the codebase-memory service on `9749` were preserved. No user-owned or unrelated process was terminated.

## Known external boundary

The deterministic contract, build, UI, source-link, and security gates are complete without credentials. The opt-in live hosted-search drift test is present but was not executed because this task had no OpenAI API key; it is not substituted with a temporary, inferred, or predecessor credential.
