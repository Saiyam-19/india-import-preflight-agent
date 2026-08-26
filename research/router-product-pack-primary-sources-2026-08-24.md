# Wi-Fi router product pack: primary-source admission record

**Lifecycle target:** `source_admitted` only  
**Admission decision:** **admit after narrowing and correcting the provisional rate chain**  
**Last checked:** 2026-08-24  
**Default review after:** 2026-09-23 (30 days), and immediately after any model, firmware, RF, tariff, GST, trade-remedy, WPC, TEC/NCCS or BIS change  
**Runtime posture:** non-selectable and public-runtime-disabled

This record is the complete official-source boundary for BWMI-9. It does not promote the product to `full_support` and does not authorize a public legal-result path.

## 1. Exact admitted scenario

Admit only one new, finished, single-model, retail-packaged indoor home Wi-Fi CPE/router imported for resale when all of the following are established by the exact model's technical literature and certificates:

- the main unit's principal function is routing IPv4/IPv6 traffic between an Ethernet WAN and Ethernet/Wi-Fi LAN;
- its radio operation is limited to 2400-2483.5 MHz and the notified 5 GHz bands 5150-5250, 5250-5350, 5470-5725 and 5725-5875 MHz;
- it has integral or attached antennas not exceeding 6 dBi and its accredited RF report proves every applicable power, PSD, DFS/TPC and out-of-band limit;
- it has no 5925-6425 MHz capability, cellular/LTE, satellite, Bluetooth, Zigbee, NFC or other transmitter;
- it has no xDSL, cable or fibre modem, ONT/ONU, optical-transport, analogue-telephone/VoIP gateway, battery, enterprise/core-routing, BNG/BRAS/MPLS/PTN or cloud-implemented/managed functional component;
- the retail set contains one router main unit and only its dedicated, separately identified, non-radio external AC/DC power adapter; and
- exact make/model, importer, manufacturer, country of origin and producer/exporter are known.

Exclude access-point-only products, extenders/repeaters, mesh or multi-unit bundles, enterprise/carrier chassis, used/refurbished goods, components and every capability listed above.

### MIMO answer

**MIMO is not excluded from the admitted product boundary.** Excluding it would be accidental over-narrowing: an ordinary consumer router commonly uses Wi-Fi MIMO, and the official 2023 CBIC identification circular illustrates notification item (h) through 4G/5G equipment. More importantly, removing MIMO would not make the 10% concession safe. The same circular identifies **Wi-Fi Access Point Equipment** as excluded item (e), **Internet Protocol Radios**. An integrated consumer Wi-Fi router necessarily contains the Wi-Fi access-point function. This application is a conservative inference from the stipulated function, not an exact-model advance ruling, so the pack uses the statutory 20% BCD and never claims the 10% description-dependent concession.

## 2. Deterministic tariff mapping and current landed-tax chain

### Mapping

`8517 62 90` is admitted for the exact boundary above:

- heading 8517 62 covers machines for reception, conversion and transmission or regeneration of data, including switching and routing apparatus;
- `8517 62 30` is specifically **modems (modulators-demodulators)** and is excluded by the boundary;
- the finished non-modem router therefore falls in residual `8517 62 90 — Other`;
- the dedicated external adapter does not change the retail set's essential character. GRI 3(b) classifies a retail set by the component imparting its essential character; here that is the router. If the shipment contains other goods or separately saleable adapters, this mapping does not apply.

Current official locators:

- CBIC Chapter 85 tariff, printed p.1018 / PDF p.15: <https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff(ason30.06.2024)/CUSTOMS_TARIFF_VOL-I/chap-85.pdf>. The CBIC index identifies its current record as “Tariff (as on 30.06.2025)” at <https://www.cbic.gov.in/api/cbic-content-msts/MTcyNDYy>; record the provenance anomaly that the underlying chapter path retains `ason30.06.2024`.
- ICEGATE live description/policy lookup, queried for `85176290` on 2026-08-24: <https://www.icegate.gov.in/Webappl/Desc_details?cth=85176290&item_desc=>. It returned `85176230 Modems`, `85176290 Other`, import policy `Free`, and standard BCD 20%.
- CBIC current tariff General Notes, “Tariff (as on 30.06.2025)”, General Rules for Interpretation, rule 3(b): <https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff(ason30.06.2025)/CUSTOMS_TARIFF_VOL-I/General-Notes.pdf>.

