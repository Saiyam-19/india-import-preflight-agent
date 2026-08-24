import type { ProductPack } from "./schema";

const PACK_ID = "india-retail-over-ear-bluetooth-headphones-v1";
const ADMITTED_AT = "2026-08-24";
const RATE_REVIEW_AFTER = "2026-09-24";
const RULE_REVIEW_AFTER = "2026-11-24";
const REVIEW_RATIONALE =
  "Re-check on the stated date and immediately after any product, model, radio, battery, charger, origin, producer, exporter, importer, packaging, tariff, notification, product-list, portal-guidance, or legal-source change.";

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
    id: "headphones-cbic-tariff-85183019",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Customs Tariff, Chapter 85",
    instrumentId: "First Schedule, heading 8518",
    url: "https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff(ason30.06.2024)/CUSTOMS_TARIFF_VOL-I/chap-85.pdf",
    pinpoint: {
      locator: "Printed page 1019 / PDF page 16, tariff items 85183011, 85183019, 85183020 and 85183090",
      relevance:
        "Separates TWS, other wireless, wired-only, and residual headphones and gives 85183019 a 20% tariff rate.",
    },
    effectiveFrom: "2022-05-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-icegate-classification-85183019",
    authority: "Indian Customs Electronic Gateway",
    title: "Live tariff description and import-policy response for 85183019",
    instrumentId: "ICEGATE CTH 85183019 description response",
    url: "https://www.icegate.gov.in/Webappl/Desc_details?cth=85183019&item_desc=",
    pinpoint: {
      locator: "JSON rows for 85183011, 85183019, 85183020 and 85183090",
      relevance:
        "Confirms 85183019 as wireless Other, policy Free, while separating TWS and wired-only items.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-icegate-duty-85183019",
    authority: "Indian Customs Electronic Gateway",
    title: "Live duty response for 85183019",
    instrumentId: "ICEGATE DueFee1 CTH 85183019",
    url: "https://www.icegate.gov.in/Webappl/DueFee1?cth_val=85183019&cntrycd=",
    pinpoint: {
      locator: "Live JSON bcd_rate, aidc_rate, scd_rate, igst_rate and cess fields",
      relevance:
        "Confirms the current statutory BCD, SWS, IGST and zero generic cess fields; exemptions are resolved separately against their text.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-icegate-duty-options-85183019",
    authority: "Indian Customs Electronic Gateway",
    title: "Live notification options for 85183019",
    instrumentId: "ICEGATE DueFee11 CTH 85183019",
    url: "https://www.icegate.gov.in/Webappl/DueFee11?cth_val=85183019&cntrycd=",
    pinpoint: {
      locator:
        "BCD Notification 12/2022 S.No.10; AIDC Notification 11/2021 S.No.17; IGST Notification 009/2025 S.No.II491",
      relevance:
        "Confirms the current options while requiring the pack to apply each notification's controlling description and conditions.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-customs-12-2022",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 12/2022-Customs",
    instrumentId: "Notification No. 12/2022-Customs",
    url: "https://www.cbic.gov.in/content/pdf/CONTENTREPO/Customs/Tariff/Tariff(ason30.06.2024)/CUSTOMS_TARIFF_VOL-I/chap-85.pdf",
    pinpoint: {
      locator:
        "Printed pages 1043-1045 / PDF pages 40-42, S.No.10, hearable-device definition and condition 3",
      relevance:
        "The continuing 15% entry expressly excludes wireless hearable devices, including headphones, so this pack retains the 20% merit BCD.",
    },
    effectiveFrom: "2022-02-02",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-customs-45-2025",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 45/2025-Customs",
    instrumentId: "G.S.R. 781(E)",
    url: "https://courier.cbic.gov.in/advisory/2025/Notfi-%2045-2025.pdf",
    pinpoint: {
      locator: "PDF page 19 S.No.175 and PDF page 35 S.No.280",
      relevance:
        "The ICEGATE 5% heading-level option is for specified silicon-ingot inputs, not finished headphones, and the heading 8518 nil entry is only for microphone-manufacturing inputs.",
    },
    effectiveFrom: "2025-11-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-customs-11-2026-sez-dta",
    authority: "Central Board of Indirect Taxes and Customs",
    title: "Advisory on concessional duty relief for SEZ-to-DTA clearances",
    instrumentId: "Notification No. 11/2026-Customs implementation advisory",
    url: "https://www.icegate.gov.in/sites/default/files/2026-05/Advisory%20-%20Concessional%20Duty%20Relief%20for%20Clearance%20of%20Goods%20from%20SEZ%20to%20DTA_0.pdf",
    pinpoint: {
      locator: "PDF page 1 paragraphs (a)-(c)",
      relevance:
        "Limits Notification 11/2026 concessions to eligible SEZ-manufactured goods cleared to the DTA during the one-time window, outside this foreign-import pack.",
    },
    effectiveFrom: "2026-04-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-customs-aidc-11-2021",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 11/2021-Customs",
    instrumentId: "G.S.R. 69(E)",
    url: "https://egazette.gov.in/WriteReadData/2021/224869.pdf",
    pinpoint: {
      locator: "Page 35 S.No.17 Any Chapter at Nil; page 36 commencement clause",
      relevance: "Supplies the residual nil AIDC rate admitted for this product.",
    },
    effectiveFrom: "2021-02-02",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-finance-act-2018-sws",
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
    id: "headphones-igst-9-2025",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 9/2025-Integrated Tax (Rate)",
    instrumentId: "Notification No. 9/2025-Integrated Tax (Rate)",
    url: "https://courier.cbic.gov.in/ECCS/advisory/2025/NOTIFICATION%20NO.%209_2025-INTEGRATED%20TAX%20%28RATE%29%20-1759486719.pdf",
    pinpoint: {
      locator: "Page 1 Schedule II rate; PDF page 67 Schedule II S.No.491, heading 8518",
      relevance: "Places heading 8518 in the 18% IGST schedule.",
    },
    effectiveFrom: "2025-09-22",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-compensation-cess-1-2017",
    authority: "Ministry of Finance, Department of Revenue",
    title: "Notification No. 1/2017-Compensation Cess (Rate)",
    instrumentId: "Notification No. 1/2017-Compensation Cess (Rate)",
    url: "https://cbic-gst.gov.in/hindi/pdf/compensation-tax/notfctn-1-compensation-cess-english.pdf",
    pinpoint: {
      locator: "Page 5 Schedule S.No.56 Any chapter at Nil",
      relevance: "Supplies the residual nil compensation-cess rate.",
    },
    effectiveFrom: "2017-07-01",
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dot-wpc-eta-service",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Equipment Type Approval service",
    instrumentId: "Saral Sanchar ETA service guidance",
    url: "https://eservices.dot.gov.in/equipment-type-approval-eta",
    pinpoint: {
      locator: "Eligibility, documents, process and headphone/earphone examples",
      relevance:
        "Requires self-declaration ETA for import, sale and use of licence-exempt wireless headphones and identifies Customs-clearance use.",
    },
    effectiveFrom: "2022-07-06",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dot-eta-faq",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Frequently Asked Questions on Equipment Type Approval",
    instrumentId: "WPC ETA FAQ",
    url: "https://eservices.dot.gov.in/sites/default/files/faqs/eta_faq.pdf",
    pinpoint: {
      locator: "Questions 2, 5, 8 and 10",
      relevance:
        "Requires exact-finished-product ETA, all RF-module reports and the import undertaking used with Customs.",
    },
    effectiveFrom: "2022-07-06",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dot-import-compendium",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Compendium of orders related to import licence",
    instrumentId: "WPC import compendium dated 2022-07-06",
    url: "https://eservices.dot.gov.in/sites/default/files/circular-notifications/Compendium%20of%20Orders%20related%20import%20licence%20-signed%20copy%20060722.pdf",
    pinpoint: {
      locator: "PDF page 7 paragraphs 12.1-12.2 and Annexure III pages 9-10",
      relevance:
        "Names headphones/earphones and supplies the ETA-plus-undertaking Customs release route.",
    },
    effectiveFrom: "2022-07-06",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dot-license-exempt-24ghz",
    authority: "Department of Telecommunications, WPC Wing",
    title: "Licence-exempt 2.4 GHz rules",
    instrumentId: "G.S.R. 45(E)",
    url: "https://www.dot.gov.in/static/uploads/2025/07/84f33f09e137fa81930f44bcd5f2d238.pdf",
    pinpoint: {
      locator: "Compendium PDF pages 141-144, English rules 3-6",
      relevance: "Defines the admitted 2400-2483.5 MHz licence-exempt band and conditions.",
    },
    effectiveFrom: "2005-01-28",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-bis-qco-2020",
    authority: "Ministry of Electronics and Information Technology",
    title: "Compulsory-registration amendment adding wireless headphones",
    instrumentId: "S.O. 1100(E)",
    url: "https://www.bis.gov.in/wp-content/uploads/2020/05/MeitY-QCO-for-additional-12-products.pdf",
    pinpoint: {
      locator: "Gazette PDF page 4 S.No.51 and paragraph 3",
      relevance:
        "Adds Wireless Headphone and Earphone and makes the category effective six months after publication.",
    },
    effectiveFrom: "2020-10-01",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-bis-scheme-ii-current",
    authority: "Bureau of Indian Standards",
    title: "Current Scheme II compulsory-registration product list",
    instrumentId: "BIS Scheme II product list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
    pinpoint: {
      locator: "S.No.20 sealed portable secondary cells/batteries and S.No.51 wireless headphones/earphones",
      relevance: "Confirms both the finished headphone and its integrated portable secondary battery categories.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-bis-transition-4997-2025",
    authority: "Ministry of Electronics and Information Technology",
    title: "Migration to IS/IEC 62368 Part 1:2023",
    instrumentId: "S.O. 4997(E)",
    url: "https://www.bis.gov.in/wp-content/uploads/2025/11/Migration-to-IS-IEC-62368-Part-1-2023-from-IS-13252-Part-1-2010-and-IS-616-2017.pdf",
    pinpoint: {
      locator: "English PDF page 3 clauses (ii) and (v)",
      relevance:
        "Replaces IS 616:2017 while allowing concurrent registrations until 2028-11-01.",
    },
    effectiveFrom: "2025-11-04",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-bis-series-guideline",
    authority: "Bureau of Indian Standards",
    title: "Series guidelines for Phase IV products",
    instrumentId: "BIS Phase IV series guideline",
    url: "https://www.bis.gov.in/wp-content/uploads/2020/07/4-series_guidelines_notified_phaseIV.pdf",
    pinpoint: {
      locator: "PDF pages 2-3, item 51 Wireless Headphone and Earphone",
      relevance:
        "Requires product-family evidence to identify the battery type and requires the battery to be registered.",
    },
    effectiveFrom: "2020-07-01",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dgft-general-notes-2025",
    authority: "Directorate General of Foreign Trade",
    title: "General Notes Regarding Import Policy 2025",
    instrumentId: "ITC (HS) General Notes 2025",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
    pinpoint: {
      locator: "PDF page 2 paragraph 2.03(c) and PDF pages 5-6 paragraph 2.03(d)",
      relevance:
        "Makes non-registered notified electronic goods prohibited imports and lists retail-package declarations.",
    },
    effectiveFrom: "2025-04-01",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dot-repa-2026",
    authority: "Department of Telecommunications",
    title: "Telecommunications (Radio Equipment Possession Authorisation) Rules, 2026",
    instrumentId: "G.S.R. 592(E)",
    url: "https://eservices.dot.gov.in/sites/default/files/media-docs/telecommunications-radio-equipment-possession-authorisation-rules-2026-2.pdf",
    pinpoint: {
      locator: "English rules 4-6 and First Schedule",
      relevance: "Covers importing radio equipment for sale and supplies the applicable authorisation term and fee.",
    },
    effectiveFrom: "2026-07-08",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-battery-waste-rules-2022",
    authority: "Ministry of Environment, Forest and Climate Change",
    title: "Battery Waste Management Rules, 2022",
    instrumentId: "G.S.R. 678(E)",
    url: "https://moef.gov.in/uploads/pdf-uploads/pdf_676567459cdfe9.16099796.pdf",
    pinpoint: {
      locator: "Definition of producer and rule 4",
      relevance:
        "Treats an importer of equipment containing a battery as a producer and imposes registration/EPR duties.",
    },
    effectiveFrom: "2022-08-24",
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-cpcb-battery-registration-sop",
    authority: "Central Pollution Control Board",
    title: "Producer registration SOP under Battery Waste Management Rules",
    instrumentId: "CPCB battery producer registration SOP",
    url: "https://cpcb.nic.in/uploads/hwmd/Notice_for_BMW.pdf",
    pinpoint: {
      locator: "Producer registration workflow and equipment-containing-battery category",
      relevance: "Supplies the operational registration evidence for the importer/producer.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-icegate-trade-remedy-check",
    authority: "Indian Customs Electronic Gateway",
    title: "Customs Duty Calculator and import tool",
    instrumentId: "ICEGATE import assessment tool",
    url: "https://www.icegate.gov.in/Webappl/index_imp.jsp",
    pinpoint: {
      locator: "CTH, country of origin and notification assessment inputs",
      relevance: "Provides the assessment-date Customs destination for origin-dependent measures and preferences.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
  officialSource({
    id: "headphones-dgtr-investigations",
    authority: "Directorate General of Trade Remedies",
    title: "Anti-dumping investigations in India",
    instrumentId: "DGTR current investigation index",
    url: "https://www.dgtr.gov.in/en/anti-dumping-investigation-in-india",
    pinpoint: {
      locator: "Current investigation and measure records searched by product, HS, origin, producer and exporter",
      relevance: "Supplies the assessment-date cross-check for trade-remedy matching.",
    },
    effectiveFrom: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  }),
];

const wpcAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_obtain_exact_model_wpc_eta",
  order: 1,
  owner: "Indian importer or authorised Indian representative",
  instruction:
    "Obtain the exact finished-headphone ETA and import undertaking using the exact Bluetooth RF report and product technical file.",
  prerequisites: ["Exact headphone model, manufacturer, Bluetooth module and RF band are frozen"],
  requiredDocuments: [
    "Exact-model ETA document",
    "Accredited RF test report for the Bluetooth radio",
    "Manufacturer authorisation and exact-model technical literature",
    "Signed or system-generated WPC import undertaking",
  ],
  destination: {
    label: "DoT WPC Equipment Type Approval service",
    url: "https://eservices.dot.gov.in/equipment-type-approval-eta",
  },
  rerunCondition: "Re-run after all ETA identities, RF facts and undertaking details match the shipment.",
};

const headphoneBisAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_register_exact_model_bis_crs",
  order: 2,
  owner: "Headphone manufacturer and Indian authorised representative",
  instruction:
    "Obtain or correct the finished headphone's exact-model/family BIS registration and matching Standard Mark before import.",
  prerequisites: ["Exact model, manufacturing site and current transition standard are frozen"],
  requiredDocuments: [
    "Valid BIS registration covering the exact headphone model/family and site",
    "Current standard test report",
    "Product and package mark artwork matching the registration number",
  ],
  destination: {
    label: "BIS Scheme II compulsory registration list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
  },
  rerunCondition: "Re-run after exact model/family, site, standard, registration and label evidence all match.",
};

const batteryBisAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_register_integrated_battery_bis_crs",
  order: 3,
  owner: "Battery manufacturer, headphone manufacturer and Indian importer",
  instruction:
    "Obtain or correct the exact integrated battery model's BIS registration and reconcile it to the headphone technical file.",
  prerequisites: ["Exact battery manufacturer, model, chemistry, capacity and manufacturing site are frozen"],
  requiredDocuments: [
    "Valid BIS registration for the exact battery model and site",
    "Battery label/mark evidence",
    "Headphone bill of materials and technical file identifying that battery",
  ],
  destination: {
    label: "BIS Scheme II compulsory registration list",
    url: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en",
  },
  rerunCondition: "Re-run after the registered battery identity exactly matches the integrated battery in the shipment.",
};

const repaAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_obtain_importer_repa",
  order: 4,
  owner: "Indian importer and reseller",
  instruction: "Obtain a current REPA covering the importer and import-for-sale activity.",
  prerequisites: ["Importer legal entity and authorisation term are frozen"],
  requiredDocuments: ["Current importer REPA", "Holder identity, scope, fee and validity evidence"],
  destination: {
    label: "DoT Radio Equipment Possession Authorisation service",
    url: "https://www.eservices.dot.gov.in/radio-equipment-possession-authorisation-services",
  },
  rerunCondition: "Re-run after holder identity, activity and validity cover the assessed shipment.",
};

const batteryEprAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_register_battery_epr_producer",
  order: 5,
  owner: "Indian importer as producer under the Battery Waste Management Rules",
  instruction:
    "Register the importer/producer for the applicable equipment-containing-battery category and retain current portal evidence.",
  prerequisites: ["Importer entity, brand and integrated-battery category are frozen"],
  requiredDocuments: ["CPCB producer registration", "Category/brand evidence", "Current portal acknowledgement"],
  destination: {
    label: "CPCB battery producer registration guidance",
    url: "https://cpcb.nic.in/uploads/hwmd/Notice_for_BMW.pdf",
  },
  rerunCondition: "Re-run after producer identity, category, brand and registration validity match.",
};

const labelAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_complete_retail_package_declarations",
  order: 6,
  owner: "Indian importer",
  instruction: "Complete the imported retail-package declarations before retail distribution.",
  prerequisites: ["Importer, commodity, net quantity, month/year, MRP and consumer-care details are frozen"],
  requiredDocuments: ["Final retail-package artwork", "Importer and consumer-care declarations"],
  destination: {
    label: "DGFT General Notes to Import Policy 2025",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
  },
  rerunCondition: "Re-run after the final retail package artwork is attached and reviewed.",
};

const tradeRemedyAction: ProductPack["rules"][number]["remediation"][number] = {
  id: "headphones_complete_dated_trade_remedy_check",
  order: 7,
  owner: "Indian importer or customs adviser",
  instruction:
    "Resolve exact origin, producer and exporter, then perform and retain an assessment-date ICEGATE and DGTR check before using the admitted rates.",
  prerequisites: ["Exact origin, producer and exporter identities are known"],
  requiredDocuments: ["Dated ICEGATE assessment record", "Dated DGTR search record", "Origin and party evidence"],
  destination: {
    label: "ICEGATE import assessment tool",
    url: "https://www.icegate.gov.in/Webappl/index_imp.jsp",
  },
  rerunCondition: "Re-run on any origin/party change, stale check or possible measure match.",
};

