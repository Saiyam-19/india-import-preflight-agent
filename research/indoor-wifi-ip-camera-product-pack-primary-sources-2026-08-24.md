# Indoor Wi-Fi/IP-camera product pack: primary-source admission record

**Lifecycle target:** `source_admitted`, followed by independent `full_support` promotion only after all complete browser journeys pass  
**Admission decision:** **admit after narrowing the provisional boundary and rejecting the apparent 10% BCD concession**  
**Last checked:** 2026-08-24  
**Rate review after:** 2026-09-24, and immediately after any tariff, notification, GST, origin, party or trade-remedy change  
**Rule review after:** 2026-11-24, and immediately after any camera model, firmware, radio, power, accessory, packaging, WPC, BIS, DGFT or REPA change

This is the independent primary-source admission record for BWMI-12. Router or headphones sources, mappings, rates, decisions and fixtures are not evidence for this camera.

## 1. Exact admitted scenario

Admit only one new, finished, single-model, retail-packaged indoor IP security camera imported for resale when all of these facts are established for the exact model:

- its principal function is capturing and transmitting security-camera video over IP;
- its only radio operation is 2400–2483.5 MHz and the notified 5 GHz licence-exempt bands;
- it has no 6 GHz, cellular, satellite, Bluetooth, Zigbee, NFC or other radio;
- it has no battery, Ethernet, Power over Ethernet, integrated DVR/NVR or bundled recorder;
- it is neither outdoor/industrial equipment nor a camera module or component;
- the retail set contains one camera and one dedicated, separately identified, non-radio external DC adapter; and
- exact camera model, camera manufacturer, adapter model, importer, origin, producer and exporter are known.

Exclude analog CCTV, webcams, still cameras, dashcams, camera modules, DVR/NVR units, recorder or multi-camera bundles, separate adapters, outdoor/rugged/thermal/industrial models, high-speed or radiation-tolerant cameras, products meeting the tariff night-vision subheading, every additional connectivity or power capability above, and used/refurbished or ambiguous sets.

The final boundary is narrower than the provisional manifest: it explicitly excludes Ethernet/PoE, integrated recorders, other radios, the special camera subheadings and unclear retail sets.

## 2. Deterministic tariff mapping and rate chain

### Mapping

`85258900` is admitted for the exact boundary:

- heading 8525 covers television, digital and video cameras;
- the exact ordinary indoor IP security camera does not meet the high-speed, radiation-tolerant or tariff night-vision subheadings; and
- the dedicated adapter does not replace the camera as the set's defining article.

Official locators:

- CBIC Customs Tariff Chapter 85, heading 8525 and items `85258100`–`85258900`: <https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff(ason30.06.2024)/CUSTOMS_TARIFF_VOL-I/chap-85.pdf>.
- ICEGATE live description lookup for `85258900`, returning the residual “Other” camera item: <https://www.icegate.gov.in/Webappl/Desc_details?cth=85258900&item_desc=>.

### Rates

| Component | Admitted rate | Primary authority and pinpoint |
|---|---:|---|
| BCD | **20% of AV** | CBIC Chapter 85, item `85258900`; ICEGATE live `bcd_rate: 20`; Notification 45/2025-Customs, official PDF p.324 S.Nos.288–289 and p.325 S.No.294: <https://egazette.gov.in/WriteReadData/2025/267119.pdf> |
| AIDC | **Nil** | Notification 11/2021-Customs, p.35 S.No.17 residual “Any Chapter”: <https://egazette.gov.in/WriteReadData/2021/224869.pdf> |
| SWS | **10% of BCD** | Finance Act 2018, s.110(1)–(4), official Gazette p.40: <https://egazette.gov.in/WriteReadData/2018/184302.pdf> |
| IGST | **18% of AV + BCD + SWS** | Notification 9/2025-Integrated Tax (Rate), heading 8525 entry: <https://courier.cbic.gov.in/ECCS/advisory/2025/NOTIFICATION%20NO.%209_2025-INTEGRATED%20TAX%20%28RATE%29%20-1759486719.pdf>; Customs Tariff Act s.3(8): <https://www.indiacode.nic.in/bitstream/123456789/8287/1/a1975-51.pdf> |
| Compensation cess | **Nil** | Notification 1/2017-Compensation Cess (Rate), p.5 residual “Any chapter”: <https://cbic-gst.gov.in/hindi/pdf/compensation-tax/notfctn-1-compensation-cess-english.pdf> |

ICEGATE live duty and notification-option checks used for corroboration:

- <https://www.icegate.gov.in/Webappl/DueFee1?cth_val=85258900&cntrycd=>
- <https://www.icegate.gov.in/Webappl/DueFee11?cth_val=85258900&cntrycd=>

Notification 45/2025 S.No.289 gives 10% only to goods **other than CCTV/IP cameras**. S.No.294 is limited to inputs or parts used to manufacture CCTV/IP cameras. Neither entry applies to this finished retail camera, so the pack uses 20% and never silently selects the apparent 10% option.

For assessable value ₹100,000, with no preference or applicable trade remedy:

| Calculation | Amount |
|---|---:|
| BCD: 20% × ₹100,000 | ₹20,000 |
| AIDC | ₹0 |
| SWS: 10% × ₹20,000 | ₹2,000 |
| IGST: 18% × ₹122,000 | ₹21,960 |
| Compensation cess | ₹0 |
| **Total import duties** | **₹43,960** |

