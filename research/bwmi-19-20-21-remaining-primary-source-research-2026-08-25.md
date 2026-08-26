# BWMI-19, BWMI-20 and BWMI-21: remaining primary-source research

**Research date:** 2026-08-25  
**Status:** candidate research only; no source in this document is admitted to production knowledge  
**Scope:** real document intake, China-origin exports into India, and India-origin exports into China  
**Not in scope:** production implementation, filing, payment, licence application, portal login, document authentication, or a legal-clearance conclusion

## Executive summary

The application can safely implement real PDF/image **fact extraction** now, provided every extracted value is shown as an unverified observation with page/region provenance and user confirmation. An invoice, licence, certificate, customs declaration, or portal screenshot cannot prove that the document is genuine, current, unrevoked, matched to the goods, accepted by Customs, paid, or released. Those checks need an authenticated authority or carrier integration.

The official sources found for both trade directions establish a credible regulatory chain, but they do not make either direction complete for an unspecified product. China export controls, annual export-licence catalogues, Customs declaration rules, origin rules, India export controls, China import licences, tariff law, import VAT, and several product-regulator triggers are now identified. A complete result still needs an exact product, technical characteristics, intended use, parties, shipment date, trade mode, origin, tariff codes on both sides, port/province where material, and product-specific authority evidence.

Implementation posture:

- **BWMI-19:** implementation-ready for bounded extraction, provenance, confirmation, parser-security controls, and a non-fabricated test corpus. It is **not** ready for authenticity, live-status, certificate-validity, or clearance claims.
- **BWMI-20:** ready only as a China-export evidence checklist and fail-closed research workflow. The existing admitted dual-band MIMO router boundary supplies the reference product class, but a complete China-to-India assessment still requires the user's exact model, technical, manufacturing, party, end-use, route and date facts plus current China-side evidence.
- **BWMI-21:** ready only as an India-export/China-import checklist, conditional formula framework, and fail-closed research workflow. It is **not** ready for a complete destination assessment or numeric border-charge estimate without exact current inputs and source rows.

Finding an official source is not the same as completing a ticket. Every candidate below still needs snapshot, hash, exact-text extraction, amendment review, applicability validation, and the repository's admission process before it may support a production claim.

## Method, access labels and rating scale

Only official government or authority sources support claims in this record. Search results and translations were used to locate or understand originals, not as independent authority. Original Chinese text remains authoritative; the English descriptions here are working translations and have not been reviewed by a qualified legal translator.

Access labels:

- **Reachable:** the official HTML or PDF content was retrieved during this research.
- **Automation-blocked:** an official link exists, but automated retrieval failed, timed out, returned an unsupported MIME type, required JavaScript/CAPTCHA, or returned an infrastructure error.
- **Account-protected:** public guidance is visible, but the transaction, status, or verification function requires authentication or authority access.
- **Unavailable:** no reliable current official text was obtained.

Ratings use `0` (no evidence) to `5` (strong, case-applicable and current evidence). A high authenticity score says the source is official; it does not say the coverage is complete.

## What is already covered and what is new

### Existing admitted coverage — inventory only, not duplicated here

The repository already has independently admitted India-import evidence for only these exact finished-product boundaries:

| Existing pack | Exact admitted mapping | Existing India-side domains |
|---|---:|---|
| Consumer Wi-Fi router | `85176290` | CBIC/ICEGATE/DGFT tariff and policy, WPC/DoT, applicable TEC/NCCS analysis, BIS/MeitY, REPA, Legal Metrology, DGTR/trade-remedy gate |
| Bluetooth over-ear headphones | `85183019` | CBIC/ICEGATE/DGFT tariff and policy, WPC/DoT, finished-product and battery BIS, REPA, battery EPR, Legal Metrology, DGTR/trade-remedy gate |
| Indoor Wi-Fi/IP camera | `85258900` | CBIC/ICEGATE/DGFT tariff and policy, WPC/DoT, camera and adapter BIS, REPA, Legal Metrology, DGTR/trade-remedy gate |

Those packs do not establish generic China-export compliance, generic India-import coverage, India-export compliance, or China-import compliance. They also do not authorize transplanting a rate, rule, certificate, product mapping, or no-trade-remedy conclusion to another product.

BWMI-18's local ticket description explicitly leaves the China export side unchecked. This record treats that omission as BWMI-20 work and does not reopen already admitted India-side evidence.

### Newly sourced in this record

- the official baseline document sets for Indian imports/exports and Chinese Customs declarations;
- fields that can be extracted from common trade documents without making legal conclusions;
- the boundary between uploaded assertions and live authority verification;
- current Indian personal-data commencement instruments relevant to document handling;
- the current PRC Foreign Trade Law, Customs declaration rules, export-licence catalogue, dual-use control chain, non-preferential and APTA origin instruments, commodity-inspection law, and portal boundary;
- current China import-licence, tariff, VAT, CCC, telecom, radio, medical-device, food, and plant/quarantine triggers;
- India's current SCOMET list, e-CoO migration, export declaration rule, and product-triggered EIC/plant/CDSCO sources;
- explicit acquisition gates for classification, preference, trade remedies, product regulation, portal verification, translation, and calculation.

## Ticket-by-ticket evidence matrix

### BWMI-19 — real document intake

| Requirement | Official evidence found | Implementation boundary | Status |
|---|---|---|---|
| Baseline Indian export/import document types | DGFT FTP 2023 para 2.06(a)-(d) | Transport document, invoice/packing list, export declaration or bill of entry; product authorities may require more | Ready for taxonomy, subject to policy updates |
| Customs supporting-document workflow | ICEGATE eSanchit guides/FAQ and current eSanchit service | Historical guides show upload metadata and document workflow; current transaction is post-login | Ready for metadata extraction; live verification blocked |
| China Customs declaration documents | GACC Order 277 and current Goods Declaration service guide | Contract, invoice, packing list, manifest/transport documents, licences and other required attachments are case dependent | Ready for taxonomy; current filing status needs login |
| Extractable facts | Visible fields on invoices, packing lists, transport documents, declarations, origin proofs, licences and test reports | Values remain user/document assertions until confirmed and, where needed, authority-verified | Ready |
| Authenticity/validity | No uploaded file alone can prove it | Needs issuer/carrier/customs registry integration, account access, digital-signature verification and exact-model matching | Fail closed |
| Privacy/security | MeitY G.S.R. 843(E) and 846(E), plus repository threat model | Major DPDP processing provisions have phased commencement; use conservative controls now and obtain legal review | Ready as security design, not legal conclusion |
| Test corpus | Official public blank/sample documents, consented redacted donor documents, neutral sentinel parser fixtures and byte-level adversarial mutations | No fabricated authority record, certificate, rate, HS outcome, status or compliance conclusion | Ready |

