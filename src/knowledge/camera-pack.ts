import type { ProductPack } from "./schema";

const PACK_ID = "india-retail-indoor-wifi-ip-camera-v1";
const ADMITTED_AT = "2026-08-24";
const RATE_REVIEW_AFTER = "2026-09-24";
const RULE_REVIEW_AFTER = "2026-11-24";
const REVIEW_RATIONALE =
  "Re-check on the stated date and immediately after any model, camera function, radio, power, accessory, origin, party, packaging, tariff, notification, product-list, portal-guidance, or primary-source change.";

type PackSource = ProductPack["sources"][number];
type SourceInput = Omit<
  PackSource,
  "official" | "sourceType" | "lastChecked" | "reviewRationale"
>;

function officialSource(input: SourceInput): PackSource {
  return {
    ...input,
    official: true,
    sourceType: "primary_official",
    lastChecked: ADMITTED_AT,
    reviewRationale: REVIEW_RATIONALE,
  };
}

const sources: ProductPack["sources"] = [
  officialSource({
    id: "camera-cbic-tariff-85258900",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Customs Tariff, Chapter 85",
    instrumentId: "First Schedule, heading 8525",
    url: "https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff(ason30.06.2024)/CUSTOMS_TARIFF_VOL-I/chap-85.pdf",
    pinpoint: {
      locator: "Heading 8525, tariff items 85258100 to 85258900",
      relevance:
        "Places television, digital and video cameras outside the three special technical subheadings in residual item 85258900 at 20%.",
    },
    effectiveFrom: "2022-05-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-icegate-classification-85258900",
    authority: "Indian Customs Electronic Gateway",
    title: "Live tariff description for 85258900",
    instrumentId: "ICEGATE CTH 85258900 description response",
    url: "https://www.icegate.gov.in/Webappl/Desc_details?cth=85258900&item_desc=",
    pinpoint: {
      locator: "Live row for 85258900, television cameras, digital cameras and video camera recorders: Other",
      relevance:
        "Confirms the current residual camera tariff item used by the exact finished indoor IP-camera boundary.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-icegate-duty-85258900",
    authority: "Indian Customs Electronic Gateway",
    title: "Live base-duty response for 85258900",
    instrumentId: "ICEGATE DueFee1 CTH 85258900",
    url: "https://www.icegate.gov.in/Webappl/DueFee1?cth_val=85258900&cntrycd=",
    pinpoint: {
      locator: "Live JSON fields bcd_rate 20, scd_rate 10, igst_rate 18 and gstcess_rate 0",
      relevance:
        "Confirms the current base BCD, SWS, IGST and generic compensation-cess fields; AIDC is resolved from its controlling notification.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-icegate-duty-options-85258900",
    authority: "Indian Customs Electronic Gateway",
    title: "Live notification options for 85258900",
    instrumentId: "ICEGATE DueFee11 CTH 85258900",
    url: "https://www.icegate.gov.in/Webappl/DueFee11?cth_val=85258900&cntrycd=",
    pinpoint: {
      locator:
        "Live BCD options including Notification 45/2025 S.No.289, IGST 18% options, nil AIDC options and SWS records",
      relevance:
        "Requires each apparent option to be tested against its controlling product and movement description instead of selected automatically.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-customs-45-2025",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 45/2025-Customs",
    instrumentId: "G.S.R. 781(E)",
    url: "https://egazette.gov.in/WriteReadData/2025/267119.pdf",
    pinpoint: {
      locator:
        "Official PDF page 324, S.Nos.288-289; page 325, S.No.294",
      relevance:
        "S.No.289 gives 10% only to goods other than CCTV/IP cameras, while S.No.294 concerns manufacturing inputs, so this finished camera retains the 20% tariff rate.",
    },
    effectiveFrom: "2025-11-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-customs-aidc-11-2021",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 11/2021-Customs",
    instrumentId: "G.S.R. 69(E)",
    url: "https://egazette.gov.in/WriteReadData/2021/224869.pdf",
    pinpoint: {
      locator: "Page 35 S.No.17, residual Any Chapter entry at Nil",
      relevance: "Supplies the nil AIDC rate admitted for this product.",
    },
    effectiveFrom: "2021-02-02",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-finance-act-2018-sws",
    authority: "Ministry of Law and Justice",
    title: "Finance Act, 2018",
    instrumentId: "Act No. 13 of 2018",
    url: "https://egazette.gov.in/WriteReadData/2018/184302.pdf",
    pinpoint: {
      locator: "Page 40, section 110(1)-(4)",
      relevance: "Imposes Social Welfare Surcharge at 10% of the covered customs-duty base.",
    },
    effectiveFrom: "2018-02-02",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-igst-9-2025",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 9/2025-Integrated Tax (Rate)",
    instrumentId: "Notification No. 9/2025-Integrated Tax (Rate)",
    url: "https://courier.cbic.gov.in/ECCS/advisory/2025/NOTIFICATION%20NO.%209_2025-INTEGRATED%20TAX%20%28RATE%29%20-1759486719.pdf",
    pinpoint: {
      locator: "Schedule II entry for heading 8525, corroborated by ICEGATE option II497",
      relevance: "Places the admitted camera heading in the 18% IGST schedule.",
    },
    effectiveFrom: "2025-09-22",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-customs-tariff-act-igst-base",
    authority: "Legislative Department, Ministry of Law and Justice",
    title: "Customs Tariff Act, 1975",
    instrumentId: "Act No. 51 of 1975",
    url: "https://www.indiacode.nic.in/bitstream/123456789/8287/1/a1975-51.pdf",
    pinpoint: {
      locator: "Section 3(8)",
      relevance: "Defines the IGST base as assessable value plus applicable customs duties and sums, excluding IGST and compensation cess.",
    },
    effectiveFrom: "2017-07-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-compensation-cess-1-2017",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 1/2017-Compensation Cess (Rate)",
    instrumentId: "Notification No. 1/2017-Compensation Cess (Rate)",
    url: "https://cbic-gst.gov.in/hindi/pdf/compensation-tax/notfctn-1-compensation-cess-english.pdf",
    pinpoint: {
      locator: "Page 5, residual Any Chapter entry at Nil",
      relevance: "Supplies the residual nil compensation-cess rate.",
    },
    effectiveFrom: "2017-07-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dot-wpc-eta-service",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Equipment Type Approval service",
    instrumentId: "DoT eServices ETA guidance",
    url: "https://eservices.dot.gov.in/equipment-type-approval-eta",
    pinpoint: {
      locator: "Details, Who Can Apply, Documents Required, Fees, Process and Validity; camera example",
      relevance:
        "Expressly requires ETA for import, sale and use of licence-exempt wireless cameras and states that importer self-declaration may support Customs clearance.",
    },
    effectiveFrom: "2022-07-06",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dot-eta-faq",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Frequently Asked Questions on Equipment Type Approval",
    instrumentId: "WPC ETA FAQ",
    url: "https://eservices.dot.gov.in/sites/default/files/faqs/eta_faq.pdf",
    pinpoint: {
      locator: "Questions 2, 4-5 and 8-11",
      relevance:
        "Requires exact-finished-product ETA, RF-module reports and the import undertaking used with Customs.",
    },
    effectiveFrom: "2022-07-06",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dot-import-compendium",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Compendium of orders related to import licence",
    instrumentId: "WPC File R-11018/02/2017-PP",
    url: "https://eservices.dot.gov.in/sites/default/files/circular-notifications/Compendium%20of%20Orders%20related%20import%20licence%20-signed%20copy%20060722.pdf",
    pinpoint: {
      locator: "Page 2 paragraph 2.1(a), Annexure 2 pages 8-9 and undertaking Annexure 3 page 10",
      relevance:
        "Makes exact-model self-declaration ETA plus the prescribed undertaking the admitted licence-exempt Customs route.",
    },
    effectiveFrom: "2022-07-06",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dot-license-exempt-bands",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Compendium of subordinate legislation for licence-exempt spectrum",
    instrumentId: "G.S.R.45(E) and G.S.R.1048(E)",
    url: "https://www.dot.gov.in/static/uploads/2025/07/84f33f09e137fa81930f44bcd5f2d238.pdf",
    pinpoint: {
      locator: "PDF pages 141-153, rules and tables for 2.4 GHz and 5 GHz bands",
      relevance: "Defines the exact licence-exempt band, power, PSD, antenna, DFS/TPC and type-approval boundaries.",
    },
    effectiveFrom: "2018-10-22",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dot-repa-2026",
    authority: "Department of Telecommunications",
    title: "Telecommunications (Radio Equipment Possession Authorisation) Rules, 2026",
    instrumentId: "G.S.R.592(E)",
    url: "https://eservices.dot.gov.in/sites/default/files/media-docs/telecommunications-radio-equipment-possession-authorisation-rules-2026-2.pdf",
    pinpoint: {
      locator: "Rules 4-6 and 8-10, English Gazette pages 8-11",
      relevance: "Covers purchase or import for sale, holder/model scope, fees, duration and possession conditions.",
    },
    effectiveFrom: "2026-07-08",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-bis-scheme-ii-current",
    authority: "Bureau of Indian Standards",
    title: "Current Scheme II compulsory registration list",
    instrumentId: "MeitY CRS current product list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
    pinpoint: {
      locator: "Items 16 and 41",
      relevance:
        "Lists power adaptors for IT equipment and CCTV Cameras/CCTV Recorders as separately registered notified products under the current safety standard.",
    },
    effectiveFrom: "2021-09-18",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-bis-security-1652-2024",
    authority: "Ministry of Electronics and Information Technology",
    title: "Essential security requirements for CCTV cameras",
    instrumentId: "S.O.1652(E)",
    url: "https://www.bis.gov.in/wp-content/uploads/2024/04/CCTV-Camera-CRO-2021.pdf",
    pinpoint: {
      locator: "PDF pages 12-24, order paragraphs 2-3 and annexed Essential Security Requirements",
      relevance:
        "Applies the compulsory-registration order and annexed security testing to CCTV cameras after the six-month implementation period.",
    },
    effectiveFrom: "2024-10-09",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-bis-transition-4997-2025",
    authority: "Ministry of Electronics and Information Technology",
    title: "Migration to IS/IEC 62368-1:2023",
    instrumentId: "S.O.4997(E)",
    url: "https://www.bis.gov.in/wp-content/uploads/2025/11/Migration-to-IS-IEC-62368-Part-1-2023-from-IS-13252-Part-1-2010-and-IS-616-2017.pdf",
    pinpoint: {
      locator: "English page 3, subparagraphs (i) and (v)",
      relevance: "Defines the current transition window for safety registrations covering the camera and dedicated adapter.",
    },
    effectiveFrom: "2025-11-04",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dgft-general-notes-2025",
    authority: "Directorate General of Foreign Trade",
    title: "General Notes to Import Policy 2025",
    instrumentId: "ITC (HS) 2022 Schedule 1 General Notes",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
    pinpoint: {
      locator: "PDF pages 2-3 paragraph 2(A)/(C); pages 5-6 paragraph 5",
      relevance:
        "Makes notified BIS compliance a condition of import, prescribes re-export or deformation/scrap for unregistered goods, and lists retail-package declarations.",
    },
    effectiveFrom: "2025-01-01",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-icegate-trade-remedy-check",
    authority: "Indian Customs Electronic Gateway",
    title: "Know your Import Duty enquiry system",
    instrumentId: "ICEGATE import assessment tool",
    url: "https://www.icegate.gov.in/Webappl/index_imp.jsp",
    pinpoint: {
      locator: "CTH, description and country-of-origin assessment fields",
      relevance: "Requires origin input for preference and anti-dumping assessment.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "camera-dgtr-investigations",
    authority: "Directorate General of Trade Remedies",
    title: "Current anti-dumping investigations",
    instrumentId: "DGTR current investigation index",
    url: "https://www.dgtr.gov.in/en/anti-dumping-investigation-in-india",
    pinpoint: {
      locator: "Current investigation and measure records searched by product, origin, producer and exporter",
      relevance: "Supplies the assessment-date cross-check for product and party-specific trade-remedy matching.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
];

const wpcAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "camera_obtain_exact_model_wpc_eta",
  order: 1,
  owner: "Indian importer or authorised Indian representative",
  instruction:
    "Obtain or verify the exact finished-camera ETA and prescribed import undertaking against every 2.4/5 GHz radio detail.",
  prerequisites: ["Exact camera model, manufacturer, radio modules, bands and RF configuration are frozen"],
  requiredDocuments: [
    "Exact-model ETA document",
    "Accredited RF reports for every Wi-Fi radio and band",
    "Manufacturer authorisation and exact-model technical literature",
    "Signed or system-generated WPC import undertaking",
  ],
  destination: {
    label: "DoT WPC Equipment Type Approval service",
    url: "https://eservices.dot.gov.in/equipment-type-approval-eta",
  },
  rerunCondition: "Re-run after ETA identity, RF facts and undertaking details exactly match the shipment.",
};

const cameraBisAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "camera_register_exact_model_bis_crs",
  order: 2,
  owner: "Camera manufacturer and Indian authorised representative",
  instruction:
    "Obtain or correct the exact camera model/family BIS registration, safety evidence, essential-security report and Standard Mark.",
  prerequisites: ["Exact camera model, manufacturing site, firmware and current transition standard are frozen"],
  requiredDocuments: [
    "Valid BIS registration covering the exact camera model/family and site",
    "Current safety report and CCTV essential-security report",
    "Product and package Standard Mark matching the registration",
  ],
  destination: {
    label: "BIS Scheme II compulsory registration list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
  },
  rerunCondition: "Re-run after model/family, site, firmware, reports, registration and marks all match.",
};

const adapterBisAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "camera_register_dedicated_adapter_bis_crs",
  order: 3,
  owner: "Power-adapter manufacturer, camera manufacturer and Indian importer",
  instruction:
    "Obtain or correct the dedicated external adapter's exact-model BIS registration and reconcile it to the retail set.",
  prerequisites: ["Exact adapter manufacturer, model, electrical ratings and manufacturing site are frozen"],
  requiredDocuments: [
    "Valid BIS registration for the exact adapter model and site",
    "Adapter Standard Mark and electrical-rating label",
    "Camera retail-set bill of materials identifying the same adapter",
  ],
  destination: {
    label: "BIS Scheme II compulsory registration list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
  },
  rerunCondition: "Re-run after the registered adapter identity exactly matches the bundled adapter.",
};

const repaAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "camera_obtain_importer_repa",
  order: 4,
  owner: "Indian importer and reseller",
  instruction: "Obtain a current REPA covering the importer, exact radio equipment and import-for-sale activity.",
  prerequisites: ["Importer legal entity, camera model and authorisation term are frozen"],
  requiredDocuments: ["Current importer REPA", "Holder, model, activity, fee and validity evidence"],
  destination: {
    label: "DoT Radio Equipment Possession Authorisation service",
    url: "https://www.eservices.dot.gov.in/radio-equipment-possession-authorisation-services",
  },
  rerunCondition: "Re-run after holder identity, camera model, activity and validity cover the shipment.",
};

const labelAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "camera_complete_retail_package_declarations",
  order: 5,
  owner: "Indian importer",
  instruction: "Complete the imported camera retail-package declarations before retail distribution.",
  prerequisites: ["Importer, commodity, net quantity, month/year, MRP and consumer-care details are frozen"],
  requiredDocuments: ["Final retail-package artwork", "Importer and consumer-care declarations"],
  destination: {
    label: "DGFT General Notes to Import Policy 2025",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
  },
  rerunCondition: "Re-run after final retail-package artwork is attached and reviewed.",
};

const tradeRemedyAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "camera_complete_dated_trade_remedy_check",
  order: 6,
  owner: "Indian importer or customs adviser",
  instruction:
    "Resolve exact origin, producer and exporter, then retain an assessment-date ICEGATE and DGTR no-match check before using rates.",
  prerequisites: ["Exact origin, producer and exporter identities are known"],
  requiredDocuments: ["Dated ICEGATE assessment", "Dated DGTR search", "Origin and party evidence"],
  destination: {
    label: "ICEGATE import assessment tool",
    url: "https://www.icegate.gov.in/Webappl/index_imp.jsp",
  },
  rerunCondition: "Re-run on any origin/party change, stale check or possible measure match.",
};

const includedFacts = {
  condition: "new",
  customsMovement: "foreign_import_not_sez_dta_clearance",
  deviceType: "indoor_ip_security_camera",
  hasBattery: false,
  hasCellularRadio: false,
  hasEthernetOrPoe: false,
  hasIntegratedDvrOrNvr: false,
  hasOtherRadio: false,
  hasSixGhzRadio: false,
  intendedUse: "retail_resale_in_india",
  isCameraModuleOrComponent: false,
  isOutdoorOrIndustrial: false,
  manufacturingUse: "finished_goods_for_retail_not_inputs_for_manufacture",
  packaging: "single_model_retail_packaged_finished_goods",
  powerConfiguration: "one_external_dc_power_adapter_no_battery",
  radioBandsGhz: ["2.4", "5"],
  recordingArchitecture: "ip_camera_without_bundled_recorder",
  retailSetContents: "one_indoor_ip_camera_one_dedicated_power_adapter",
} as const;

const requiredDistinguishingFacts = [
  "modelIdentity",
  "manufacturerIdentity",
  "adapterModelIdentity",
  ...Object.keys(includedFacts),
] as const;

const scenarioFacts = {
  ...includedFacts,
  modelIdentity: "BWMI-IPCAM-245-C1",
  manufacturerIdentity: "Reviewed fixture camera manufacturer",
  adapterModelIdentity: "BWMI-CAMERA-ADAPTER-12V-C1",
};

const rules: ProductPack["rules"] = [
  {
    id: "camera_wpc_eta",
    title: "Exact finished-camera WPC Equipment Type Approval and import undertaking",
    applicability: [
      "Finished camera uses only 2.4 GHz and 5 GHz licence-exempt Wi-Fi",
      "Imported as a new retail product for sale in India",
    ],
    requiredEvidence: wpcAction.requiredDocuments,
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "camera-dot-import-compendium",
      pinpoint: "Page 2 paragraph 2.1(a), Annexure 2 pages 8-9 and undertaking Annexure 3 page 10",
    },
    consequence: "Missing, invalid or mismatched exact-camera ETA/undertaking blocks Customs clearance and legal readiness.",
    remediation: [wpcAction],
    sourceIds: [
      "camera-dot-wpc-eta-service",
      "camera-dot-eta-faq",
      "camera-dot-import-compendium",
      "camera-dot-license-exempt-bands",
    ],
    effectiveFrom: "2022-07-06",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "camera_bis_crs",
    title: "Exact CCTV/IP-camera BIS safety and essential-security registration",
    applicability: [
      "Finished indoor IP security camera is a CCTV camera under the notified Scheme II category",
      "Safety, essential-security, exact-model/site and Standard Mark evidence apply",
    ],
    requiredEvidence: cameraBisAction.requiredDocuments,
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "camera-dgft-general-notes-2025",
      pinpoint: "PDF page 3 paragraph 2(C), prohibited import and re-export/deformation remedy",
    },
    consequence: "Unregistered or model, report or mark-mismatched notified cameras are prohibited imports and block readiness.",
    remediation: [cameraBisAction],
    sourceIds: [
      "camera-bis-scheme-ii-current",
      "camera-bis-security-1652-2024",
      "camera-bis-transition-4997-2025",
      "camera-dgft-general-notes-2025",
    ],
    effectiveFrom: "2024-10-09",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "camera_adapter_bis_crs",
    title: "Dedicated external power-adapter BIS compulsory registration",
    applicability: [
      "One exact dedicated external DC power adapter is supplied in the retail set",
      "The adapter is independently notified under Scheme II",
    ],
    requiredEvidence: adapterBisAction.requiredDocuments,
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "camera-dgft-general-notes-2025",
      pinpoint: "PDF page 3 paragraph 2(C), notified BIS goods at Customs",
    },
    consequence: "Missing or mismatched exact-adapter registration/mark blocks Customs clearance and legal readiness.",
    remediation: [adapterBisAction],
    sourceIds: [
      "camera-bis-scheme-ii-current",
      "camera-bis-transition-4997-2025",
      "camera-dgft-general-notes-2025",
    ],
    effectiveFrom: "2021-09-18",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "camera_repa_import_for_sale",
    title: "Radio Equipment Possession Authorisation for import for sale",
    applicability: ["Indian entity imports the exact Wi-Fi camera for retail sale"],
    requiredEvidence: repaAction.requiredDocuments,
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "Missing REPA blocks overall legal readiness, but no admitted primary pinpoint makes it a Customs release document.",
    remediation: [repaAction],
    sourceIds: ["camera-dot-repa-2026"],
    effectiveFrom: "2026-07-08",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "camera_legal_metrology_labels",
    title: "Imported retail-package declarations",
    applicability: ["Single-model pre-packaged camera set is imported for retail resale"],
    requiredEvidence: labelAction.requiredDocuments,
    clearanceEffect: "non_clearance",
    failureEffect: "warning_only",
    consequence:
      "Retail declarations remain required before sale; the checked source does not prove this defect alone blocks Customs release.",
    remediation: [labelAction],
    sourceIds: ["camera-dgft-general-notes-2025"],
    effectiveFrom: "2011-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "camera_trade_remedy_check",
    title: "Assessment-date origin, producer and exporter trade-remedy gate",
    applicability: ["Admitted rates are used only after exact origin and parties are checked on the assessment date"],
    requiredEvidence: tradeRemedyAction.requiredDocuments,
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "An absent result blocks readiness; an unknown, stale or possible match requires verification and suppresses numeric cost.",
    remediation: [tradeRemedyAction],
    sourceIds: ["camera-icegate-trade-remedy-check", "camera-dgtr-investigations"],
    effectiveFrom: ADMITTED_AT,
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
];