## 3. WPC ETA and licence-exempt radio boundary

- The current DoT ETA service expressly lists cameras among wireless products requiring ETA for import, sale and use. It identifies exact-model technical literature, RF reports and manufacturer authorisation, and says importer self-declaration may support Customs clearance: <https://eservices.dot.gov.in/equipment-type-approval-eta>.
- WPC's ETA FAQ, Q2, Q4–5 and Q8–11, requires the finished product, radio-module reports and import undertaking: <https://eservices.dot.gov.in/sites/default/files/faqs/eta_faq.pdf>.
- WPC File R-11018/02/2017-PP, p.2 para 2.1(a), Annexure 2 pp.8–9 and undertaking Annexure 3 p.10, supplies the licence-exempt Customs route: <https://eservices.dot.gov.in/sites/default/files/circular-notifications/Compendium%20of%20Orders%20related%20import%20licence%20-signed%20copy%20060722.pdf>.
- G.S.R.45(E) and G.S.R.1048(E), compendium PDF pp.141–153, define the admitted 2.4/5 GHz bands, power, PSD, antenna and DFS/TPC boundaries: <https://www.dot.gov.in/static/uploads/2025/07/84f33f09e137fa81930f44bcd5f2d238.pdf>.

**Encoded effect:** exact-camera ETA and the prescribed import undertaking `conditions_clearance`. Confirmed absence or mismatch is `Blocked`; incomplete model/RF evidence is `Needs verification`. The non-radio adapter has no separate WPC rule.

## 4. BIS camera and adapter conditions

- The current BIS Scheme II list separately identifies item 41, CCTV Cameras/CCTV Recorders, and item 16, Power Adaptors for IT Equipment: <https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en>.
- MeitY S.O.1652(E), order paras 2–3 and annexed Essential Security Requirements, applies compulsory safety and security registration to CCTV cameras: <https://www.bis.gov.in/wp-content/uploads/2024/04/CCTV-Camera-CRO-2021.pdf>.
- MeitY S.O.4997(E), English p.3 subparagraphs (i) and (v), defines the current safety-standard transition for camera and adapter registrations: <https://www.bis.gov.in/wp-content/uploads/2025/11/Migration-to-IS-IEC-62368-Part-1-2023-from-IS-13252-Part-1-2010-and-IS-616-2017.pdf>.
- DGFT General Notes to Import Policy 2025, PDF p.3 para 2(C), treats import of notified electronics without registration as prohibited and provides re-export, deformation or scrap outcomes under Customs supervision: <https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf>.

**Encoded effects:** the exact camera/family/site/firmware registration and mark, and the exact bundled adapter/model/site registration and mark, are separate `conditions_clearance` gates. Either confirmed defect is `Blocked`. The adapter never inherits the camera registration.

## 5. REPA, package declarations and trade remedies

- Telecommunications (Radio Equipment Possession Authorisation) Rules, 2026, G.S.R.592(E), rules 4–6 and 8–10, cover purchase or import for sale: <https://eservices.dot.gov.in/sites/default/files/media-docs/telecommunications-radio-equipment-possession-authorisation-rules-2026-2.pdf>.
- DGFT General Notes 2025, pp.5–6 para 5, lists imported retail-package declarations: <https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf>.
- ICEGATE's current Customs Duty Calculator service page is the official duty-calculation entry point: <https://www.icegate.gov.in/services/customs-duty-calculator>.
- DGTR's current investigation index is searched by exact product, origin, producer and exporter: <https://www.dgtr.gov.in/en/anti-dumping-investigation-in-india>.

**Encoded effects:** missing REPA blocks overall legal readiness but is `non_clearance` because no checked primary pinpoint makes it a Customs release document. Package declarations are a `non_clearance` warning. Unknown origin or parties, an undated check or a possible trade-remedy match returns `Needs verification` and suppresses numeric cost.

## 6. MTCTE non-mapping check

The current official notified-products list was checked for camera, CCTV, IP camera and smart-camera entries. It contains no camera category: <https://mtcte.tec.gov.in/filedownload?name=downloadDocument_ProductsList.docx>. The current 2.4/5 GHz ER TEC59432407 covers Wi-Fi access points, controllers, base stations and point-to-point equipment, not a camera client: <https://mtcte.tec.gov.in/filedownload?name=TEC59432407.pdf>.

No MTCTE camera rule or clearance claim is encoded. A future notified camera category, or an exact model that performs a separately notified telecom function, requires a new admission review.

## 7. Independent admission and promotion gates

The camera pack owns camera-prefixed source, rule, action, fixture and evidence IDs; exact mapping `85258900`; rates `20/0/10/18/0`; and three reviewed fixtures:

1. `Ready` — exact camera, adapter, parties, ETA, both BIS registrations, REPA, labels and dated no-match trade-remedy evidence.
2. `Blocked` — confirmed missing exact-model WPC ETA/undertaking.
3. `Needs verification` — unresolved origin, producer/exporter and dated trade-remedy check; numeric cost withheld.

Promotion is permitted only if schema, unit, contract, engine, desktop-browser and 360-pixel-browser checks independently pass all three outcomes. Any router/headphones source, rule, rate, evidence, action or fixture appearing in the camera pack fails admission.