const includedFacts = {
  batteryConfiguration: "one_integrated_rechargeable_lithium_ion_battery",
  chargingAccessory: "passive_usb_cable_only",
  condition: "new",
  customsMovement: "foreign_import_not_sez_dta_clearance",
  deviceType: "over_ear_bluetooth_headphones",
  formFactor: "headband_joined_left_and_right_sound_channels",
  hasBluetoothRadio: true,
  hasCellularRadio: false,
  hasChargingCase: false,
  hasExternalChargerOrPowerBank: false,
  hasIntegratedMicrophone: true,
  hasNfcRadio: false,
  hasOtherRadio: false,
  hasSatelliteRadio: false,
  hasWifiRadio: false,
  hasWiredAudioInput: false,
  intendedUse: "retail_resale_in_india",
  isHearingDevice: false,
  isTrueWirelessStereo: false,
  manufacturingUse: "finished_goods_for_retail_not_inputs_for_manufacture",
  packaging: "single_model_retail_packaged_finished_goods",
  radioBandsMhz: ["2400-2483.5"],
  retailSetContents: "one_headphone_set_one_passive_usb_cable",
} as const;

const requiredDistinguishingFacts = [
  "modelIdentity",
  "manufacturerIdentity",
  "batteryManufacturerIdentity",
  "batteryModelIdentity",
  "batteryCapacityMah",
  ...Object.keys(includedFacts),
] as const;