### Rates

| Component | Current rate for this pack | Authority and pinpoint | Effective/current date |
|---|---:|---|---|
| BCD | **20% of AV** | CBIC Chapter 85, printed p.1018 / PDF p.15, `85176290`; live ICEGATE description and duty endpoints | CBIC tariff snapshot as on 2025-06-30; live confirmed 2026-08-24 |
| SWS | **10% of BCD**, therefore 2% of AV | Finance Act 2018, s.110(1)-(4), official Gazette p.40: <https://egazette.gov.in/WriteReadData/2018/184302.pdf>; live ICEGATE `scd_rate: 10` | Levy in force from 2018-02-02; live confirmed 2026-08-24 |
| AIDC | **Nil** | Notification 11/2021-Customs, G.S.R.69(E), p.35 S.No.17 “Any Chapter … Nil”, p.36 commencement: <https://egazette.gov.in/WriteReadData/2021/224869.pdf>; live ICEGATE offers S.No.17 rate 0 | 2021-02-02; live confirmed 2026-08-24 |
| IGST | **18% of AV + BCD + SWS** | Notification 09/2025-Integrated Tax (Rate), Schedule II S.No.490, heading 8517 “All goods”, PDF p.67; clause 2 p.82: <https://courier.cbic.gov.in/ECCS/advisory/2025/NOTIFICATION%20NO.%209_2025-INTEGRATED%20TAX%20%28RATE%29%20-1759486719.pdf> and Gazette <https://egazette.gov.in/WriteReadData/2025/266211.pdf>; Customs Tariff Act s.3(7)-(8), CBIC current Act view: <https://taxinformation.cbic.gov.in/content-page/explore-act/1000542/1000002> | 2025-09-22; live confirmed 2026-08-24 |
| GST compensation cess / generic cess / health cess / safeguard shown by tariff service | **0** | ICEGATE live duty response: <https://www.icegate.gov.in/Webappl/DueFee1?cth_val=85176290&cntrycd=>; Compensation Cess Notification 1/2017, Schedule S.No.56 “Any chapter … Nil”, p.5: <https://cbic-gst.gov.in/hindi/pdf/compensation-tax/notfctn-1-compensation-cess-english.pdf> | live confirmed 2026-08-24 |

The IGST base follows Customs Tariff Act s.3(8): assessable value plus customs duties/sums, excluding the IGST itself and compensation cess.

For an assessable value of ₹100,000, absent a preference or product/origin-specific trade remedy:

| Calculation | Amount |
|---|---:|
| BCD: 20% × ₹100,000 | ₹20,000 |
| SWS: 10% × ₹20,000 | ₹2,000 |
| IGST base | ₹122,000 |
| IGST: 18% × ₹122,000 | ₹21,960 |
| **Total border tax** | **₹43,960 (43.96% of AV)** |

### Why the provisional 10% rate is rejected

Notification 02/2019-Customs, dated 2019-01-29, G.S.R.60(E), substituted Notification 57/2017-Customs S.No.20 with a 10% rate for `85176290`/`85176990` **other than** listed goods including item (e) IP Radios and item (h) MIMO/LTE products; clause 2 made it effective 2019-01-30.

- Legacy direct CBIC PDF URL: <https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-act/notifications/notfns-2019/cs-tarr2019/cs02-2019.pdf>. Direct checks on 2026-08-24 reset or failed to return the PDF, so this URL is provenance only and is **not** the sole runtime authority.
- Official Customs reproduction of the notification: Gujarat Customs order, printed pp.47-48 / para 21.2.4: <https://gujaratcustoms.gov.in/juridictional_commissionerate/public/storage/pdfs/GWeiKjh9RJBoBExSoe94ZF9FVvDxhiKIs5de7SMz.pdf>.
- CBIC Circular 08/2023-Customs, F.No.524/11/2022-STO(TU), dated 2023-03-13: p.1 paras 1-3; Annexure 1 p.2 item (e); Annexure 2 pp.3-4 code `TEE001`: <https://taxinformation.cbic.gov.in/view-pdf/1003154/ENG/Circulars>. Direct official download API, checked HTTP 200 and decoded to the same six-page PDF: <https://taxinformation.cbic.gov.in/api/cbic-circular-msts/download/1003154/ENG>.
- Official field reproduction of Circular 08/2023: Bangalore Customs Public Notice 05/2023 <https://bangalorecustoms.gov.in/wp-content/uploads/2023/12/air_pn_05_2023.pdf>; Mumbai Customs 2026 order, PDF pp.3-4 <https://mumbaicustomszone3.gov.in/Content/writereaddata/Portal/NEWS/NewsImage/33_1_1_oio-88-cisco-compressed.pdf>.
- Notification 10/2025-Customs amended only item (g), not item (e), effective 2025-02-02: clause 1(vii) and clause 2, pp.1-2: <https://www.indiabudget.gov.in/budget2025-26/doc/cen/cus1025.pdf>.
- Live ICEGATE lists Notification 57/2017 S.No.20 at 10% as a description-dependent option, not an automatic rate: <https://www.icegate.gov.in/Webappl/DueFee11?cth_val=85176290&cntrycd=>.