### BWMI-20 — China origin/export into India

| Chain stage | Newly identified official evidence | Existing India-side reuse | Remaining gate |
|---|---|---|---|
| China general trade authority | 2025-revised PRC Foreign Trade Law, effective 2026-03-01 | None | Exact product and activity applicability |
| China Customs export declaration | GACC Order 277, effective 2025-05-01; current Customs service guide | None | Authenticated declaration/status and current Customs Law text |
| China ordinary export licence | MOFCOM/GACC Announcement 2025 No. 89, 2026 catalogue | None | Exact Chinese code/description match |
| China dual-use/export control | Export Control Law; State Council Order 792; unified list; 2026 licence catalogue; catch-all/manual search boundary | None | Technical parameters, end user/end use, sanctions/controlled-party and catch-all review |
| China inspection/market triggers | Import and Export Commodity Inspection Law and missing current statutory-inspection catalogue | None | Exact catalogue row and product inspection requirements |
| Origin/preference | State Council Order 416; APTA Order 177 as amended by 198; APTA text | Existing packs require origin/trade-remedy checks but do not admit APTA preference | Exact APTA concession row, origin calculation, direct transport and valid proof |
| India import side | Do not duplicate exact router/headphone/camera packs | Reuse only when the case exactly matches an admitted pack and all freshness gates pass | Every other product; current India APTA notification; product regulators; China-specific trade remedies |
| Complete outcome/cost | No generic complete chain | Existing exact packs may calculate only inside their admitted scope | Fail closed outside exact admitted pack and current case evidence |

### BWMI-21 — India origin/export into China

| Chain stage | Official evidence found | Remaining gate |
|---|---|---|
| India exporter and baseline documents | FTP 2023 paras 2.05-2.06; Customs Act s.50 | Current IEC, exact shipping bill data, authenticated filing/status |
| India export policy/licensing | Current ITC(HS) Schedule II must be checked per code; revised SCOMET list Notification 31/2025-26 | Exact Indian 8-digit code, policy condition, technical parameters/end use and any later amendment |
| India product regulators | EIC, PPQS, CDSCO official entry points | Exact commodity, China protocol/market-access condition, inspection/certificate and current scheme instrument |
| Proof of origin/APTA | DGFT e-CoO 2.0 migration; APTA origin instruments | Exact concession row, India issuing procedure/form, valid authenticated certificate and direct transport |
| China declaration/import licence | GACC Order 277/service guide; MOFCOM/GACC Announcement 2025 No. 88 | Exact Chinese code and licence-catalogue match; portal transaction/status |
| China classification/duty | PRC Tariff Law and 2026 tariff schedule | Exact Chinese tariff row, classification notes/ruling, origin, valuation, declaration date and remedies |
| China import VAT | VAT Law effective 2026-01-01 and implementation regulation | Product rate and any special treatment; confirmed customs value/duty/consumption-tax inputs |
| China product regulators | Current CCC implementation list, MIIT telecom/network and SRRC, NMPA, GACC food registration and plant quarantine | Exact product trigger; registration/certificate status; food/plant country-product access; port/province conditions |
| Border-charge calculation | Statutory formula inputs are identifiable | No number until exact tariff row, origin/preference, customs value, VAT rate, consumption-tax scope/rate, trade remedies and effective date are all admitted |

## BWMI-19 document extraction contract

### Officially recognized baseline documents

DGFT FTP 2023 para 2.06 states the following baseline for goods, while expressly allowing product authorities to require additional documents:

- **India export:** bill of lading, airway bill, lorry receipt, railway receipt or postal receipt; commercial invoice-cum-packing list; shipping bill, bill of export or postal bill of export.
- **India import:** corresponding transport receipt; commercial invoice-cum-packing list; bill of entry.
- Separate invoice and packing list are accepted, and product/restriction/NOC authorities may add documents.

China's current Customs declaration guide and Order 277 identify electronic declaration plus commercial and regulatory attachments such as contract, invoice, packing list, manifest/transport document, authorisation, licences and other Customs-required documents. This is a baseline, not a universal closed list.

### What the agent may extract, and what it must not claim

| Document class | Visible facts that may be extracted with page/region provenance | Not established by the upload |
|---|---|---|
| Commercial invoice | seller/exporter, buyer/importer/consignee, invoice number/date, PO/contract references, currency, Incoterm and named place, item descriptions, model/part, quantity/UOM, unit and total prices, separately shown freight/insurance, asserted HS and origin | customs value, classification, origin entitlement, payment, genuineness, legal effect |
| Packing list | package count/type, marks, item-to-package relationship, net/gross weight, dimensions, container/package IDs | inspected quantity/weight, contents, Customs acceptance |
| Bill of lading/airway bill/other transport receipt | face-value carrier/forwarder, shipper, consignee, notify party, document number/date, ports/airports, vessel/flight, containers/seals, packages/weight, freight terms | title, surrender/release, carrier status, live movement, delivery or authenticity |
| Bill of entry/shipping bill/customs declaration | declaration number/date, customs station, declared parties, HS, origin/destination, values, displayed duties, assessment/release/status wording | live filing state, payment, assessment correctness, inspection result, release or authority acceptance |
| Certificate/proof of origin | printed issuer, certificate number/date, scheme, parties, goods, asserted HS, origin criterion, invoice, transport/direct-consignment statements, visible stamps/signatures | valid issuer authority, signature/seal, current status, non-revocation, exact preference entitlement |
| Licence/NOC/product certificate | printed authority, identifier, holder, manufacturer/model/site, standard/scope, issue/expiry dates, visible conditions | registry validity, revocation, exact-product match, transferable scope or Customs acceptance |
| Test report | laboratory, standard, model/sample, method, dates and visible result | laboratory accreditation, chain of custody, untampered sample, regulator acceptance |
| Contract/PO/LC/insurance | commercial parties, references, goods, terms, amounts and dates | enforceability, payment, valuation acceptance or coverage validity |
| Product specification/photo/label | visible model, technical parameters, markings, label declarations and packaging | actual internal hardware/firmware, conformity, origin or authenticity |

OCR/model confidence measures extraction quality only. It never measures truth, legal validity, compliance, authority acceptance, or authenticity.

### Checks that require authenticated or external integrations

Remain `not checked` unless a real scoped connector succeeds:

