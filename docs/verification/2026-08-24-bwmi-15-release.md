# BWMI-15 verification — multi-product public submission

Date: 24 August 2026  
Ticket: BWMI-15 — Verify and ship the multi-product hackathon submission  
Current state: **In Progress — public Vercel destination approval still required**

This record covers BWMI-15 only. Existing BWMI-9 through BWMI-14 implementation remains preserved and uncommitted. No fourth product, new workflow, architecture-capacity claim, live government integration, account, persistence, or adjacent ticket was added.

## Release changes

- Added a deployment payload boundary that excludes research, verification records, tests, logs, environment files, documents, and local caches from Vercel upload.
- Added current production dependency, official-link, privacy, and video verification commands.
- Added security headers and removed the framework-identifying response header.
- Made every preflight response, including malformed requests, explicitly non-cacheable.
- Added a complete keyboard-only Ready journey for desktop and 360px.
- Replaced a one-frame result-focus call with render-synchronized focus after the full browser matrix exposed one intermittent desktop failure.
- Added the submission video, synchronized narration, and 187-word summary.

## Clean-install gates

A disposable copy of the exact post-fix application source was installed with `pnpm install --frozen-lockfile` using pnpm 11.10.0. The lockfile was unchanged, 401 packages were installed, and pnpm reported that the lock passed its supply-chain policies.

- Deterministic unit/contract suite: **46 passed** across 9 files.
- Live OpenAI extraction: **1 intentionally skipped**; it remains separately opt-in and is not a release dependency.
- Contract-only suite: **28 passed** across 5 files.
- Strict TypeScript: **passed**.
- ESLint: **passed**.
- Next.js 16.3 optimized production build: **passed**.
- Built routes: `/`, `/_not-found`, `/api/extract`, `/api/preflight`, and production-disabled `/promotion-harness`.
- Production dependency audit: **no known vulnerabilities**.
- Impeccable post-edit detector: **no findings**.
- Codebase graph: 819 nodes, 1,805 edges, no parse-partial or skipped source files; every operated source, test, config, and release-script path reported no recorded indexing issue.

## Browser, catalog, and accessibility gates

The final clean-install Playwright run passed **28/28** checks across 1280×900 desktop and 360×800 mobile projects.

- Wi-Fi router: Ready, Blocked, and Needs verification at both widths.
- Bluetooth headphones: Ready, Blocked, and Needs verification at both widths.
- Indoor IP camera: Ready, Blocked, and Needs verification at both widths.
- Exactly those three passed `full_support` packs appear as supported choices; `Other product` remains a separate fail-closed path.
- The complete router Ready journey was operated only through Tab, keyboard type-ahead, text entry, and Enter at both widths.
- The post-submit Ready heading received focus at both widths.
- Axe reported no serious or critical WCAG violations on the complete keyboard journey at either width. The existing landing, Other-product, and extraction scans remained at zero violations.
- No horizontal overflow occurred at either width.
- Every supported outcome visibly included the 2026-08-24 checked date and its next review date.

## Privacy and synthetic-data gate

The final workspace scan checked 46 deployable/test text files and the admitted PDF fixture.

- No secret, literal credential, private key, email address, Indian mobile number, Aadhaar-like number, PAN-like identifier, or GSTIN-like identifier was found.
- No runtime console logging or durable browser/filesystem write API was found in `src`.
- The only document fixture remains the explicitly synthetic router pro-forma invoice with SHA-256 `31b92e2ff232113b1beef3d9d52aa31abb32cb89d3d1155d5e54de5b470372be`.
- The UI visibly says the PDF is synthetic, accepts only that verified document, stores nothing, and does not claim extraction for headphones, camera, or Other product.
- `.vercelignore` excludes `.env*`, the prior DOCX, `docs`, `research`, `tests`, `test-results`, local caches, and release scripts from the public payload.

## Official-link gate

The verifier extracted 51 unique HTTPS URLs directly from the three runtime product packs and confirmed all 51 resolved on 24 August 2026. Seven official endpoints returned HTTP 403 access-control responses to automation and are labelled as such rather than presented as publicly retrievable:

- three `dot.gov.in` static instrument PDFs;
- two `indiabudget.gov.in` notification PDFs;
- one `indiacode.nic.in` Act PDF;
- one `meity.gov.in` FAQ PDF.

The remaining 44 returned successful or redirected responses. Live browser search also confirmed the current DGTR anti-dumping investigation page, BIS Scheme II page, and DoT ETA FAQ. Runtime reports keep the checked and review dates visible beside their official source pinpoints.

## Submission collateral

- Video: `docs/submission/india-import-preflight-bwmi-15-demo.webm`.
- Video verification: **64.3 seconds**, 1280×720, valid WebM; opening, middle, and closing frames were sampled and visually reviewed.
- Demonstrated behavior: verified catalog, router Ready with cost and dates, headphones Blocked on missing exact-model WPC evidence, and Other product Needs verification with on-screen Customs Broker summary.
- Every shown name, identifier, and value is synthetic.
- Narration: `docs/submission/bwmi-15-demo-script.md`, synchronized to the 64.3-second recording and below two minutes.
- Summary: `docs/submission/bwmi-15-submission-summary.md`, **187 words**.
- Neither collateral item claims architecture capacity, a fourth product, deferred extraction coverage, or a live government workflow as working.

## Remaining public gate

The Vercel connector rejected deployment because the requested public deployment did not explicitly name Vercel as the destination. It requires explicit approval to upload this bounded payload and create a public project in the empty `saiyam-19's projects` team. Until that approval is received and the deployed UI/API/no-login smoke passes, BWMI-15 remains In Progress and must not be marked Done.