**Effect:** this is a duty-assessment consequence, not a customs-clearance blocker. The admitted pack must use 20%. Remediation for a disputed model is exact technical literature and model-specific classification/concession advice; the engine must never silently select S.No.20.

## 3. Trade remedies and preference

No country-independent “nil trade remedy” conclusion is admitted. Anti-dumping/countervailing measures are defined by product-under-consideration, origin/export, producer/exporter and operative notification; HS codes can be indicative rather than dispositive.

- DGTR current anti-dumping investigations: <https://www.dgtr.gov.in/en/anti-dumping-investigation-in-india>.
- ICEGATE's current Customs Duty Calculator service page is the official duty-calculation entry point: <https://www.icegate.gov.in/services/customs-duty-calculator>.
- ICEGATE `85176290` checks returned safeguard/additional-duty fields at zero, but the response does not prove the absence of every product-description-specific anti-dumping measure.

**Contract rule:** exact origin, exporter and producer plus a dated official DGTR/CBIC/ICEGATE measure check are mandatory before `Ready`. Missing or ambiguous evidence is `Needs verification`; it is not a proven customs blocker. Never calculate a preference or trade remedy from HS alone.

## 4. WPC spectrum, ETA and customs effect

| Rule | Official source and exact locator | Applicability/evidence | Clearance effect, consequence and remediation |
|---|---|---|---|
| 2.4 GHz licence exemption | DoT subordinate-legislation compendium, G.S.R.45(E), effective 2005-01-28, PDF pp.141-144; English rules pp.143-144, rules 3-6 and table: <https://www.dot.gov.in/static/uploads/2025/07/84f33f09e137fa81930f44bcd5f2d238.pdf> | 2400-2483.5 MHz; transmitter/ERP/antenna-height limits; rule 6 type approval. Exact accredited RF report required. | RF boundary, not independently a customs blocker. Harmful interference can require discontinuation under rule 5. Remedy through conforming configuration/hardware and ETA. |
| 5 GHz licence exemption | Same compendium, G.S.R.1048(E), Gazette-effective 2018-10-22, PDF pp.145-153; English rules pp.150-153, rules 3-7 | Four admitted sub-bands; band-specific power, PSD, gain, DFS/TPC and out-of-band limits; rule 7 type approval. | RF boundary, not independently a customs blocker. Rule 6 permits relocation, power reduction or special antennas and ultimately discontinuation. |
| Continuing band authority | NFAP-2025, printed p.213 IND 28; Annexure 1 printed p.216 items 11-12: <https://www.dot.gov.in/static/uploads/2026/02/b110cdc386d3a4e41c8483d7ffd7c410.pdf> | Confirms continuing references to G.S.R.45(E)/1048(E). NFAP para 1.4 itself grants no spectrum right. | Use the Gazette rules, not NFAP alone. |
| Exact-model ETA | Current DoT ETA page, sections Details, Documents Required, Fees, Application Process and Validity: <https://eservices.dot.gov.in/equipment-type-approval-eta>; O.M. R-11017/01/2018-PP(part-1), 2024-09-09, paras 1-3: <https://eservices.dot.gov.in/sites/default/files/2024-11/Issuance%20of%20Equipment%20Type%20Approval%20%28ETA%29%20forLicense-Exempt.pdf> | Finished imported router; accredited reports for all RF modules, manufacturer authorisation and technical literature. ₹10,000; current page says lifetime unless revoked. | O.M. para 3 preserves separate import clearances. Obtain/verify on SARAL Sanchar: <https://saralsanchar.gov.in/>. |
| Customs release path | WPC File R-11018/02/2017-PP, issued 2022-07-06, p.2 para 2.1(a), Annex 2 pp.8-9, sample undertaking Annex 3 p.10: <https://eservices.dot.gov.in/sites/default/files/circular-notifications/Compendium%20of%20Orders%20related%20import%20licence%20-signed%20copy%20060722.pdf>; ETA FAQ Q2, Q4-5, Q8-11: <https://eservices.dot.gov.in/sites/default/files/faqs/eta_faq.pdf> | For a DGFT-Free licence-exempt device: exact-model SD-ETA plus signed/system-generated import undertaking. Existing ETA may be reused only after exact-model verification. | **Proven customs condition.** Confirmed absent, invalid or model-mismatched ETA/undertaking is `Blocked`. Missing evidence is `Needs verification`. Remedy on SARAL Sanchar before clearance. |
| 6 GHz exclusion | WPC Public Notice R-11010/02/2026-PP, pp.1-2 paras 2-7: <https://www.dot.gov.in/static/uploads/2026/03/dfb5fecb0467e2f52529cd4c0ff5dfd6.pdf> | Hardware capable of 5925-6425 MHz needs a fresh all-band ETA; old 2.4/5-only ETA must be cancelled. | Unknown capability is `Needs verification`; confirmed capability is outside the pack. Header says 06/03/2025 while file/signature indicate 06/03/2026; do not encode its 30-day deadline. Review by 2026-09-23. |