- ICEGATE declaration, eSanchit IRN, assessment, duty-payment, inspection and release status;
- DGFT IEC, authorisation, SCOMET licence and e-CoO status/verification;
- BIS, WPC ETA, MTCTE, REPA, EPR or other Indian certificate/registration status and exact-model scope;
- GACC declaration, tax payment, inspection, release, origin-proof verification and registered-entity status;
- China Single Window, MOFCOM export/import/dual-use licence, CCC, SRRC, telecom access, NMPA, food-enterprise and quarantine approval status;
- carrier title/surrender/delivery state and cryptographic signature/seal validity.

A screenshot, downloaded PDF, QR code, visible signature, portal printout or user-entered identifier is still an assertion until the owning authority is queried successfully.

### Privacy and parser-security limits

- Accept only explicitly supported PDF/image types after content sniffing; reject MIME/extension mismatch, archives, executables, macros, encrypted files, corrupt files and unsupported codecs clearly.
- Define application-owned limits for file count, compressed and expanded bytes, pages, pixel dimensions, OCR time, parser time and model input. Historical eSanchit limits are not the product's security policy.
- Parse server-side with least privilege and isolation; treat document text, QR content, links, embedded files, metadata and OCR output as untrusted data and never follow their instructions.
- Do not fetch arbitrary embedded URLs or resolve unvalidated redirects. Do not log raw document text, credentials, portal tokens or full identifiers.
- Encrypt stored documents and extracted facts, isolate by explicit case ID, use least-privilege keys, record access, support deletion/retention controls, and remove temporary files on success/failure.
- Obtain explicit consent and explain purpose, retention, model/provider handling and deletion. Use no-store/provider privacy controls where available.
- G.S.R. 843(E) and 846(E) phase in the DPDP Act/Rules. As of the research date, major processing duties scheduled for eighteen months after 2025-11-13 are not yet in force. This timing is not permission to weaken security; legal review must determine current obligations before launch.

### Minimal safe test-corpus strategy

1. **Official public blanks/examples:** hash-pinned authority forms, schemas and public guidance used only to test layout and field extraction. Preserve URL, title, retrieval time and hash. Do not infer a shipment outcome from a blank/sample.
2. **Consented redacted donor documents:** real documents only with documented authority to use, irreversible redaction, encrypted non-production storage, case isolation, withdrawal handling and expected labels limited to visible text/regions.
3. **Neutral parser fixtures:** files prominently marked `TEST DOCUMENT — NOT VALID — NOT A CERTIFICATE`, using sentinel parties and values. They exercise parser boundaries only and must not copy authority seals, valid identifiers, legal rates, classification outcomes or certificate wording.
4. **Byte-level adversarial variants:** corrupt, encrypted, oversized, decompression-bomb, MIME-mismatch, rotated, low-contrast and prompt-injection files derived without adding compliance facts.
5. **Opt-in live connector tests:** approved test accounts and non-production records only. Never record credentials; never turn live responses into production seeds.

Expected test labels are page, region and visible text—not “valid”, “approved”, “licensed”, “cleared”, “correct HS”, or another legal conclusion.

## Candidate primary-source register

The “snapshot” field assesses technical feasibility only. `Yes` does not mean a snapshot was taken or admitted.

### Document intake and Indian baseline