const rates: ProductPack["rates"] = [
  {
    id: "basic_customs_duty",
    percent: 20,
    base: "assessable_value",
    applicability: [
      "HS 85258900 exact finished indoor CCTV/IP-camera scenario only",
      "Notification 45/2025-Customs S.No.289 expressly excludes CCTV/IP cameras from 10%",
      "Finished retail set, not camera-manufacturing inputs under S.No.294",
      "Foreign import, not an SEZ-to-DTA clearance or preference claim",
    ],
    formula: "assessable value × 20%",
    determination:
      "The statutory and live ICEGATE rate is 20%; Notification 45/2025 S.No.289 expressly excludes CCTV/IP cameras from its 10% entry, while S.No.294 is limited to manufacturing inputs.",
    sourceIds: [
      "camera-cbic-tariff-85258900",
      "camera-icegate-duty-85258900",
      "camera-icegate-duty-options-85258900",
      "camera-customs-45-2025",
    ],
    effectiveFrom: "2025-11-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "agriculture_infrastructure_development_cess",
    percent: 0,
    base: "assessable_value",
    applicability: ["HS 85258900 falls to the residual Any Chapter nil entry"],
    formula: "assessable value × 0%",
    determination: "Notification 11/2021-Customs residual Any Chapter entry sets AIDC to nil.",
    sourceIds: ["camera-customs-aidc-11-2021", "camera-icegate-duty-options-85258900"],
    effectiveFrom: "2021-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "social_welfare_surcharge",
    percent: 10,
    base: "basic_customs_duty",
    applicability: ["BCD is payable and no admitted SWS exemption applies to this exact camera"],
    formula: "basic customs duty × 10%",
    determination: "Finance Act 2018 section 110 applies 10% SWS to the covered BCD.",
    sourceIds: ["camera-finance-act-2018-sws", "camera-icegate-duty-85258900"],
    effectiveFrom: "2018-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "igst",
    percent: 18,
    base: "assessable_value_plus_bcd_plus_sws",
    applicability: ["Heading 8525 under the current 18% integrated-tax schedule"],
    formula: "(assessable value + BCD + nil AIDC + SWS) × 18%",
    determination: "Notification 9/2025 and Customs Tariff Act section 3(8) supply the 18% rate and base.",
    sourceIds: [
      "camera-igst-9-2025",
      "camera-customs-tariff-act-igst-base",
      "camera-icegate-duty-85258900",
    ],
    effectiveFrom: "2025-09-22",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "gst_compensation_cess",
    percent: 0,
    base: "assessable_value",
    applicability: ["Residual Any Chapter entry after specifically listed cess goods are excluded"],
    formula: "applicable compensation-cess base × 0%",
    determination: "Notification 1/2017-Compensation Cess (Rate) gives residual Any Chapter goods a nil rate.",
    sourceIds: ["camera-compensation-cess-1-2017", "camera-icegate-duty-85258900"],
    effectiveFrom: "2017-07-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
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
  camera_wpc_eta: "present",
  camera_bis_crs: "present",
  camera_adapter_bis_crs: "present",
  camera_repa_import_for_sale: "present",
  camera_legal_metrology_labels: "present",
  camera_trade_remedy_check: "present",
} as const;
const blockedEvidence = { ...readyEvidence, camera_wpc_eta: "absent" } as const;
const needsVerificationEvidence = {
  ...readyEvidence,
  camera_trade_remedy_check: "unknown",
} as const;

const readyFacts: ProductPack["fixtures"][number]["facts"] = {
  productPackId: PACK_ID,
  assessmentDate: ADMITTED_AT,
  assessableValueInr: "100000",
  originCountryCode: "VN",
  importerIdentity: "Reviewed fixture camera importer India Pvt Ltd",
  producerIdentity: "Reviewed fixture camera producer",
  exporterIdentity: "Reviewed fixture camera exporter",
  preferentialTariffClaim: "none",
  scenario: scenarioFacts,
  evidence: readyEvidence,
  tradeRemedyCheck: "confirmed_no_match",
};

const fixtures: ProductPack["fixtures"] = [
  {
    id: "camera-ready-reviewed",
    name: "Exact camera, adapter and parties with all blocking evidence and trade-remedy gate resolved",
    expectedOutcome: "ready",
    expectedCustomsClearanceBlocked: false,
    facts: readyFacts,
    findings: findings(readyEvidence),
    costLines,
    sourceIds: [
      "camera-cbic-tariff-85258900",
      "camera-customs-45-2025",
      "camera-dot-wpc-eta-service",
      "camera-dot-import-compendium",
      "camera-bis-scheme-ii-current",
      "camera-bis-security-1652-2024",
      "camera-dgft-general-notes-2025",
      "camera-dot-repa-2026",
      "camera-icegate-trade-remedy-check",
      "camera-dgtr-investigations",
    ],
    actions: [wpcAction, cameraBisAction, adapterBisAction, repaAction, labelAction, tradeRemedyAction],
    reviewedAt: ADMITTED_AT,
  },
  {
    id: "camera-blocked-reviewed",
    name: "Exact camera with confirmed missing exact-model WPC ETA",
    expectedOutcome: "blocked",
    expectedCustomsClearanceBlocked: true,
    facts: { ...readyFacts, evidence: blockedEvidence },
    findings: findings(blockedEvidence),
    costLines,
    sourceIds: [
      "camera-dot-wpc-eta-service",
      "camera-dot-eta-faq",
      "camera-dot-import-compendium",
      "camera-dot-license-exempt-bands",
    ],
    actions: [wpcAction],
    reviewedAt: ADMITTED_AT,
  },
  {
    id: "camera-needs-verification-reviewed",
    name: "Exact camera with unknown origin, parties and trade-remedy result",
    expectedOutcome: "needs_verification",
    expectedCustomsClearanceBlocked: false,
    facts: {
      ...readyFacts,
      originCountryCode: null,
      producerIdentity: null,
      exporterIdentity: null,
      evidence: needsVerificationEvidence,
      tradeRemedyCheck: "unknown",
    },
    findings: findings(needsVerificationEvidence),
    costLines: [],
    sourceIds: ["camera-icegate-trade-remedy-check", "camera-dgtr-investigations"],
    actions: [tradeRemedyAction],
    reviewedAt: ADMITTED_AT,
  },
];

export const cameraPack: ProductPack = {
  id: PACK_ID,
  version: "1.0.0-source-admitted",
  title: "New retail indoor 2.4/5 GHz Wi-Fi IP security camera with dedicated external adapter",
  lifecycleStatus: "source_admitted",
  admittedAt: ADMITTED_AT,
  selectable: false,
  publicRuntimeEnabled: false,
  admissionScope: {
    productPackId: PACK_ID,
    mappingApplicability: includedFacts,
    rateApplicability: { productPackId: PACK_ID, hsCode: "85258900" },
    sourceIds: sources.map((source) => source.id),
    ruleIds: rules.map((rule) => rule.id),
    fixtureIds: fixtures.map((fixture) => fixture.id),
    actionIds: [...new Set(rules.flatMap((rule) => rule.remediation.map((action) => action.id)))],
    sharedApplicabilityDeclarations: [
      {
        moduleId: "shared.legal_metrology_retail_package",
        applicableProductPackId: PACK_ID,
        requiredScenarioFacts: {
          intendedUse: "retail_resale_in_india",
          packaging: "single_model_retail_packaged_finished_goods",
        },
        ruleIds: ["camera_legal_metrology_labels"],
        sourceIds: ["camera-dgft-general-notes-2025"],
      },
      {
        moduleId: "shared.repa_import_for_sale",
        applicableProductPackId: PACK_ID,
        requiredScenarioFacts: {
          intendedUse: "retail_resale_in_india",
          deviceType: "indoor_ip_security_camera",
        },
        ruleIds: ["camera_repa_import_for_sale"],
        sourceIds: ["camera-dot-repa-2026"],
      },
      {
        moduleId: "shared.wpc_eta_import",
        applicableProductPackId: PACK_ID,
        requiredScenarioFacts: {
          intendedUse: "retail_resale_in_india",
          radioBandsGhz: ["2.4", "5"],
        },
        ruleIds: ["camera_wpc_eta"],
        sourceIds: [
          "camera-dot-wpc-eta-service",
          "camera-dot-eta-faq",
          "camera-dot-import-compendium",
          "camera-dot-license-exempt-bands",
        ],
      },
    ],
  },
  scenario: {
    id: "new-retail-indoor-wifi-ip-security-camera",
    name: "New single-model indoor 2.4/5 GHz Wi-Fi IP security camera with one dedicated external adapter",
    includedFacts,
    requiredDistinguishingFacts: [...requiredDistinguishingFacts],
    excludedVariants: [
      "Analog CCTV cameras, webcams, digital still cameras, dashcams and camera modules or components",
      "DVR/NVR units, recorder bundles, multi-camera kits and separate adapters",
      "Outdoor, rugged, thermal, industrial, high-speed, radiation-tolerant or night-vision-subheading products",
      "6 GHz, cellular, satellite, Bluetooth, Zigbee, NFC or any radio other than admitted 2.4/5 GHz Wi-Fi",
      "Battery-powered, PoE or Ethernet-connected variants",
      "Used, refurbished, repaired, unknown-model or ambiguous retail-set configurations",
    ],
  },
  hsMapping: {
    hsCode: "85258900",
    label: "Other television cameras, digital cameras and video camera recorders",
    confidence: "high",
    provenance: "admitted_mapping",
    rationale:
      "The exact product's principal function is capture and IP transmission of security-camera video; it is a finished CCTV/IP camera and does not meet the high-speed, radiation-tolerant or tariff night-vision subheadings, so residual camera item 85258900 applies.",
    applicabilityFacts: includedFacts,
    distinguishingFacts: [...requiredDistinguishingFacts],
    sourceIds: [
      "camera-cbic-tariff-85258900",
      "camera-icegate-classification-85258900",
      "camera-customs-45-2025",
    ],
  },
  sources,
  rules,
  rates,
  fixtures,
};