The external non-radio adapter has no separate WPC requirement: the 2022 compendium p.4 para 2.4 limits that question to RF transmitters, receivers and transceivers.

## 5. MTCTE and telecom security

| Rule | Official source and exact locator | Applicability/evidence | Clearance effect, consequence and remediation |
|---|---|---|---|
| Current framework | G.S.R.315(E), Telecommunications (Framework to Notify Standards, Conformity Assessment and Certification) Rules, 2025, published and effective **2025-05-16** under rule 1(2); English Gazette pp.6-9, rules 4, 7-9 and 12: <https://www.dot.gov.in/static/uploads/2025/07/95e6f36b7e0b008ea6e650f6f312f9e2.pdf> | Rule 7(2) requires conformity/certification; rule 8 prohibits sale, deployment or use without a valid certificate. Resale is not a rule 9 exemption. | Confirmed missing certificate is `Blocked` for overall legal readiness. Rule 12 allows cease-sale/distribution/use notice, ten-times-fee certification and possible seizure/destruction. **No current official pinpoint proves Customs must deny release**, so label `non_clearance`, never `customs_blocker`. |
| Exact product mapping/date | Current notified-products list, row “Equipments Operating in 2.4 GHz and 5 GHz Band” → “Wifi Access Points and CPE”, Phase 3, mandatory **2024-01-01**: <https://mtcte.tec.gov.in/filedownload?name=downloadDocument_ProductsList.docx> | Home router maps to Wi-Fi CPE, not separate enterprise BNG/BRAS/cloud/IPv4/IPv6/MPLS router variants. | Require exact model/family mapping. Ambiguous product function is `Needs verification`. |
| Current ER/procedure | ER list <https://mtcte.tec.gov.in/er_list>; TEC59432407, 2024, SCS, fee group B, pp.2 and 5-6: <https://mtcte.tec.gov.in/filedownload?name=TEC59432407.pdf>; TEC 93009:2024 v3.0, clauses 4.1, 4.3-4.5, 5.1, 5.4, 5.8, 5.12, 9.1, 15.1, 17.8, Annexures C/D: <https://mtcte.tec.gov.in/filedownload?name=downloadDocument_MTCTEProcedure.pdf> | Variant 2 covers 2.4/5 GHz Wi-Fi AP/CPE; procedure clause 5.1 says OEM/AIR wishing to sell or import notified equipment must obtain certificate/label. Group-B administrative fee ₹20,000 plus lab charges. | Import/sale obligation, but not a proven Customs release check. Remedy through <https://mtcte.tec.gov.in/> with exact-family reports/labels. |
| Security/integrated certificate | NCCS Wi-Fi CPE ITSAR v2.0.0, release 2025-12-01, pp.8-9 expressly includes home Wi-Fi routers: <https://nccs.gov.in/public/itsar/ITSAR402122512.pdf>; TEC No.1-6/2022-TC/TEC, 2023-12-26, p.1 para 1: <https://www.tec.gov.in/pdf/MTCTE/Extn_Scurity.pdf>; NCCS clarification 2024-10-24 para 3(a)(i): <https://nccs.gov.in/public/circulars_sc/Clarification%20regarding%20applying%20for%20various%20products%20in%20MTCTE%20for%20security%20certificationSigned.pdf> | Wi-Fi CPE security testing mandatory from 2024-04-01; where ER and ITSAR apply, a fresh application needs an integrated certificate. ITSAR v2 cover leaves enforcement date blank, so verify live certificate/portal status rather than hardcoding it. | Confirmed missing applicable integrated certificate is `Blocked` overall, `non_clearance`. Missing/ambiguous scope is `Needs verification`. |
| Cloud exception | NCCS/SC/3-1/2025-26-Part(2), 2026-08-13, p.2 paras 1-2: <https://nccs.gov.in/public/latest_updates/Extension%20of%20cloud%20exemeption%20till%2031st%20Dec%202026%20_NCCS%20letter%20dated%2013.08.2026.pdf> | Security-only exception through 2026-12-31 for cloud-based/implemented IP routers and Wi-Fi CPE; it is not an ER/MTCTE exemption. | Cloud-implemented/managed devices are outside this pack. Unknown dependency is `Needs verification`. |