const scenarioFacts = {
  ...includedFacts,
  modelIdentity: "BWMI-OEBT-H1",
  manufacturerIdentity: "Reviewed fixture headphone manufacturer",
  batteryManufacturerIdentity: "Reviewed fixture battery manufacturer",
  batteryModelIdentity: "BWMI-LIION-B1",
  batteryCapacityMah: 600,
};

const rules: ProductPack["rules"] = [
  {
    id: "headphones_wpc_eta",
    title: "Exact finished-headphone WPC Equipment Type Approval and import undertaking",
    applicability: [
      "Finished Bluetooth-only headphone uses 2400-2483.5 MHz licence-exempt spectrum",
      "Imported for retail sale in India",
    ],
    requiredEvidence: [
      "Exact-model ETA document",
      "Accredited RF report for the exact Bluetooth radio and band",
      "Manufacturer authorisation and exact-model technical literature",
      "Signed or system-generated import undertaking",
    ],
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "headphones-dot-import-compendium",
      pinpoint: "PDF page 7 paragraphs 12.1-12.2 and Annexure III Customs undertaking",
    },
    consequence: "Missing or mismatched exact-product ETA evidence blocks Customs clearance and legal readiness.",
    remediation: [wpcAction],
    sourceIds: [
      "headphones-dot-wpc-eta-service",
      "headphones-dot-eta-faq",
      "headphones-dot-import-compendium",
      "headphones-dot-license-exempt-24ghz",
    ],
    effectiveFrom: "2022-07-06",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "headphones_bis_crs",
    title: "Finished wireless-headphone BIS compulsory registration",
    applicability: [
      "Finished wireless headphone is a notified Scheme II product",
      "Current IS 616:2017 to IS/IEC 62368-1:2023 transition applies through 2028-11-01",
    ],
    requiredEvidence: [
      "Valid exact-model/family and manufacturing-site BIS registration",
      "Test report under a currently permitted transition standard",
      "Matching product and package Standard Mark/registration number",
    ],
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "headphones-dgft-general-notes-2025",
      pinpoint: "PDF page 2 paragraph 2.03(c), prohibited import and re-export/deformation remedy",
    },
    consequence: "Unregistered or label-mismatched notified headphones are prohibited imports and block readiness.",
    remediation: [headphoneBisAction],
    sourceIds: [
      "headphones-bis-qco-2020",
      "headphones-bis-scheme-ii-current",
      "headphones-bis-transition-4997-2025",
      "headphones-dgft-general-notes-2025",
    ],
    effectiveFrom: "2020-10-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "headphones_battery_bis_crs",
    title: "Integrated rechargeable-battery BIS compulsory registration",
    applicability: [
      "One known rechargeable lithium-ion portable secondary battery is integrated into the headphone",
      "No removable or separately supplied battery is admitted",
    ],
    requiredEvidence: [
      "Valid exact battery-model and manufacturing-site BIS registration",
      "Matching battery mark/label",
      "Headphone technical file and bill of materials identifying the same battery model and capacity",
    ],
    clearanceEffect: "conditions_clearance",
    failureEffect: "blocks_legal_readiness",
    clearanceProof: {
      sourceId: "headphones-dgft-general-notes-2025",
      pinpoint: "PDF page 2 paragraph 2.03(c), notified BIS goods at Customs",
    },
    consequence: "Missing or mismatched embedded-battery registration blocks Customs clearance and legal readiness.",
    remediation: [batteryBisAction],
    sourceIds: [
      "headphones-bis-scheme-ii-current",
      "headphones-bis-series-guideline",
      "headphones-dgft-general-notes-2025",
    ],
    effectiveFrom: "2020-10-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "headphones_repa_import_for_sale",
    title: "Radio Equipment Possession Authorisation for import for sale",
    applicability: ["Indian entity imports Bluetooth radio equipment for retail sale"],
    requiredEvidence: ["Current REPA naming the importer", "Scope and validity covering the assessed activity/date"],
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "Missing REPA blocks overall legal readiness, but this pack has no primary pinpoint making REPA a Customs release document.",
    remediation: [repaAction],
    sourceIds: ["headphones-dot-repa-2026"],
    effectiveFrom: "2026-07-08",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "headphones_battery_epr",
    title: "Battery-waste producer registration for equipment containing a battery",
    applicability: ["Indian importer is a producer of equipment containing an integrated battery"],
    requiredEvidence: ["Current CPCB producer registration", "Matching importer, brand and equipment-containing-battery category"],
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "Missing registration blocks overall legal readiness, but this pack has no primary pinpoint making it a Customs release document.",
    remediation: [batteryEprAction],
    sourceIds: ["headphones-battery-waste-rules-2022", "headphones-cpcb-battery-registration-sop"],
    effectiveFrom: "2022-08-24",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "headphones_legal_metrology_labels",
    title: "Imported retail-package declarations",
    applicability: ["Single-model pre-packaged commodity is imported for retail resale"],
    requiredEvidence: [
      "Final package artwork with importer and generic commodity identity",
      "Net quantity, month/year, MRP and consumer-care particulars",
    ],
    clearanceEffect: "non_clearance",
    failureEffect: "warning_only",
    consequence:
      "Retail declarations remain required before sale; the checked source does not prove this defect alone blocks Customs release.",
    remediation: [labelAction],
    sourceIds: ["headphones-dgft-general-notes-2025"],
    effectiveFrom: "2011-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RULE_REVIEW_AFTER,
  },
  {
    id: "headphones_trade_remedy_check",
    title: "Assessment-date origin, producer and exporter trade-remedy gate",
    applicability: ["The admitted rates are used only after exact origin and parties are checked on the assessment date"],
    requiredEvidence: [
      "Exact country of origin",
      "Exact producer and exporter identities",
      "Dated ICEGATE and DGTR check with no unresolved product/party match",
    ],
    clearanceEffect: "non_clearance",
    failureEffect: "blocks_legal_readiness",
    consequence:
      "An absent result blocks readiness; an unknown, stale or possible match requires verification and suppresses every numeric cost.",
    remediation: [tradeRemedyAction],
    sourceIds: ["headphones-icegate-trade-remedy-check", "headphones-dgtr-investigations"],
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
      "HS 85183019 only",
      "Wireless hearable device excluded from Notification 12/2022-Customs S.No.10",
      "Foreign import, not an eligible SEZ-to-DTA clearance under Notification 11/2026-Customs",
      "Finished retail goods, not inputs for manufacture under Notification 45/2025-Customs",
      "No preference or other concession is admitted",
    ],
    formula: "assessable value × 20%",
    determination:
      "Tariff item 85183019 is 20%; Notification 12/2022 excludes wireless hearable devices, Notification 45/2025 covers manufacturing inputs rather than these finished goods, and Notification 11/2026 is a conditional SEZ-to-DTA window outside this foreign-import scenario.",
    sourceIds: [
      "headphones-cbic-tariff-85183019",
      "headphones-customs-12-2022",
      "headphones-customs-45-2025",
      "headphones-customs-11-2026-sez-dta",
      "headphones-icegate-duty-85183019",
      "headphones-icegate-duty-options-85183019",
    ],
    effectiveFrom: "2022-04-01",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "agriculture_infrastructure_development_cess",
    percent: 0,
    base: "assessable_value",
    applicability: ["HS 85183019 falls to the residual Any Chapter nil entry"],
    formula: "assessable value × 0%",
    determination: "Notification 11/2021-Customs residual Any Chapter entry sets AIDC to nil.",
    sourceIds: ["headphones-customs-aidc-11-2021", "headphones-icegate-duty-options-85183019"],
    effectiveFrom: "2021-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "social_welfare_surcharge",
    percent: 10,
    base: "basic_customs_duty",
    applicability: ["BCD is payable and AIDC is nil for the admitted HS 85183019 scenario"],
    formula: "basic customs duty × 10%",
    determination: "Finance Act 2018 section 110 applies 10% SWS to the covered BCD in this scenario.",
    sourceIds: ["headphones-finance-act-2018-sws", "headphones-icegate-duty-85183019"],
    effectiveFrom: "2018-02-02",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "igst",
    percent: 18,
    base: "assessable_value_plus_bcd_plus_sws",
    applicability: ["Heading 8518, Notification 9/2025 Schedule II S.No.491"],
    formula: "(assessable value + BCD + nil AIDC + SWS) × 18%",
    determination: "Notification 9/2025 places heading 8518 in the 18% Schedule II.",
    sourceIds: ["headphones-igst-9-2025", "headphones-icegate-duty-options-85183019"],
    effectiveFrom: "2025-09-22",
    lastChecked: ADMITTED_AT,
    reviewAfter: RATE_REVIEW_AFTER,
  },
  {
    id: "gst_compensation_cess",
    percent: 0,
    base: "assessable_value",
    applicability: ["Residual Any chapter entry after specifically listed cess goods are excluded"],
    formula: "applicable compensation-cess base × 0%",
    determination: "Notification 1/2017-Compensation Cess (Rate) gives residual Any chapter goods a nil rate.",
    sourceIds: ["headphones-compensation-cess-1-2017", "headphones-icegate-duty-85183019"],
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
  headphones_wpc_eta: "present",
  headphones_bis_crs: "present",
  headphones_battery_bis_crs: "present",
  headphones_repa_import_for_sale: "present",
  headphones_battery_epr: "present",
  headphones_legal_metrology_labels: "present",
  headphones_trade_remedy_check: "present",
} as const;

