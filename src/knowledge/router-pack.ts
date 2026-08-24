import type { ProductPack } from "./schema";

const ADMITTED_AT = "2026-08-24";
const REVIEW_AFTER = "2026-09-23";
const REVIEW_RATIONALE =
  "Thirty-day re-check required because tariff notifications, product lists, and portal guidance can change; review sooner after any model, firmware, RF, origin, or legal-source change.";

const wpcAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "obtain_exact_model_wpc_eta",
  order: 1,
  owner: "Indian importer or authorised Indian representative",
  instruction:
    "Confirm the exact model and RF bands, obtain the RF test report, then obtain the self-declaration ETA before filing the bill of entry.",
  prerequisites: [
    "Exact model identity and manufacturer are frozen",
    "Technical literature proves exact 2.4/5 GHz operation, spatial mode, and no 6 GHz capability",
  ],
  requiredDocuments: [
    "RF test report from an ISO/IEC 17025 accredited foreign lab or an NABL accredited Indian lab",
    "Manufacturer authorisation for the Indian representative",
    "Exact-model technical literature",
    "Signed or system-generated WPC import undertaking for Customs",
  ],
  destination: {
    label: "DoT WPC Equipment Type Approval service",
    url: "https://eservices.dot.gov.in/equipment-type-approval-eta",
  },
  rerunCondition:
    "Re-run the preflight after the exact-model ETA number and ETA document are attached.",
};

const bisAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "verify_bundled_adapter_bis_crs",
  order: 2,
  owner: "Power-adapter manufacturer and Indian importer",
  instruction:
    "Verify the bundled adapter's separate BIS CRS registration and visible Standard Mark, or replace it with a compliant registered adapter before shipment.",
  prerequisites: ["Freeze the adapter make, model, input/output rating, and manufacturing site"],
  requiredDocuments: [
    "BIS CRS registration for the exact adapter and manufacturing site",
    "Adapter label artwork showing the registration marking",
  ],
  destination: {
    label: "BIS Scheme II compulsory registration list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
  },
  rerunCondition:
    "Re-run after the exact adapter registration and label evidence are attached to the product model.",
};

const mtcteAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "verify_exact_model_mtcte_scope",
  order: 3,
  owner: "Original equipment manufacturer or authorised Indian representative",
  instruction:
    "Resolve the exact model against the current Wi-Fi CPE essential-requirement scope and attach the applicable MTCTE certificate or an official scope determination.",
  prerequisites: ["Exact hardware, software, interfaces, and model family are frozen"],
  requiredDocuments: [
    "Exact-model MTCTE certificate or official scope determination",
    "Current essential-requirement test reports where certification applies",
  ],
  destination: {
    label: "TEC MTCTE portal",
    url: "https://www.mtcte.tec.gov.in/",
  },
  rerunCondition:
    "Re-run after certificate applicability and the exact-model certificate status are no longer ambiguous.",
};

const repaAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "obtain_importer_repa",
  order: 4,
  owner: "Indian importer and reseller",
  instruction:
    "Obtain and verify the importer entity's Radio Equipment Possession Authorisation covering import for sale before taking possession or dealing in the shipment.",
  prerequisites: ["Importer legal entity and requested authorisation term are frozen"],
  requiredDocuments: [
    "Current REPA authorisation naming the importer",
    "Fee receipt and validity period covering the assessment date",
  ],
  destination: {
    label: "DoT Radio Equipment Possession Authorisation service",
    url: "https://www.eservices.dot.gov.in/radio-equipment-possession-authorisation-services",
  },
  rerunCondition:
    "Re-run after the importer REPA number, holder identity, scope, and validity are verified.",
};

const labelAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "complete_imported_retail_labels",
  order: 5,
  owner: "Indian importer",
  instruction:
    "Complete the imported retail package declarations before sale, without representing this rule as a customs-clearance blocker in this admitted pack.",
  prerequisites: ["Importer identity, retail quantity, and maximum retail price are frozen"],
  requiredDocuments: [
    "Retail label artwork",
    "Importer name and address",
    "Commodity name, net quantity, month/year, MRP, and consumer-care details",
  ],
  destination: {
    label: "DGFT General Notes to Import Policy 2025",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
  },
  rerunCondition: "Re-run after the final retail package artwork is attached.",
};