| ID | Authority; exact title/identifier; official URL | Jurisdiction/direction; applicability | Dates and lineage | Language/translation; exact locator | Retrieval/access; stable snapshot/hash | Supported claim; limitations; source confidence |
|---|---|---|---|---|---|---|
| D01 | DGFT, **Foreign Trade Policy 2023**, Notification No. 1/2023, [PDF](https://content.dgft.gov.in/Website/dgftprod/61d61bc2-272e-4880-b96c-c8f685a3b244/Foreign%20Trade%20Policy%202023.pdf) | India import/export; baseline goods documents and IEC | Issued 2023-03-31; effective 2023-04-01; continues unless amended | English; paras 2.05 and 2.06(a)-(d), PDF p.25 | Reachable; yes | Baseline documents and authority-added documents. Does not enumerate every product document or prove current case status. **High**, official instrument with exact locator; amendment review still required. |
| D02 | ICEGATE/CBIC, **eSANCHIT Step by Step Procedure**, [PDF](https://www.icegate.gov.in/sites/default/files/2022-04/eSANCHIT_Step_by_Step_Procedure_updated.pdf) | India import/export document upload; historical workflow | File path dated 2022-04; no verified supersession statement | English; PDF/A, scanning and upload-process sections | Automation-blocked in link audit; likely static PDF, snapshot possible after manual retrieval | Historical upload mechanics only. Old size/page limits are not safe current product limits. **Medium**, official but old and automated retrieval failed. |
| D03 | ICEGATE/CBIC, **eSANCHIT FAQs**, [PDF](https://www.icegate.gov.in/sites/default/files/2022-02/eSANCHIT_FAQs.pdf) | India import/export; supporting documents | File path dated 2022-02; current lineage unverified | English; mandatory/supporting-document and PDF-format questions | Automation-blocked; snapshot possible after manual retrieval | Corroborates document workflow, not present portal behaviour. **Medium**. |
| D04 | ICEGATE/CBIC, **eSanchit service**, [page](https://www.icegate.gov.in/services/esanchit) | India import/export; current transaction entry | Current page checked 2026-08-25 | English; service/login boundary | Automation-blocked; transaction account-protected; static landing snapshot conditional | Shows current service exists. Cannot verify IRN, filing, certificate or release without login. **High authenticity / low evidentiary completeness**. |
| D05 | ICEGATE/CBIC, **eSANCHIT Process Guide**, [PDF](https://www.icegate.gov.in/sites/default/files/2022-04/eSANCHIT_Process_Guide_updated.pdf) | India; participating-government-agency document metadata | File path dated 2022-04; current lineage unverified | English; document type, issuer, reference, place, issue/expiry and beneficiary fields | Automation-blocked; snapshot possible after manual retrieval | Supports extractable metadata. The guide itself notes some entered issuer data is not validated; no authenticity claim. **Medium**. |
| D06 | MeitY, **Digital Personal Data Protection Rules, 2025**, G.S.R. 846(E), [PDF](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf) | India; personal-data processing in document intake | Published 2025-11-13; rules 1, 2, 17-21 immediate; rule 4 after 1 year; rules 3, 5-16, 22-23 after 18 months | Hindi/English official Gazette; rule 1(2)-(4) | Reachable; yes | Proves phased Rule commencement. Does not substitute for legal analysis of the specific deployment. **High**. |
| D07 | MeitY, **DPDP Act commencement notification**, G.S.R. 843(E), [PDF](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf) | India; Act commencement | Published 2025-11-13; staged immediate/one-year/eighteen-month dates | Hindi/English; clauses (a)-(c), especially clause (c) | Reachable; yes | Proves phased Act commencement. **High**. |

### China export side and origin

| ID | Authority; exact title/identifier; official URL | Jurisdiction/direction; applicability | Dates and lineage | Language/translation; exact locator | Retrieval/access; stable snapshot/hash | Supported claim; limitations; source confidence |
|---|---|---|---|---|---|---|
| C01 | MOFCOM publication of NPC law, **中华人民共和国对外贸易法 / Foreign Trade Law of the PRC**, President Order No. 67, [HTML](https://www.mofcom.gov.cn/zfxxgk/gkml/art/2025/art_fdc193e921ce4a298fe46e85c242b54e.html) | China import/export; general trade authority | Revised 2025-12-27; effective 2026-03-01; lineage lists 1994, 2004, 2016, 2022 and 2025 versions | Chinese original; working translation only; arts 11, 15-25, 37-40 | Reachable; HTML snapshot/hash possible | General free/restricted/licensed trade, documents, origin, inspection and prohibited conduct. Not a product catalogue. **High**. |
| C02 | NPC, **中华人民共和国海关法 / Customs Law of the PRC**, [HTML](https://www.npc.gov.cn/zgrdw/npc/xinwen/2017-11/28/content_2032717.htm) | China import/export; Customs declaration | Page reflects 2017 amendment state; later amendment status not verified | Chinese original; arts 24-25 | Automation-blocked; snapshot possible if manually retrieved | Truthful declaration and supporting documents. Currency is uncertain, so do not admit until current consolidated law is obtained. **Medium-low currency / high authenticity**. |
| C03 | GACC instrument mirrored by MOFCOM, **中华人民共和国海关进出口货物申报管理规定**, GACC Order No. 277, [HTML](https://fdi.mofcom.gov.cn/come-falvfagui-con.html?id=11519) | China import/export; goods declarations | Promulgated 2025-03-27; effective 2025-05-01; supersedes/replaces prior Order 103 framework as stated in the instrument | Chinese original; arts 1-2 and 25-28 | Reachable; HTML snapshot/hash possible | Declaration and accompanying-document rules. Needs exact article extraction from an immutable official copy before admission. **High**. |
| C04 | GACC, **货物申报 / Goods Declaration service guide**, item `11100000000014154E1000629002001`, [HTML](https://online.customs.gov.cn/static/pages/guides/000629002001/000629002001.html) | China import/export; registered declarants | Current guide checked 2026-08-25 | Chinese; process and materials lines 37-50 | Reachable public guide; transaction account-protected; guide snapshot yes | Electronic declaration and commercial/licence attachments. “Non-mandatory” guide labels do not mean Customs can never request them. **High**. |
| C05 | MOFCOM/GACC, **出口许可证管理货物目录（2026年）**, Announcement 2025 No. 89, [HTML](https://xkzj.mofcom.gov.cn/tzgg/art/2026/art_c21114e6c05b42fb8aeb86fe8734aa61.html), [catalogue PDF](https://picpolicy.mofcom.gov.cn/file/20260106/54801767665477797.pdf) | China export; listed goods only | Effective 2026-01-01; repeals Announcement 2024 No. 65 | Chinese; catalogue row plus announcement paras 1-5, especially dual-use overlap and effective-date clause | Reachable; yes | Ordinary export-licence catalogue and procedure. No conclusion without exact Chinese commodity row. **High**. |
| C06 | NPC, **中华人民共和国出口管制法 / Export Control Law of the PRC**, [official PDF](https://wb.flk.npc.gov.cn/flfg/PDF/fac52bda3ba049acb9e5e274c9d5160c.pdf) | China export/re-export; controlled items, end users/end uses and catch-all | Adopted 2020-10-17; effective 2020-12-01; later amendment not found in this pass | Chinese original; arts 2, 9-15, 18 | Automation-blocked direct PDF; indexed official text; snapshot after manual retrieval | Establishes export-control list/licensing/catch-all framework. Exact product and end-use analysis still required. **High authenticity / medium retrieval confidence**. |
| C07 | State Council, **中华人民共和国两用物项出口管制条例**, Order No. 792, [HTML](https://exportcontrol.mofcom.gov.cn/article/zcfg/gnzcfg/gzjgfxwj/202410/1057.html) | China export; dual-use items/services/technology | Promulgated 2024-10-19; effective 2024-12-01 | Chinese; arts 2, 11-18 and controlled-party/end-user provisions | Reachable; snapshot/hash possible | Current dual-use licensing, temporary controls and case review. List absence does not defeat catch-all/temporary controls. **High**. |
| C08 | MOFCOM, **中华人民共和国两用物项出口管制清单**, Announcement 2024 No. 51, [HTML](https://exportcontrol.mofcom.gov.cn/article/zcfg/gnzcfg/zcfggzqd/202411/1067.html) | China export; listed dual-use items | Effective 2024-12-01; states replacement of listed predecessor announcements and relevant commercial-cryptography list entries | Chinese; announcement text and attached list row | Reachable; snapshot/hash possible | Unified list. Technical parameter matching and current amendments remain mandatory. **High**. |
| C09 | MOFCOM/GACC, **2026年度《两用物项和技术进出口许可证管理目录》**, Announcement 2025 No. 91, [HTML](https://www.mofcom.gov.cn/zfxxgk/gkml/art/2025/art_14af6ed6ec0f43c8800f391a97b3f324.html) | China import/export; listed dual-use items | Effective 2026-01-01; repeals Announcement 2024 No. 67 | Chinese; announcement and exact attached row | Reachable; snapshot/hash possible | Annual licence-administration catalogue. It is not the whole control universe. **High**. |
| C10 | MOFCOM, **两用物项查询 / dual-use item search**, [page](https://exportcontrol.mofcom.gov.cn/h5/form_01.shtml?columnID=8&num=1) | China export; screening aid | Current dynamic database checked 2026-08-25 | Chinese; search result and database disclaimer/catch-all warning | Reachable shell; CAPTCHA/automation-blocked for reliable query; stable result snapshot conditional | Useful manual screening, not proof of absence or a stable legal instrument. **Medium**. |
| C11 | State Council, **中华人民共和国进出口货物原产地条例**, Order No. 416, [MOJ law database](https://xzfg.moj.gov.cn/front/law/detail?LawID=1523&Query=%E4%BB%A5%E8%B4%A7%E7%89%A9) | China import/export; non-preferential origin | Promulgated 2004; effective 2005-01-01; amended 2019 according to current Chinese database | Chinese authoritative; arts 2-6 and 11-17. [Old official English text](https://english.customs.gov.cn/statics/05f62cd8-aea3-49e6-9827-cdd88b351ed1.html) is translation/reference only | Chinese page reachable; old English automation-blocked; Chinese snapshot yes | Non-preferential origin framework. English page predates the 2019 amendment and cannot control. **High Chinese authenticity / low translation confidence**. |
| C12 | GACC, **中华人民共和国海关《亚太贸易协定》项下进出口货物原产地管理办法**, Order No. 177 as amended by Order No. 198, [official PDF](https://www.customs.gov.cn/eportal/attachDir/customs/2026/01/2026010510265793918.pdf) | China-India both directions; APTA goods seeking preference | Issued 2008; amended 2010; officially republished/downloaded in 2026; no later amendment identified in this pass | Chinese; arts 1-6, direct-transport and certificate provisions, annexed members/form | Automation-blocked direct open but indexed by official search; snapshot after manual retrieval | APTA origin and direct-transport framework. Preference also requires a current concession row and valid proof. **High authenticity / medium currency confidence pending amendment check**. |
| C13 | MOFCOM FTA service, **Asia-Pacific Trade Agreement materials**, [APTA page](https://fta.mofcom.gov.cn/channel/yatai_special.shtml), [Fourth Amendment Chinese PDF](https://fta.mofcom.gov.cn/yatai/ytmyxza_cn.pdf) | China-India; treaty/preference context | Fourth Amendment materials published on official treaty service; exact in-force/concession lineage must be verified per claim | Chinese; relevant agreement article/schedule and member/product row | Reachable; snapshot/hash possible | Confirms treaty materials exist. Does not itself prove a particular product rate or certificate. **High authenticity / medium applicability**. |
| C14 | State Council Tariff Commission, **中华人民共和国进出口税则（2026）**, Announcement 2025 No. 12, [HTML and attachment](https://gss.mof.gov.cn/gzdt/zhengcefabu/202512/t20251231_3981044.htm) | China import/export; classification and tariff row | Effective 2026-01-01; annual schedule supersedes prior annual tariff for 2026 transactions | Chinese; exact tariff code row, notes and applicable schedule | Reachable; attachment snapshot/hash possible | Current 2026 tariff table. No rate may be generalized without exact row/origin/date. **High**. |
| C15 | NPC law via MOFCOM, **中华人民共和国进出口商品检验法（2021修正）**, President Order No. 81, [HTML](https://policy.mofcom.gov.cn/claw/clawContent.shtml?id=90362) | China import/export; goods in statutory inspection catalogue and special cases | Fifth amendment 2021-04-29; page marks current/effective | Chinese; arts 4-7, 15-18 and 23-25 | Reachable; snapshot/hash possible | Catalogue-based inspection and export inspection. Current catalogue row was not acquired. **High law authenticity / incomplete application**. |
| C16 | China International Trade Single Window, [portal](https://www.singlewindow.cn/) | China import/export; declarations, licences and regulator transactions | Current portal checked 2026-08-25 | Chinese; relevant module/result page only | Public shell reachable but JavaScript required; transactions account-protected; stable result snapshot generally no | Establishes official portal boundary only. No filing/status claim. **High authenticity / no case evidence**. |

### China import-side product regulation and border charges

| ID | Authority; exact title/identifier; official URL | Jurisdiction/direction; applicability | Dates and lineage | Language/translation; exact locator | Retrieval/access; stable snapshot/hash | Supported claim; limitations; source confidence |
|---|---|---|---|---|---|---|
| C17 | CNCA/SAMR, **强制性产品认证目录描述与界定表**, SAMR Announcement 2023 No. 36, [HTML](https://www.cnca.gov.cn/zwxx/gg/zjgg/art/2023/art_31ce43f5837d408cb2023ec693615ada.html), and **CCC implementation rules summary**, [current page](https://www.cnca.gov.cn/hlwfw/ywzl/qzxcprz/ssgz/art/2026/art_5261f654e02d45edaf0805fb268c9fc9.html) | China import/market access; products within exact CCC scope | 2023 scope instrument; implementation page published 2026-04-17 and marked updated 2026-08 | Chinese; exact product description/boundary and implementation-rule identifier | Reachable; snapshot/hash possible | Product-triggered CCC requirement. HS/name similarity alone is insufficient; later changes must be reconciled. **High**. |
| C18 | MIIT, **电信设备进网管理办法**, MIIT Order No. 11 as amended by Order No. 68, [HTML](https://www.miit.gov.cn/zcfg/xxtxl/art/2024/art_773927399a0a4864b47dfab2ba120302.html) | China import/market access; covered telecom equipment | Current amended text published 2024 | Chinese; arts 3, 8 and current equipment catalogue | Reachable; snapshot/hash possible | Network-access permit framework. No applicability without exact device and current catalogue row. **High**. |
| C19 | MIIT, **无线电发射设备型号核准 / Radio Transmitting Equipment Type Approval**, [service guide](https://ythzxfw.miit.gov.cn/bssx/axy/wxdhwxtx/art/2020/art_e00be70da40a4355afe7b869eba30fdb.html) | China import/production/market; covered radio transmitters | Guide published 2020; current regulatory lineage must be checked with exact product | Chinese; scope, materials, process and result fields | Reachable; application/status account-protected; guide snapshot yes | SRRC/type-approval workflow. Does not prove a model is covered or approved. **Medium-high**. |
| C20 | State Council, **医疗器械监督管理条例**, Order No. 739, [official NHC publication](https://www.nhc.gov.cn/bgt/gwywj2/202103/d1d32cd516af4c78bcb7eed0d90f8b2c.shtml); NMPA **进口第一类医疗器械备案**, [service guide](https://zwfw.nmpa.gov.cn/web/taskview/11100000MB0341032Y100207201300101) | China import/market; medical devices by risk class | Order effective 2021-06-01; NMPA guide current when checked | Chinese; regulation arts 2-6 and class-specific registration/filing chapters; NMPA materials/conditions | Reachable; transaction/status account-protected; snapshots yes for public text | Medical-device classification and filing/registration trigger. No result without exact intended use/class/product. **High law / medium case applicability**. |
| C21 | GACC, **中华人民共和国海关进口食品境外生产企业注册管理规定**, Order No. 280, [official service guide](https://online.customs.gov.cn/static/pages/guides/001029004000/001029004000.html) | China import; foreign producers of covered food | Issued 2025-10-14; effective 2026-06-01; repeals Order No. 248; implementation Announcement 2026 No. 27 | Chinese; Order arts 2-15, 20-25, 33; guide application/materials | Reachable; application at Cifer/Single Window account-protected; public text snapshot yes | Foreign food-producer registration and country-authority recommendation for listed foods. Product/country access and exact registered entity remain case specific. **High**. |
| C22 | GACC, **进境动植物及其产品检疫审批 / Quarantine approval service guide**, [HTML](https://online.customs.gov.cn/static/pages/guides/000129009002/000129009002.html) | China import; specified animals, plants and products | Current guide checked 2026-08-25 | Chinese; conditions, materials, basis and online process | Reachable; transaction account-protected; guide snapshot yes | Product/country quarantine approval workflow. Does not prove market access or protocol for an Indian commodity. **High authenticity / low generic applicability**. |
| C23 | MOFCOM/GACC, **进口许可证管理货物目录（2026年）**, Announcement 2025 No. 88, [HTML](https://xkzj.mofcom.gov.cn/tzgg/art/2026/art_7ad4508a20f04807b4926134a6f9d10c.html) | China import; listed goods only | Effective 2026-01-01; repeals Announcement 2024 No. 66 | Chinese; exact attached catalogue row and announcement effective clause | Reachable; attachment snapshot/hash possible | Current ordinary import-licence catalogue. No applicability without exact Chinese code/description. **High**. |
| C24 | NPC/State Taxation Administration, **中华人民共和国关税法 / Tariff Law of the PRC**, [HTML](https://fgk.chinatax.gov.cn/zcfgk/c100009/c5234556/content.html) | China import/export; classification, origin, value and duty | Adopted 2024-04-26; effective 2024-12-01; page marks fully effective | Chinese; arts 4, 9-15 and 24-27 | Reachable; snapshot/hash possible | Legal basis for tariff rows, rates, origin and customs value. Does not supply the case's tariff row or value. **High**. |
| C25 | NPC/State Taxation Administration, **中华人民共和国增值税法 / VAT Law of the PRC**, [official tax publication](https://shanghai.chinatax.gov.cn/sjtax/ztzl/yshj/ldjj/202412/t474700.html) | China import; import VAT | Adopted 2024-12-25; effective 2026-01-01 | Chinese; arts 3, 10 and 14 | Reachable; snapshot/hash possible | Imported goods taxable; statutory rates and import VAT base. Product exceptions/special treatment must be checked. **High**. |
| C26 | State Council, **中华人民共和国增值税法实施条例**, [official tax publication](https://shanghai.chinatax.gov.cn/zcfw/zcfgk/zzs/202601/t478908.html) | China import; VAT implementation | Effective 2026-01-01 | Chinese; import-related definitions and calculation provisions | Reachable; snapshot/hash possible | Implements VAT Law. Does not cure missing customs value, duty or product inputs. **High**. |

### India export side

| ID | Authority; exact title/identifier; official URL | Jurisdiction/direction; applicability | Dates and lineage | Language/translation; exact locator | Retrieval/access; stable snapshot/hash | Supported claim; limitations; source confidence |
|---|---|---|---|---|---|---|
| I01 | DGFT, **Revision of SCOMET List under Appendix-3 of Schedule-II (Export Policy), ITC(HS), 2022**, Notification No. 31/2025-26, [PDF](https://content.dgft.gov.in/Website/dgftprod/66297819-5587-417b-a780-d8fa2ba326fe/Notification%2031%202025-2026%20updation%20in%20scomet%20list.pdf), [consolidated list](https://content.dgft.gov.in/Website/dgftprod/82cccea3-646e-435c-876f-88476c4ed5ca/Updated%20SCOMET%20List%202025%20%28as%20on%2023.09.2025%29.docx.pdf) | India export; SCOMET items/technology | Issued 2025-09-23; effective 2025-10-23; notification lists predecessor updates through No. 25/2024 | English; exact category/entry plus FTP ch.10/HBP procedure | Direct open automation-blocked due MIME; official search indexed full text; snapshot after manual retrieval | Current identified SCOMET list. A later notification search and parameter/end-use review remain required. **High authenticity / medium-high currency**. |
| I02 | DGFT, **Migration of eCoO to new platform**, Trade Notice No. 13/2024-25, [PDF](https://content.dgft.gov.in/Website/dgftprod/6737c077-e988-47df-9b94-adae38dcaefb/Trade%20Notice%20-%20eCoO%20Migration%20to%20new%20Platform-reg..pdf); [legacy e-CoO notice](https://www.coo.dgft.gov.in/); [e-CoO 2.0](https://www.trade.gov.in/) | India export; preferential/non-preferential origin certificates, including potential APTA proof | Trade notice 2024; preferential applications mandatory on e-CoO 2.0 from 2025-01-17 per official portal notice | English; migration clauses and agreement-specific application/form | PDFs automation-blocked by MIME; old portal timed out; new portal 403/automation-blocked and account-protected; static notice snapshot possible | Establishes current platform migration. Does not prove APTA eligibility, issuance or certificate validity. **High authenticity / low transaction evidence**. |
| I03 | CBIC, **Customs Act, 1962, section 50 — entry of goods for exportation**, [current Act view](https://taxinformation.cbic.gov.in/content-page/explore-act/1000090/1000002) | India export; export declaration | Current consolidated Act view intended; amendment date must be captured from admitted snapshot | English; s.50 and prescribed electronic form/document provisions | Automation-blocked with 502 during audit; snapshot possible after manual retrieval | Legal basis for shipping bill/bill of export declaration. No filing/status proof. **High authenticity / medium retrieval confidence**. |
| I04 | Export Inspection Council, **Our Services** and official documents, [services](https://www.eicindia.gov.in/WebApp1/pages/menuInfo/ourServices.xhtml), [documents](https://www.eicindia.gov.in/WebApp1/pages/menuInfo/documents.xhtml) | India export; notified commodities/quality/inspection schemes | Current pages checked 2026-08-25; exact scheme lineage not acquired | English; exact notified product/scheme/order and destination requirement needed | Pages reachable but returned no parsable body; automation-limited; snapshot conditional | Identifies owning authority, not a product-specific China export requirement. **High authority / low claim completeness**. |
| I05 | Directorate of Plant Protection, Quarantine & Storage, **RTI Manual 2024**, [PDF](https://ppqs.gov.in/sites/default/files/rti_manual_in_english_2024_0.pdf) | India export; plants/plant products and phytosanitary certification | Updated 2024-04-01 | English; pp. 1-4, especially export inspection/PSC functions | Reachable; yes | Establishes PPQS phytosanitary role. Does not establish China market access, commodity protocol or treatment. **High authority / medium applicability**. |
| I06 | CDSCO, **Guidance Documents**, [official index](https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Guidance-documents/) | India export; drugs/cosmetics/medical products where triggered | Dynamic index checked 2026-08-25 | English; exact product guidance, including applicable export NOC instrument | Reachable; indexed document snapshot possible | Product-triggered entry point only. No generic export NOC claim. **High authority / low generic applicability**. |

## Calculation boundary for India-to-China cases

A China import border-charge estimate may be released only after all of these inputs are admitted and case-matched:

1. exact Chinese tariff classification and 2026 tariff row/notes;
2. declaration date and the legally applicable rate date;
3. non-preferential origin or a valid APTA claim with product concession, rule of origin, direct transport and proof;
4. Customs-accepted transaction/customs value, currency and conversion basis;
5. customs duty and any tariff quota, temporary, retaliatory, anti-dumping, countervailing or safeguard measure;
6. import VAT rate and any product-specific exception;
7. whether consumption tax applies, with its current official scope, rate and formula;
8. any charge included in the product's verified scope, while excluding brokerage, freight after the border, storage, inspection service fees, port charges and other commercial/local costs unless separately sourced.

The general formula supported so far is:

```text
customs duty = customs value × applicable customs-duty rate
import VAT base = customs value + customs duty + applicable consumption tax
import VAT = import VAT base × applicable VAT rate
```

This formula is implementation-ready as a guarded structure, not as a numeric result. Consumption-tax treatment and product-specific rates remain unacquired. APTA preference is never assumed merely because India and China are members.

## Unresolved gaps and concrete acquisition paths

| Gap | Why it blocks | Concrete acquisition path |
|---|---|---|
| BWMI-20 has a bounded router product class but no completed real Trade Case | The existing India-import router boundary does not supply a user's exact model, China manufacturing/export facts, end user/end use, route, dates or parties | Reuse the admitted router boundary; collect the missing case facts from the user and run the China-side catalogue, export-control, inspection, party/end-use and portal checks for that exact case |
| No bounded reference product/case for BWMI-21 | Product regulators, classification, lists, licences, taxes and documents cannot be determined from direction alone | Select one bounded India-origin finished product and record make/model, composition, function, radio/battery/medical/food/plant traits, intended use, parties, origin, trade mode, dates, Incoterm, values, China port/province and India customs station |
| Current consolidated PRC Customs Law | The retrieved NPC page is a 2017 snapshot | Obtain the current consolidated Chinese text from the National Laws and Regulations Database/NPC, record amendment lineage and hash, then extract declaration/enforcement articles |
| China statutory inspection catalogue | Inspection Law delegates applicability to a catalogue | Query GACC's current regulatory catalogue by exact Chinese tariff code/product; snapshot exact row and effective/amendment notice |
| Exact China export/import licence rows | Annual catalogues are description/code specific | Download 2026 attachments, match exact code and technical description, capture row, footnotes, licensing authority and later amendments |
| Dual-use catch-all/end-use/party review | List absence does not prove uncontrolled status | Obtain technical parameter sheet, consignee/end user/end use, destination and transaction parties; screen official lists/temporary controls/controlled parties manually and obtain counsel/authority classification where ambiguous |
| India ITC(HS) Schedule II and SCOMET freshness | Export policy is code/date specific | Query current DGFT Schedule II and regulatory updates on the shipment date; snapshot exact row, condition and any post-2025 SCOMET amendment |
| APTA product preference and Indian issuance procedure | Membership does not prove a concession or valid origin | Acquire current Chinese and Indian product concession rows, APTA origin rule, direct-transport evidence, current India designated issuer/e-CoO form and official verification method; reconcile both countries' implementation instruments |
| Product-specific China market access | CCC, MIIT, SRRC, NMPA, food and quarantine are trigger based | Apply an agency-trigger checklist to exact product facts; snapshot the exact current scope/catalogue row and implementation rule; obtain authenticated registry status for the exact model/site/entity |
| India product export regulator evidence | EIC/PPQS/CDSCO/APEDA and ministries vary by commodity | Identify the owning authority from exact product; obtain current notified order, China-specific protocol/market-access notice, inspection/certificate form, effective dates and official portal path |
| China food/plant country-product access | Registration alone does not prove an Indian commodity is allowed | Check GACC country/product access lists and bilateral protocol; identify India competent authority, approved establishments, pests/treatments and port conditions; obtain authenticated registration/approval results |
| Current trade remedies in both countries | Measures depend on product description, origin/export, producer/exporter and date; HS alone is not decisive | Run dated official DGTR/CBIC and MOFCOM/GACC/Tariff Commission checks with exact product and parties immediately before assessment; snapshot operative notice and row |
| Authenticated portal/registry results | Uploaded documents do not prove filing, validity, payment or release | Establish approved connectors or manual evidence-acquisition procedures for ICEGATE, DGFT/e-CoO, China Single Window/GACC, MOFCOM, CNCA/CCC, MIIT/SRRC and NMPA; define credential, consent, audit and failure contracts |
| Chinese translation review | Working translations may miss scope, exceptions or amendment terms | Preserve original text and locators; commission a qualified bilingual legal/compliance review for every claim-bearing excerpt; link translation version to original hash |
| DPDP/current privacy obligations | Commencement is phased and deployment facts matter | Before launch, obtain Indian privacy counsel review of role, consent/notice, processor/provider, cross-border transfer, security, retention, breach and user-rights design against then-current commencement state |
| Consumption tax and non-duty charges | No complete current product-specific primary chain was acquired | For the chosen Chinese tariff code, obtain official current consumption-tax scope/rate/valuation instrument and official fee schedules; otherwise show them as not checked and withhold total |
| Stable snapshots for blocked sources | Several official PDFs/pages failed automated retrieval | Manually retrieve through an approved browser, preserve response URL/headers/bytes/time, hash with SHA-256, and independently verify title/identifier/effective date before validation/admission |

## Conflicts, amendment uncertainty and cautions

- The current PRC Foreign Trade Law is the 2025 revision effective 2026-03-01. Older 2022 versions must not support current claims after that date.
- GACC Order 277 is the identified current declaration rule effective 2025-05-01. Older Order 103 materials require a supersession check before any use.
- GACC food-enterprise Order 280 took effect 2026-06-01 and expressly replaced Order 248. Pre-June-2026 guidance must not be assumed current.
- The 2026 ordinary export, import and dual-use licence catalogues are annual instruments that repeal named 2024 predecessors. A 2025 search result or saved row cannot establish a 2026 case.
- The Chinese non-preferential-origin regulation was amended in 2019, while the official English GACC page is an older 2004/2005 text. The current Chinese text controls; the English page is not a current authoritative translation.
- The APTA origin regulation is old (Orders 177/198) but appears on a 2026 GACC official path. A current amendment search and exact concession schedule are still required.
- CNCA's implementation-rules page was published in April 2026 and labels itself updated August 2026. Snapshot its exact retrieval date and reconcile any mid-year rule changes with the base scope instrument.
- India's SCOMET Notification 31/2025-26 is the latest revision located, not proof that no later targeted amendment exists. Recheck DGFT regulatory updates at assessment time.
- MeitY's Gazette instruments establish phased DPDP commencement. General publicity language such as “operationalisation” cannot override the dates in G.S.R. 843(E) and 846(E).
- An authority service guide may summarize procedure but not replace the controlling law, rule, catalogue or notification. Both must be captured where a claim affects eligibility or clearance.
- A public portal showing a query field is not a successful check. JavaScript, CAPTCHA, login and registry access are explicit coverage gaps.
- A tariff code can be indicative but not dispositive for a product-specific trade remedy or regulator scope. Exact description, technical facts, party and date control.

## Coverage ratings

### Document, rule and regulation coverage

| Ticket and direction | Documents | Rules/procedures | Laws/regulations | Interpretation |
|---|---:|---:|---:|---|
| BWMI-19 — India-side intake | 4.5/5 | 3.5/5 | 3.5/5 | Baseline documents and trust boundary are strong; current portal metadata, every product document and privacy legal analysis are incomplete |
| BWMI-19 — China-side intake | 3.5/5 | 3.5/5 | 3.5/5 | Customs document set is usable; live verification and current consolidated Customs Law remain gaps |
| BWMI-20 — China export side | 3.5/5 | 4/5 | 4/5 | General/customs/licence/export-control chain is strong and the router boundary is known; exact case facts, inspection row, portal results and translation are missing |
| BWMI-20 — India import, exact existing three packs only | 4.5/5 | 4.5/5 | 4.5/5 | Reusable only within exact admitted boundaries and freshness gates |
| BWMI-20 — India import, any other product | 2/5 | 2/5 | 2.5/5 | Generic baseline exists; no product/regulator/rate/remedy completion |
| BWMI-21 — India export side | 4/5 | 3.5/5 | 4/5 | Baseline declaration/SCOMET framework is good; exact Schedule II/product/China protocol/CoO evidence is missing |
| BWMI-21 — China import side | 3.5/5 | 3.5/5 | 4/5 | Customs/tax/product-trigger framework is strong; exact tariff, regulator, access, portal and remedy evidence is missing |

### Confidence by dimension

| Ticket/direction | Source authenticity | Completeness | Currency | Applicability | Translation | Calculability | Why |
|---|---:|---:|---:|---:|---:|---:|---|
| BWMI-19 India/China intake | 4.5/5 | 3.5/5 | 3.5/5 | 4/5 | 4/5 | N/A | Official baselines support extraction; some guides are old/blocked and authenticity integrations are absent |
| BWMI-20 China export | 4.5/5 | 2.5/5 | 4/5 | 2.5/5 | 2/5 | 1/5 | Current official framework and bounded router class, but no exact case match, reviewed translation, portal result or China-side completion chain |
| BWMI-20 India import outside existing exact packs | 4.5/5 | 2/5 | 3.5/5 | 2/5 | 5/5 | 2/5 | Official India sources exist, but product-specific rules/preferences/remedies/rates are absent |
| BWMI-21 India export | 4.5/5 | 3/5 | 4/5 | 2.5/5 | 5/5 | 1/5 | Baseline and SCOMET are official; exact product policy, protocol and origin proof are unresolved |
| BWMI-21 China import | 4.5/5 | 2.5/5 | 4/5 | 2.5/5 | 2/5 | 2/5 | Laws and 2026 schedules are current, but no exact row, market-access result, reviewed translation or complete charge inputs |

## Implementation-ready versus fail-closed recommendation

### Implementation-ready after normal source admission

- A document-type registry with India/China baseline categories and an explicit `product-specific documents may apply` state.
- PDF/image visible-fact extraction with page/region provenance, method, OCR confidence, user confirmation/correction and immutable fact versions.
- Parser/security limits, case isolation, retention/deletion controls, prompt-injection resistance and clear encrypted/corrupt/unsupported/over-limit errors.
- A connector contract that distinguishes `reachable`, `automation-blocked`, `account-protected`, `unavailable`, `checked-no-match` and `checked-match`.
- Direction-specific agency and evidence checklists generated from confirmed product facts.
- Guarded China border-charge formulas that refuse arithmetic until every classification, origin, valuation, rate, tax, remedy and date input is admitted.
- A research workflow that snapshots/hashes sources and preserves original Chinese text separately from reviewed translations.

### Must remain fail closed

- document authenticity, signature/seal/QR validity, licence/certificate validity, revocation or exact-model match based only on an upload;
- filing, payment, inspection, release, clearance, shipment or carrier status without a successful authenticated connector;
- “not controlled”, “no licence”, “no CCC/SRRC/NMPA/quarantine requirement”, or “no additional regulator” based on empty search results;
- APTA entitlement or preferential rate without an exact concession row, origin rule, direct transport and authenticated proof;
- China-to-India results outside the three exact existing admitted packs, or inside them when facts/source freshness do not match;
- India-to-China classification, restriction, regulator, border-tax or document completion without an exact case manifest;
- any numeric China border-charge total until consumption-tax scope, trade remedies and every required official input are resolved;
- any source marked automation-blocked/account-protected until content or result is acquired and validated through an approved path;
- any claim based only on a working translation, search snippet, secondary explainer or LLM output.

## Ticket exit blockers

**BWMI-19 blockers:** authenticated authority/carrier verification; final privacy/legal review; current eSanchit metadata confirmation; approved real redacted corpus and permissions. These do not block implementing safe fact extraction.

**BWMI-20 blockers:** exact user-supplied router case facts; current consolidated PRC Customs Law; exact export/dual-use/inspection matches; reviewed Chinese translations; authenticated China portal results; current India APTA implementation where preference is claimed; and current case-specific trade-remedy evidence. These block a complete assessment but do not require selecting a new product class.

**BWMI-21 blockers:** bounded reference product/case; current India Schedule II/SCOMET match; China-specific India export regulator/protocol; APTA product/CoO chain; exact Chinese tariff and market-access rows; authenticated registry/portal results; trade remedies; consumption-tax and other charge inputs; reviewed translations. These block a complete assessment and numeric total.

No production implementation or source admission is authorized by this document.