const blockedEvidence = { ...readyEvidence, headphones_wpc_eta: "absent" } as const;
const needsVerificationEvidence = {
  ...readyEvidence,
  headphones_trade_remedy_check: "unknown",
} as const;

const readyFacts: ProductPack["fixtures"][number]["facts"] = {
  productPackId: PACK_ID,
  assessmentDate: ADMITTED_AT,
  assessableValueInr: "100000",
  originCountryCode: "DE",
  importerIdentity: "Reviewed fixture headphone importer India Pvt Ltd",
  producerIdentity: "Reviewed fixture headphone producer",
  exporterIdentity: "Reviewed fixture headphone exporter",
  preferentialTariffClaim: "none",
  scenario: scenarioFacts,
  evidence: readyEvidence,
  tradeRemedyCheck: "confirmed_no_match",
};

const fixtures: ProductPack["fixtures"] = [
  {
    id: "headphones-ready-reviewed",
    name: "Exact headphone and parties with all blocking evidence and trade-remedy gate resolved",
    expectedOutcome: "ready",
    expectedCustomsClearanceBlocked: false,
    facts: readyFacts,
    findings: findings(readyEvidence),
    costLines,
    sourceIds: [
      "headphones-cbic-tariff-85183019",
      "headphones-icegate-classification-85183019",
      "headphones-dot-import-compendium",
      "headphones-bis-qco-2020",
      "headphones-bis-scheme-ii-current",
      "headphones-dot-repa-2026",
      "headphones-battery-waste-rules-2022",
      "headphones-dgft-general-notes-2025",
      "headphones-icegate-trade-remedy-check",
      "headphones-dgtr-investigations",
    ],
    actions: [
      wpcAction,
      headphoneBisAction,
      batteryBisAction,
      repaAction,
      batteryEprAction,
      labelAction,
      tradeRemedyAction,
    ],
    reviewedAt: ADMITTED_AT,
  },
  {
    id: "headphones-blocked-reviewed",
    name: "Exact headphone with confirmed missing exact-model WPC ETA",
    expectedOutcome: "blocked",
    expectedCustomsClearanceBlocked: true,
    facts: { ...readyFacts, evidence: blockedEvidence },
    findings: findings(blockedEvidence),
    costLines,
    sourceIds: [
      "headphones-dot-wpc-eta-service",
      "headphones-dot-eta-faq",
      "headphones-dot-import-compendium",
      "headphones-dot-license-exempt-24ghz",
    ],
    actions: [wpcAction],
    reviewedAt: ADMITTED_AT,
  },
  {
    id: "headphones-needs-verification-reviewed",
    name: "Exact headphone with unknown origin, parties and trade-remedy result",
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
    sourceIds: ["headphones-icegate-trade-remedy-check", "headphones-dgtr-investigations"],
    actions: [tradeRemedyAction],
    reviewedAt: ADMITTED_AT,
  },
];