const sources: ProductPack["sources"] = [
  {
    id: "dgft-itc-hs-851762",
    authority: "Directorate General of Foreign Trade",
    title: "ITC (HS) Chapter 85 classification table",
    instrumentId: "ITC (HS) 2022, heading 8517",
    url: "https://content.dgft.gov.in/Website/dgftprod/f6d9d4ad-5eda-411b-be3d-508cd1013618/Trade%20Notice%2011%20-%20ITC%28HS%29%20based%20Export%20Policy.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Chapter 85 rows 851762, 85176230 and 85176290",
      relevance:
        "Distinguishes switching/routing apparatus from modems and places the admitted residual apparatus in 85176290.",
    },
    effectiveFrom: "2022-05-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "customs-bcd-10-2025",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 10/2025-Customs",
    instrumentId: "Notification No. 10/2025-Customs",
    url: "https://www.indiabudget.gov.in/budget2025-26/doc/cen/cus1025.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Pages 1–2, clause 1(vii) and clause 2",
      relevance:
        "Current amendment changes only item (g) of S. No. 20 and states the effective date, preserving the non-MIMO boundary used here.",
    },
    effectiveFrom: "2025-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "customs-current-sno20-reproduction",
    authority: "Office of the Commissioner of Customs, Ahmedabad",
    title: "Current official reproduction of Notification 57/2017-Customs S. No. 20",
    instrumentId: "Notice GEN/ADJ/COMM/3/2026-Adjn",
    url: "https://gujaratcustoms.gov.in/juridictional_commissionerate/public/storage/pdfs/HDHQzFLDqKPxaTqx4v1jS8GD0JNP5gNKsoaKLgBu.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Page 1, consolidated S. No. 20 entry and excluded product list",
      relevance:
        "A current Customs instrument reproduces the 10% concession and the MIMO exclusion that makes the admitted MIMO router ineligible.",
    },
    effectiveFrom: "2019-01-30",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "cbic-circular-08-2023",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Clarification regarding concessional BCD on specified telecom equipment",
    instrumentId: "Circular No. 08/2023-Customs",
    url: "https://taxinformation.cbic.gov.in/view-pdf/1003154/ENG/Circulars",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Page 1 paragraphs 1–3; Annexure 1 page 2 item (e); Annexure 2 page 3 code TEE001",
      relevance:
        "Defines excluded IP Radios to include Wi-Fi Access Point Equipment and Wi-Fi Controllers; applying it to this integrated router is the pack's stated conservative concession treatment.",
    },
    effectiveFrom: "2023-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "cbic-current-tariff-85176290",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Customs Tariff Chapter 85",
    instrumentId: "Customs Tariff Volume I, Chapter 85",
    url: "https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff%28ason30.06.2024%29/CUSTOMS_TARIFF_VOL-I/chap-85.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Printed page 1018 / PDF page 15, rows 851762, 85176230 and 85176290",
      relevance:
        "Shows the switching/routing hierarchy, separates modems at 85176230, and gives tariff item 85176290 a statutory 20% BCD.",
    },
    effectiveFrom: "2024-06-30",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale:
      "The CBIC current index labels the snapshot as 30 June 2025 while the underlying official path carries 30 June 2024; live ICEGATE is checked alongside it.",
  },
  {
    id: "icegate-current-85176290",
    authority: "Central Board of Indirect Taxes and Customs, ICEGATE",
    title: "Live tariff-item details for 85176290",
    instrumentId: "ICEGATE CTH 85176290 live detail",
    url: "https://www.icegate.gov.in/Webappl/Desc_details?cth=85176290&item_desc=",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Tariff item 85176290 detail: Other; import policy Free; standard duty 20",
      relevance:
        "Live-checks the current taxonomy, Free import policy, and standard 20% BCD while leaving description-dependent concessions separate.",
    },
    effectiveFrom: "2026-08-24",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "cbic-current-tariff-gri",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Customs Tariff General Rules for Interpretation",
    instrumentId: "Customs Tariff General Notes, GRI 3(b)",
    url: "https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff%28ason30.06.2025%29/CUSTOMS_TARIFF_VOL-I/General-Notes.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "General Rules for Interpretation, rule 3(b)",
      relevance:
        "Classifies a retail set by the component imparting essential character; here the routing main unit, not its dedicated adapter.",
    },
    effectiveFrom: "2025-06-30",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "customs-aidc-11-2021",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 11/2021-Customs",
    instrumentId: "Notification No. 11/2021-Customs",
    url: "https://www.indiabudget.gov.in/budget2021-22/doc/cen/cus1121.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Page 2, table S. No. 17: Any Chapter, residual goods, Nil",
      relevance:
        "Establishes a nil Agriculture Infrastructure and Development Cess for the admitted router after the listed categories are excluded.",
    },
    effectiveFrom: "2021-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "finance-act-2018-sws",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Social Welfare Surcharge levy",
    instrumentId: "Finance Act 2018, section 110",
    url: "https://www.cbic.gov.in/resources/htdocs-cbec/social_welfare_surcharge_levy.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Section 110(1)–(3), especially subsection (3)",
      relevance:
        "Imposes SWS at 10% of the aggregate covered customs duties; with nil AIDC here, the supported base is BCD.",
    },
    effectiveFrom: "2018-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "igst-rate-9-2025",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 9/2025-Integrated Tax (Rate)",
    instrumentId: "Notification No. 9/2025-Integrated Tax (Rate)",
    url: "https://taxinformation.cbic.gov.in/view-pdf/1010431/ENG/Notifications",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Schedule II, S. No. 490, heading 8517; commencement clause",
      relevance: "Places heading 8517 in the 18% integrated-tax schedule from 22 September 2025.",
    },
    effectiveFrom: "2025-09-22",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "customs-tariff-act-section-3",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Customs Tariff Act, 1975",
    instrumentId: "Customs Tariff Act, 1975, section 3",
    url: "https://taxinformation.cbic.gov.in/content-page/explore-act/1000542/1000002",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Section 3(7) and 3(8)",
      relevance:
        "Provides the import IGST levy and the value base including assessable value and pre-IGST customs duties.",
    },
    effectiveFrom: "2017-07-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "gst-compensation-cess-1-2017",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Notification No. 1/2017-Compensation Cess (Rate)",
    instrumentId: "Notification No. 1/2017-Compensation Cess (Rate)",
    url: "https://cbic-gst.gov.in/hindi/pdf/compensation-tax/notfctn-1-compensation-cess-english.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Page 5, Schedule S. No. 56: Any chapter, residual goods, Nil",
      relevance:
        "Establishes nil GST compensation cess for the admitted router outside the specifically listed goods.",
    },
    effectiveFrom: "2017-07-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "dot-wpc-eta-service",
    authority: "Department of Telecommunications, Wireless Planning and Coordination Wing",
    title: "Equipment Type Approval (ETA) service",
    instrumentId: "WPC ETA through self-declaration",
    url: "https://eservices.dot.gov.in/equipment-type-approval-eta",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator:
        "Details of Service paragraphs 1–2; Who Can Apply first bullet; Documents Required; validity section",
      relevance:
        "States ETA is required for import/sale/use, that the self-declaration is sufficient for Customs clearance processing, and lists exact-model evidence.",
    },
    effectiveFrom: "2024-09-09",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "dot-wpc-import-compendium",
    authority: "Department of Telecommunications, Wireless Planning and Coordination Wing",
    title: "Compendium of orders related to import licence",
    instrumentId: "File R-11018/02/2017-PP",
    url: "https://eservices.dot.gov.in/sites/default/files/circular-notifications/Compendium%20of%20Orders%20related%20import%20licence%20-signed%20copy%20060722.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Page 2 paragraph 2.1(a); Annex 2 pages 8–9; sample undertaking Annex 3 page 10",
      relevance:
        "For DGFT-Free licence-exempt RF goods, makes SD-ETA plus the import undertaking the documented release path presented to Customs.",
    },
    effectiveFrom: "2022-07-06",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "dot-eta-faq",
    authority: "Department of Telecommunications, Wireless Planning and Coordination Wing",
    title: "Frequently asked questions on Equipment Type Approval",
    instrumentId: "WPC ETA FAQ",
    url: "https://eservices.dot.gov.in/sites/default/files/faqs/eta_faq.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Questions 2, 4–5 and 8–11",
      relevance:
        "Requires ETA before importing a foreign-made finished product and directs submission of ETA plus undertaking to Customs.",
    },
    effectiveFrom: "2022-07-06",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "dot-license-exempt-bands",
    authority: "Department of Telecommunications",
    title: "Rules for licence-exempt 2.4 GHz and 5 GHz wireless access systems",
    instrumentId: "G.S.R. 45(E) and G.S.R. 1048(E)",
    url: "https://www.dot.gov.in/static/uploads/2025/07/84f33f09e137fa81930f44bcd5f2d238.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator:
        "G.S.R. 45(E), PDF pages 141–144, English rules 3–6 and table; G.S.R. 1048(E), PDF pages 145–153, English rules 3–7",
      relevance:
        "Defines the 2400–2483.5 MHz and specified 5 GHz technical limits and type-approval requirements used by this narrow radio boundary.",
    },
    effectiveFrom: "2005-01-28",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "dot-6ghz-eta-notice",
    authority: "Department of Telecommunications, Wireless Planning and Coordination Wing",
    title: "Public notice for ETA of equipment capable of the 5925–6425 MHz band",
    instrumentId: "Public Notice R-11010/02/2026-PP",
    url: "https://www.dot.gov.in/static/uploads/2026/03/dfb5fecb0467e2f52529cd4c0ff5dfd6.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Pages 1–2, paragraphs 2–7",
      relevance:
        "Requires 6 GHz-capable hardware to replace a 2.4/5-only ETA, so any such capability is outside this pack.",
    },
    effectiveFrom: "2026-03-06",
    lastChecked: ADMITTED_AT,
    reviewAfter: "2026-09-23",
    reviewRationale:
      "Early re-check because the notice header and signature/file chronology conflict; no deadline from it is admitted.",
  },
  {
    id: "dot-repa-2026",
    authority: "Department of Telecommunications",
    title: "Telecommunications (Radio Equipment Possession Authorisation) Rules, 2026",
    instrumentId: "G.S.R. 592(E)",
    url: "https://eservices.dot.gov.in/sites/default/files/media-docs/telecommunications-radio-equipment-possession-authorisation-rules-2026-2.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Rules 4–6 and 8–10",
      relevance:
        "Rule 4(1)(a) covers import for sale; the exemption explanation prevents a reseller from relying on exempt possession.",
    },
    effectiveFrom: "2026-07-08",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "mtcte-framework-2025",
    authority: "Telecommunication Engineering Centre",
    title: "Telecommunications conformity assessment and certification rules",
    instrumentId: "G.S.R. 315(E)",
    url: "https://www.dot.gov.in/static/uploads/2025/07/95e6f36b7e0b008ea6e650f6f312f9e2.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "English Gazette pages 6–9, rules 4, 7–9 and 12",
      relevance:
        "Requires conformity and certification for notified equipment before sale, network deployment, or use and states enforcement consequences.",
    },
    effectiveFrom: "2025-05-16",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "mtcte-products-current",
    authority: "Telecommunication Engineering Centre",
    title: "Current MTCTE notified-products list",
    instrumentId: "MTCTE Product List",
    url: "https://mtcte.tec.gov.in/filedownload?name=downloadDocument_ProductsList.docx",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator:
        "Row ‘Equipments Operating in 2.4 GHz and 5 GHz Band’, variant ‘Wifi Access Points and CPE’, mandatory date 1 January 2024",
      relevance:
        "Maps the admitted home router to Wi-Fi CPE rather than the separate BNG/BRAS/cloud/IPv4/IPv6/MPLS router variants.",
    },
    effectiveFrom: "2024-01-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "mtcte-procedure-2024",
    authority: "Telecommunication Engineering Centre",
    title: "MTCTE Procedure version 3.0",
    instrumentId: "TEC 93009:2024",
    url: "https://mtcte.tec.gov.in/filedownload?name=downloadDocument_MTCTEProcedure.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator:
        "Clauses 4.1, 4.3–4.5, 5.1, 5.4, 5.8, 5.12, 9.1, 15.1, 17.8 and Annexure D clause 12",
      relevance:
        "Requires an OEM/AIR wishing to sell or import notified equipment to obtain and label the certificate, without a current Customs-denial pinpoint.",
    },
    effectiveFrom: "2024-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "nccs-wifi-cpe-itsar",
    authority: "National Centre for Communication Security",
    title: "Indian Telecom Security Assurance Requirements for Wi-Fi CPE",
    instrumentId: "ITSAR402122512 version 2.0.0",
    url: "https://nccs.gov.in/public/itsar/ITSAR402122512.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Release 1 December 2025, pages 8–9",
      relevance:
        "Expressly includes home Wi-Fi routers in Wi-Fi CPE security scope; the blank enforcement-date field is not treated as authority for a new date.",
    },
    effectiveFrom: "2025-12-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "bis-cro-2021-adapter",
    authority: "Ministry of Electronics and Information Technology",
    title: "Electronics and Information Technology Goods Compulsory Registration Order, 2021",
    instrumentId: "S.O. 1248(E)",
    url: "https://www.bis.gov.in/wp-content/uploads/2021/11/Electronics-and-Information-Technology-Goods-Requirement-of-Compulsory-Registration-Order-2021-1.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "English pages 5–7, paragraphs 2–3 and Schedule item 16",
      relevance:
        "Requires Power Adaptors for IT Equipment to conform and bear the Standard Mark under a BIS licence.",
    },
    effectiveFrom: "2021-09-18",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "bis-scheme-ii-adapter",
    authority: "Bureau of Indian Standards",
    title: "Products under Compulsory Certification, Scheme II",
    instrumentId: "Electronics and IT Goods Compulsory Registration Order, item 16",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Table row 16, Power Adaptors for IT Equipment",
      relevance:
        "Lists the bundled IT power adapter as a separately notified compulsory-registration product and gives the current standard.",
    },
    effectiveFrom: "2021-09-18",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "meity-crs-faq-adapter",
    authority: "Ministry of Electronics and Information Technology",
    title: "Frequently Asked Questions on the Compulsory Registration Order",
    instrumentId: "MeitY CRS FAQ",
    url: "https://www.meity.gov.in/static/uploads/2024/02/Modified-FAQs-CRO.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Modified 28 September 2022, page 10, Q44 and Q47",
      relevance:
        "Explains that a power adapter is independently notified, must be independently registered, and must have visible marking.",
    },
    effectiveFrom: "2022-09-28",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "bis-adapter-standard-transition",
    authority: "Bureau of Indian Standards",
    title: "Migration to IS/IEC 62368 Part 1:2023",
    instrumentId: "S.O. 4997(E)",
    url: "https://www.bis.gov.in/wp-content/uploads/2025/11/Migration-to-IS-IEC-62368-Part-1-2023-from-IS-13252-Part-1-2010-and-IS-616-2017.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "English page 3, subparagraphs (i) and (v)",
      relevance:
        "Allows the old and new adapter safety standards concurrently through 1 November 2028 during the current transition.",
    },
    effectiveFrom: "2025-11-04",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "dgft-general-import-notes-2025",
    authority: "Directorate General of Foreign Trade",
    title: "General Notes Regarding Import Policy",
    instrumentId: "ITC (HS) 2022 Schedule 1 General Notes, 2025 compilation",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Page 3, paragraph 2(C); pages 5–6, paragraph 5",
      relevance:
        "Proves the Customs consequence for unregistered notified IT goods and separately lists imported retail-package declarations.",
    },
    effectiveFrom: "2022-05-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
  {
    id: "icegate-duty-calculator",
    authority: "Central Board of Indirect Taxes and Customs, ICEGATE",
    title: "Custom Duty Calculator",
    instrumentId: "ICEGATE Customs Duty Calculator",
    url: "https://www.icegate.gov.in/services/custom-duty-calculator",
    official: true,
    sourceType: "primary_official",
    pinpoint: {
      locator: "Import duty calculator service; country/origin and anti-dumping inputs",
      relevance:
        "Provides the official assessment-date destination for re-checking preferential and trade-remedy applicability.",
    },
    effectiveFrom: "2026-08-24",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
    reviewRationale: REVIEW_RATIONALE,
  },
];