A TEC page link titled “Registration of Importers mandatory on Customs Portal ICEGATE, for submission of MTCTE Certificate” resolves to no retrievable instrument. It is excluded from runtime evidence and cannot support a customs-blocker label.

## 6. Resale-possession authorisation (REPA)

G.S.R.592(E), Telecommunications (Radio Equipment Possession Authorisation) Rules, 2026, became effective on Gazette publication **2026-07-08**. Rules 4-6 and 8-10 cover purchase or **import for sale**, set ₹1,000 application and ₹10,000/year authorisation fees, and allow a one-to-five-year term: <https://eservices.dot.gov.in/sites/default/files/media-docs/telecommunications-radio-equipment-possession-authorisation-rules-2026-2.pdf>. Current service/remediation destination: <https://www.eservices.dot.gov.in/radio-equipment-possession-authorisation-services>.

Confirmed absence is `Blocked` for lawful importer/reseller possession/dealing. No official pinpoint was found requiring Customs to verify REPA for release, so its clearance effect is `non_clearance`, never `customs_blocker`.

## 7. BIS for the external adapter

| Rule | Official source and exact locator | Applicability/evidence | Clearance effect, consequence and remediation |
|---|---|---|---|
| Adapter CRS | S.O.1248(E), Electronics and Information Technology Goods (Requirement of Compulsory Registration) Order, 2021, published 2021-03-18, English pp.5-7 paras 2-3 and Schedule item 16: <https://www.bis.gov.in/wp-content/uploads/2021/11/Electronics-and-Information-Technology-Goods-Requirement-of-Compulsory-Registration-Order-2021-1.pdf> | “Power Adaptors for IT Equipment” must conform and bear Standard Mark under a BIS licence; effective after six months, 2021-09-18. | Exact adapter model needs independently valid BIS registration and mark. |
| Current standard transition | S.O.4997(E), dated 2025-10-29/published 2025-11-04, English p.3 subparas (i)/(v): <https://www.bis.gov.in/wp-content/uploads/2025/11/Migration-to-IS-IEC-62368-Part-1-2023-from-IS-13252-Part-1-2010-and-IS-616-2017.pdf>; current Scheme-II list item 16: <https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en> | As of 2026-08-24, current registration may be under IS 13252-1:2010 or IS/IEC 62368-1:2023 during transition through 2028-11-01. | Verify current registration/mark for exact adapter. |
| Import consequence | DGFT General Notes to Import Policy 2025, p.1 §2(A), p.3 §2(C): <https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf> | Notified E&IT goods are prohibited unless BIS-registered/label-compliant; unregistered consignments must be re-exported or deformed/scrapped by Customs. | **Proven customs condition.** Confirmed absent/invalid adapter registration or mark is `Blocked`; missing evidence is `Needs verification`. Remedy is valid BIS CRS/mark before import, not historical port labelling. |