export const headphonesPack: ProductPack = {
  id: PACK_ID,
  version: "1.0.0-source-admitted",
  title: "New retail over-ear Bluetooth-only headphones with integrated battery",
  lifecycleStatus: "source_admitted",
  admittedAt: ADMITTED_AT,
  selectable: false,
  publicRuntimeEnabled: false,
  admissionScope: {
    productPackId: PACK_ID,
    mappingApplicability: includedFacts,
    rateApplicability: { productPackId: PACK_ID, hsCode: "85183019" },
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
        ruleIds: ["headphones_legal_metrology_labels"],
        sourceIds: ["headphones-dgft-general-notes-2025"],
      },
      {
        moduleId: "shared.repa_import_for_sale",
        applicableProductPackId: PACK_ID,
        requiredScenarioFacts: {
          intendedUse: "retail_resale_in_india",
          hasBluetoothRadio: true,
        },
        ruleIds: ["headphones_repa_import_for_sale"],
        sourceIds: ["headphones-dot-repa-2026"],
      },
      {
        moduleId: "shared.wpc_eta_import",
        applicableProductPackId: PACK_ID,
        requiredScenarioFacts: {
          intendedUse: "retail_resale_in_india",
          hasBluetoothRadio: true,
          radioBandsMhz: ["2400-2483.5"],
        },
        ruleIds: ["headphones_wpc_eta"],
        sourceIds: [
          "headphones-dot-wpc-eta-service",
          "headphones-dot-eta-faq",
          "headphones-dot-import-compendium",
          "headphones-dot-license-exempt-24ghz",
        ],
      },
    ],
  },
  scenario: {
    id: "new-retail-over-ear-bluetooth-only-headphones",
    name: "New single-model retail over-ear Bluetooth-only headphones with integrated battery",
    includedFacts,
    requiredDistinguishingFacts: [...requiredDistinguishingFacts],
    excludedVariants: [
      "TWS, earbuds, in-ear or neckband devices",
      "Wired-only or hybrid wired-audio headphones",
      "Hearing devices, Bluetooth speakers, parts, components or bundles",
      "Wi-Fi, cellular, satellite, NFC or any radio other than admitted Bluetooth",
      "Charging cases, external chargers, power banks, removable or separately supplied batteries",
      "Used, refurbished, repaired, unknown-model or ambiguous-supply configurations",
    ],
  },
  hsMapping: {
    hsCode: "85183019",
    label: "Other wireless headphones and earphones, whether or not combined with a microphone",
    confidence: "high",
    provenance: "admitted_mapping",
    rationale:
      "The finished product connects through Bluetooth, its two sound channels are joined by a headband so it is not TWS, and it is not wired-only; the tariff's wireless Other item therefore applies.",
    applicabilityFacts: includedFacts,
    distinguishingFacts: [...requiredDistinguishingFacts],
    sourceIds: [
      "headphones-cbic-tariff-85183019",
      "headphones-icegate-classification-85183019",
    ],
  },
  sources,
  rules,
  rates,
  fixtures,
};