const includedFacts = {
  condition: "new",
  deviceType: "wifi_cpe_router",
  formFactor: "finished_standalone_single_unit",
  intendedUse: "indoor_retail_resale",
  packaging: "retail_packaged",
  principalFunction: "ipv4_ipv6_routing_between_ethernet_wan_lan_and_wifi",
  hasIntegratedWifiAccessPoint: true,
  radioBandsGhz: ["2.4", "5"],
  rfFrequencyRangesMhz: [
    "2400-2483.5",
    "5150-5250",
    "5250-5350",
    "5470-5725",
    "5725-5875",
  ],
  wifiSpatialMode: "mimo",
  wirelessTopology: "indoor_non_point_to_point",
  maxAntennaGainDbi: 6,
  hasSixGhzRadio: false,
  hardwareCapableOfSixGhz: false,
  hasCellularRadio: false,
  hasIntegratedModem: false,
  hasOpticalNetworkTerminal: false,
  hasVoipFunction: false,
  hasBluetoothRadio: false,
  hasZigbeeRadio: false,
  hasNfcRadio: false,
  hasOtherRadio: false,
  hasBattery: false,
  isCloudImplementedOrManaged: false,
  powerSupply: "one_external_ac_dc_it_adapter",
  adapterHasRadio: false,
  retailSetContents: "one_router_one_dedicated_adapter",
} as const;