The current Scheme-II list does not identify a separate standalone Wi-Fi-router CRS category. Do not invent one. The router unit instead needs MTCTE safety evidence under its ER; the external adapter needs independent BIS CRS.

## 8. Legal Metrology declarations

DGFT General Notes to Import Policy 2025, p.5 §5, states that imported retail prepackages are subject to the Legal Metrology (Packaged Commodities) Rules and lists importer name/address, generic name, net quantity, month/year, MRP inclusive of taxes and consumer-care declarations: <https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf>.

Require package artwork/photos and importer declaration evidence and surface remediation to correct the package declarations/importer registration. No current exact-model official pinpoint was found proving that an omitted declaration by itself conditions Customs release for this scenario. Therefore this pack records Legal Metrology as `non_clearance` advisory and does not change a fixture from `Ready` to `Blocked` solely because that advisory evidence is absent.

## 9. Contract fixtures and fail-closed rules

### Ready fixture

A `Ready` fixture must prove all of the following:

- exact admitted boundary and model identity, including no excluded transmitter/modem/ONT/VoIP/cloud function; ordinary Wi-Fi MIMO is allowed;
- HS `85176290`, DGFT policy `Free`, BCD 20%, SWS 10% of BCD, AIDC nil, IGST 18%, generic cess zero, and ₹43,960 border tax on ₹100,000 AV;
- exact country of origin, producer/exporter and dated official trade-remedy/preference check;
- exact-model WPC ETA, signed/system-generated import undertaking and accredited RF reports for every radio module/band;
- current importer REPA;
- current exact-model/family integrated MTCTE certificate, labels and applicable ER/ITSAR reports; and
- independently valid BIS CRS registration and Standard Mark for the exact external adapter.

Legal Metrology declarations remain a visible `non_clearance` advisory and do not alone defeat `Ready`.

### Blocked fixture

Use a model inside the admitted product boundary with a confirmed absent or mismatched exact-model ETA and absent signed/system-generated undertaking. WPC File R-11018/02/2017-PP p.2 para 2.1(a), Annexes 2-3, and ETA FAQ Q2/Q8 prove that these documents condition the admitted DGFT-Free import route. The blocker must identify WPC, the exact evidence failure, consequence (not sufficient to allow import), and remediation at SARAL Sanchar.

Other confirmed legal failures may be `Blocked` overall but must preserve their sourced clearance effect:

- adapter BIS failure: `customs_blocker`;
- REPA failure: `non_clearance`;
- MTCTE/integrated-certificate failure: `non_clearance`.

### Needs-verification fixture

Use a plausible router record whose exact model technical literature is missing or ambiguous for one or more of: routing versus modem/ONT function, 6 GHz/other radios, bands/power/PSD/gain/DFS/TPC, ETA model match, origin/producer/exporter and trade-remedy check, REPA, MTCTE family/integrated-certificate scope, cloud dependency, or adapter BIS model/mark.

The engine must not guess the HS concession, rate, obligation, clearance effect or remedy. It returns `Needs verification`, names every missing evidence item and withholds any public legal result.

### Adjacent-scope rejection

Reject rather than partially evaluate: 6 GHz-capable devices, cellular/LTE/satellite or other radios, modem/ONT/ONU or VoIP gateways, access-point-only/extender/repeater products, mesh/multi-unit bundles, enterprise/core/cloud router variants, battery products, separate adapters, components, and used/refurbished goods. These are not evidence that the product is illegal; they are outside this admitted pack.

## 10. Admission cautions

- The 20% application to an integrated consumer Wi-Fi router is intentionally conservative: CBIC Circular 08/2023 names Wi-Fi access-point equipment, not an exact retail router model. This is sufficient to reject the unsupported 10% concession, not a model-specific binding ruling.
- Do not call MTCTE or REPA a customs blocker. Their sourced consequences are import/sale/readiness or possession/dealing consequences, not a proven Customs release check.
- Do not claim a universal nil trade remedy. Origin and product-under-consideration evidence are mandatory.
- Do not use the broken legacy 02/2019 PDF or the broken TEC/ICEGATE notice as sole runtime authority.
- No statement in this record is `full_support`; promotion belongs to BWMI-11.