const requiredDistinguishingFacts = [
  "modelIdentity",
  "manufacturerIdentity",
  "condition",
  "deviceType",
  "formFactor",
  "intendedUse",
  "packaging",
  "principalFunction",
  "hasIntegratedWifiAccessPoint",
  "radioBandsGhz",
  "rfFrequencyRangesMhz",
  "wifiSpatialMode",
  "wirelessTopology",
  "maxAntennaGainDbi",
  "hasSixGhzRadio",
  "hardwareCapableOfSixGhz",
  "hasCellularRadio",
  "hasIntegratedModem",
  "hasOpticalNetworkTerminal",
  "hasVoipFunction",
  "hasBluetoothRadio",
  "hasZigbeeRadio",
  "hasNfcRadio",
  "hasOtherRadio",
  "hasBattery",
  "isCloudImplementedOrManaged",
  "powerSupply",
  "adapterHasRadio",
  "adapterModelIdentity",
  "retailSetContents",
] as const;

const scenarioFacts = {
  ...includedFacts,
  modelIdentity: "BWMI-MIMO-245-R1",
  manufacturerIdentity: "Reviewed fixture manufacturer",
  adapterModelIdentity: "BWMI-ADAPTER-12V-R1",
};

const rules: ProductPack["rules"] = [
  {
    id: "wpc_eta",
    title: "Exact-model WPC Equipment Type Approval",
    applicability: [
      "Finished commercial wireless device",
      "Operates only in the admitted licence-exempt 2.4 GHz and 5 GHz bands",
      "Imported for retail resale in India",
    ],
    requiredEvidence: [
      "ETA document for the exact model",
      "Signed or system-generated WPC import undertaking",
      "Exact-model RF test report",
      "Manufacturer authorisation and technical literature",
      "RF report proves the admitted sub-bands, power, PSD, antenna gain, DFS/TPC and out-of-band limits",
    ],
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "dot-wpc-import-compendium",
      pinpoint:
        "Page 2 paragraph 2.1(a), Annex 2 pages 8–9 and sample undertaking Annex 3 page 10 state the ETA and undertaking release path for DGFT-Free licence-exempt RF goods.",
    },
    consequence:
      "Without exact-model ETA evidence, this pack treats Customs clearance as blocked; a model or RF-band ambiguity is Needs verification.",
    remediation: [wpcAction],
    sourceIds: [
      "dot-wpc-eta-service",
      "dot-wpc-import-compendium",
      "dot-eta-faq",
      "dot-license-exempt-bands",
      "dot-6ghz-eta-notice",
    ],
    effectiveFrom: "2022-07-06",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "bis_power_adapter",
    title: "Separate BIS CRS registration for the bundled IT power adapter",
    applicability: [
      "Retail pack contains one normal external AC-to-DC power adapter for IT equipment",
      "Adapter is imported with the router and is not covered by a recorded exemption",
    ],
    requiredEvidence: [
      "Exact-adapter BIS CRS registration",
      "Registration matches the adapter model and manufacturing site",
      "Visible Standard Mark and registration number on the adapter label",
    ],
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "dgft-general-import-notes-2025",
      pinpoint:
        "Page 3, paragraph 2(C) prohibits imports of notified E&IT goods without BIS registration/exemption and states the Customs consequence.",
    },
    consequence:
      "A bundled notified adapter without exact registration or exemption makes the imported notified good prohibited under the cited DGFT note.",
    remediation: [bisAction],
    sourceIds: [
      "bis-scheme-ii-adapter",
      "bis-cro-2021-adapter",
      "meity-crs-faq-adapter",
      "bis-adapter-standard-transition",
      "dgft-general-import-notes-2025",
    ],
    effectiveFrom: "2021-09-18",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "mtcte_wifi_cpe",
    title: "MTCTE scope and exact-model certificate for Wi-Fi CPE",
    applicability: [
      "The finished device is a Wi-Fi customer-premises router in the 2.4/5 GHz ER family",
      "It will be sold, deployed, or used in India",
    ],
    requiredEvidence: [
      "Current exact-model or family integrated MTCTE certificate where the ER and ITSAR apply",
      "Certificate labels and applicable ER/ITSAR reports cover every admitted interface and radio band",
      "Official scope determination if certificate applicability is disputed",
    ],
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "Current official evidence conditions sale, deployment, or use; this pack does not call it a Customs-clearance blocker without a current Customs pinpoint.",
    remediation: [mtcteAction],
    sourceIds: [
      "mtcte-framework-2025",
      "mtcte-products-current",
      "mtcte-procedure-2024",
      "nccs-wifi-cpe-itsar",
    ],
    effectiveFrom: "2024-01-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "repa_import_for_sale",
    title: "Radio Equipment Possession Authorisation for import for sale",
    applicability: [
      "The Indian entity imports the radio equipment for sale",
      "The importer cannot rely on a possession exemption while selling or hiring equipment",
    ],
    requiredEvidence: [
      "Current REPA authorisation naming the importer",
      "Authorisation validity covers the assessment and possession period",
    ],
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "Confirmed missing REPA blocks lawful importer/reseller possession and dealing, but no checked official pinpoint makes it a Customs-release check.",
    remediation: [repaAction],
    sourceIds: ["dot-repa-2026"],
    effectiveFrom: "2026-07-08",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "legal_metrology_labels",
    title: "Imported retail-package declarations",
    applicability: [
      "The router is a prepackaged commodity imported for retail resale",
      "No wholesale-only or institutional-consumer exclusion is admitted",
    ],
    requiredEvidence: [
      "Final package artwork naming the importer and commodity",
      "Net quantity, month/year, MRP inclusive of charges, and consumer-care details",
    ],
    clearanceEffect: "non_clearance",
    failureEffect: "warning_only",
    consequence:
      "The retail package remains subject to Legal Metrology declarations, but the checked pinpoint does not prove this exact defect prevents Customs clearance.",
    remediation: [labelAction],
    sourceIds: ["dgft-general-import-notes-2025"],
    effectiveFrom: "2011-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
];

const rates: ProductPack["rates"] = [
  {
    id: "basic_customs_duty",
    percent: 20,
    base: "assessable_value",
    applicability: [
      "HS 85176290",
      "Finished integrated Wi-Fi routing and access-point equipment",
      "MIMO configuration independently falls within an enumerated S. No. 20 exclusion",
      "No concessional or preferential tariff claim is admitted",
    ],
    formula: "assessable value × statutory merit BCD 20%",
    determination:
      "Conservative inference: the integrated Wi-Fi access-point function is treated as excluded IP Radio equipment under CBIC Circular 08/2023, and the admitted MIMO configuration is independently outside the 10% concession; this pack claims no concession.",
    sourceIds: [
      "customs-current-sno20-reproduction",
      "cbic-circular-08-2023",
      "cbic-current-tariff-85176290",
      "icegate-current-85176290",
      "customs-bcd-10-2025",
    ],
    effectiveFrom: "2023-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "agriculture_infrastructure_development_cess",
    percent: 0,
    base: "assessable_value",
    applicability: ["Residual Any Chapter entry after S. Nos. 1–16 are excluded"],
    formula: "assessable value × 0%",
    determination: "Notification 11/2021-Customs residual Any Chapter entry sets AIDC to Nil.",
    sourceIds: ["customs-aidc-11-2021", "icegate-duty-calculator"],
    effectiveFrom: "2021-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "social_welfare_surcharge",
    percent: 10,
    base: "basic_customs_duty",
    applicability: ["BCD is payable and AIDC is nil in the admitted scenario"],
    formula: "basic customs duty × 10%",
    determination: "Finance Act 2018 section 110 applies 10% SWS to the covered BCD in this scenario.",
    sourceIds: ["finance-act-2018-sws", "icegate-duty-calculator"],
    effectiveFrom: "2018-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "igst",
    percent: 18,
    base: "assessable_value_plus_bcd_plus_sws",
    applicability: ["Heading 8517, Schedule II", "No product-specific exemption is admitted"],
    formula: "(assessable value + BCD + nil AIDC + SWS) × 18%",
    determination:
      "Notification 9/2025 places heading 8517 in the 18% schedule and Customs Tariff Act section 3(8) supplies the import-tax base.",
    sourceIds: ["igst-rate-9-2025", "customs-tariff-act-section-3"],
    effectiveFrom: "2025-09-22",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
  {
    id: "gst_compensation_cess",
    percent: 0,
    base: "assessable_value",
    applicability: ["Residual Any chapter entry after specifically listed cess goods are excluded"],
    formula: "applicable compensation-cess base × 0%",
    determination:
      "Notification 1/2017-Compensation Cess (Rate) gives residual Any chapter goods a Nil rate.",
    sourceIds: ["gst-compensation-cess-1-2017", "icegate-duty-calculator"],
    effectiveFrom: "2017-07-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: REVIEW_AFTER,
  },
];

function findings(evidence: Record<string, "present" | "absent" | "unknown">): string[] {
  return rules.map(
    (rule) => `${rule.id}:${rule.clearanceEffect}:${evidence[rule.id] ?? "unknown"}`,
  );
}

const costLines: ProductPack["fixtures"][number]["costLines"] = [
  { id: "assessable_value", amountInr: "100000.00" },
  { id: "basic_customs_duty", amountInr: "20000.00" },
  { id: "agriculture_infrastructure_development_cess", amountInr: "0.00" },
  { id: "social_welfare_surcharge", amountInr: "2000.00" },
  { id: "igst", amountInr: "21960.00" },
  { id: "gst_compensation_cess", amountInr: "0.00" },
  { id: "total_import_duties", amountInr: "43960.00" },
];

const readyEvidence = {
  wpc_eta: "present",
  bis_power_adapter: "present",
  mtcte_wifi_cpe: "present",
  repa_import_for_sale: "present",
  legal_metrology_labels: "present",
} as const;

const blockedEvidence = {
  ...readyEvidence,
  wpc_eta: "absent",
} as const;

const needsVerificationEvidence = {
  ...readyEvidence,
  mtcte_wifi_cpe: "unknown",
} as const;

export const routerPack: ProductPack = {
  id: "india-retail-wifi-router-mimo-v1",
  version: "1.0.0-source-admitted",
  title: "New retail integrated 2.4/5 GHz Wi-Fi CPE router",
  lifecycleStatus: "source_admitted",
  admittedAt: ADMITTED_AT,
  selectable: false,
  publicRuntimeEnabled: false,
  admissionScope: {
    productPackId: "india-retail-wifi-router-mimo-v1",
    mappingApplicability: includedFacts,
    rateApplicability: {
      productPackId: "india-retail-wifi-router-mimo-v1",
      hsCode: "85176290",
    },
    sourceIds: sources.map((source) => source.id),
    ruleIds: rules.map((rule) => rule.id),
    fixtureIds: [
      "router-ready-reviewed",
      "router-blocked-reviewed",
      "router-needs-verification-reviewed",
    ],
    actionIds: [...new Set(rules.flatMap((rule) => rule.remediation.map((action) => action.id)))],
    sharedApplicabilityDeclarations: [
      {
        moduleId: "shared.legal_metrology_retail_package",
        applicableProductPackId: "india-retail-wifi-router-mimo-v1",
        requiredScenarioFacts: {
          intendedUse: "indoor_retail_resale",
          packaging: "retail_packaged",
        },
        ruleIds: ["legal_metrology_labels"],
        sourceIds: ["dgft-general-import-notes-2025"],
      },
      {
        moduleId: "shared.repa_import_for_sale",
        applicableProductPackId: "india-retail-wifi-router-mimo-v1",
        requiredScenarioFacts: {
          intendedUse: "indoor_retail_resale",
          hasIntegratedWifiAccessPoint: true,
        },
        ruleIds: ["repa_import_for_sale"],
        sourceIds: ["dot-repa-2026"],
      },
      {
        moduleId: "shared.wpc_eta_import",
        applicableProductPackId: "india-retail-wifi-router-mimo-v1",
        requiredScenarioFacts: {
          intendedUse: "indoor_retail_resale",
          radioBandsGhz: ["2.4", "5"],
        },
        ruleIds: ["wpc_eta"],
        sourceIds: [
          "dot-wpc-eta-service",
          "dot-wpc-import-compendium",
          "dot-eta-faq",
          "dot-license-exempt-bands",
        ],
      },
    ],
  },
  scenario: {
    id: "new-retail-integrated-wifi-cpe-router",
    name: "New single-unit indoor retail integrated Wi-Fi CPE router with one external adapter",
    includedFacts,
    requiredDistinguishingFacts: [...requiredDistinguishingFacts],
    excludedVariants: [
      "Any missing or unknown spatial-stream/antenna configuration",
      "6 GHz-capable hardware, even when 6 GHz is software-disabled",
      "Cellular, satellite, Bluetooth, Zigbee, NFC, other-radio, VoIP, modem, ONT, DSL, cable, or optical functions",
      "Access-point-only devices, mesh or multi-unit bundles, and WLAN controllers",
      "Carrier-grade or enterprise chassis routers",
      "Cloud-implemented or cloud-managed functional components",
      "Battery-powered, PoE-only, used, refurbished, repaired, component, or kit imports",
    ],
  },
  hsMapping: {
    hsCode: "85176290",
    label: "Other machines for reception, conversion and transmission or regeneration of data",
    confidence: "high",
    provenance: "admitted_mapping",
    rationale:
      "The exact facts establish a finished switching/routing apparatus and exclude the adjacent modem line. Under GRI 3(b), the router main unit gives the one-router/one-dedicated-adapter retail set its essential character.",
    applicabilityFacts: includedFacts,
    distinguishingFacts: [...requiredDistinguishingFacts],
    sourceIds: [
      "dgft-itc-hs-851762",
      "cbic-current-tariff-85176290",
      "cbic-current-tariff-gri",
      "icegate-current-85176290",
    ],
  },
  sources,
  rules,
  rates,
  fixtures: [
    {
      id: "router-ready-reviewed",
      name: "Exact integrated model with all clearance evidence and duty gate resolved",
      expectedOutcome: "ready",
      expectedCustomsClearanceBlocked: false,
      facts: {
        productPackId: "india-retail-wifi-router-mimo-v1",
        assessmentDate: ADMITTED_AT,
        assessableValueInr: "100000",
        originCountryCode: "VN",
        importerIdentity: "Reviewed fixture importer India Pvt Ltd",
        producerIdentity: "Reviewed fixture producer",
        exporterIdentity: "Reviewed fixture exporter",
        preferentialTariffClaim: "none",
        scenario: scenarioFacts,
        evidence: readyEvidence,
        tradeRemedyCheck: "confirmed_no_match",
      },
      findings: findings(readyEvidence),
      costLines,
      sourceIds: [
        "dgft-itc-hs-851762",
        "dot-wpc-import-compendium",
        "dot-repa-2026",
        "bis-scheme-ii-adapter",
        "cbic-current-tariff-85176290",
        "cbic-circular-08-2023",
        "icegate-current-85176290",
        "igst-rate-9-2025",
        "icegate-duty-calculator",
      ],
      actions: [wpcAction, bisAction, mtcteAction, repaAction, labelAction],
      reviewedAt: ADMITTED_AT,
    },
    {
      id: "router-blocked-reviewed",
      name: "Exact integrated model with confirmed missing WPC ETA",
      expectedOutcome: "blocked",
      expectedCustomsClearanceBlocked: true,
      facts: {
        productPackId: "india-retail-wifi-router-mimo-v1",
        assessmentDate: ADMITTED_AT,
        assessableValueInr: "100000",
        originCountryCode: "VN",
        importerIdentity: "Reviewed fixture importer India Pvt Ltd",
        producerIdentity: "Reviewed fixture producer",
        exporterIdentity: "Reviewed fixture exporter",
        preferentialTariffClaim: "none",
        scenario: scenarioFacts,
        evidence: blockedEvidence,
        tradeRemedyCheck: "confirmed_no_match",
      },
      findings: findings(blockedEvidence),
      costLines,
      sourceIds: ["dot-wpc-import-compendium", "dot-eta-faq", "dot-license-exempt-bands"],
      actions: [wpcAction],
      reviewedAt: ADMITTED_AT,
    },
    {
      id: "router-needs-verification-reviewed",
      name: "Exact integrated model with unresolved MTCTE scope and trade-remedy gate",
      expectedOutcome: "needs_verification",
      expectedCustomsClearanceBlocked: false,
      facts: {
        productPackId: "india-retail-wifi-router-mimo-v1",
        assessmentDate: ADMITTED_AT,
        assessableValueInr: "100000",
        originCountryCode: null,
        importerIdentity: "Reviewed fixture importer India Pvt Ltd",
        producerIdentity: null,
        exporterIdentity: null,
        preferentialTariffClaim: "none",
        scenario: scenarioFacts,
        evidence: needsVerificationEvidence,
        tradeRemedyCheck: "unknown",
      },
      findings: findings(needsVerificationEvidence),
      costLines: [],
      sourceIds: ["mtcte-framework-2025", "mtcte-products-current", "icegate-duty-calculator"],
      actions: [mtcteAction],
      reviewedAt: ADMITTED_AT,
    },
  ],
};
