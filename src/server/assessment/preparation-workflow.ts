import type { DocumentFactField } from "@/server/documents/intake";

export const DOCUMENT_TYPES = [
  "commercial_invoice",
  "packing_list",
  "transport_document",
  "china_exporter_registration",
  "china_customs_declaration",
  "china_export_control_screening",
  "china_statutory_inspection_screening",
  "end_user_end_use_statement",
  "india_wpc_eta",
  "india_bis_adapter",
  "india_mtcte",
  "india_repa",
  "india_retail_labels",
  "india_exporter_iec",
  "india_shipping_bill",
  "india_export_policy_screening",
  "india_scomet_screening",
  "china_import_declaration",
  "china_import_licence_screening",
  "china_tariff_classification",
  "china_product_market_access_screening",
  "china_party_end_use_screening",
  "china_trade_remedy_screening",
  "authority_acknowledgement",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  commercial_invoice: "Commercial invoice",
  packing_list: "Packing list",
  transport_document: "Transport document",
  china_exporter_registration: "China exporter registration record",
  china_customs_declaration: "China Customs export declaration",
  china_export_control_screening: "China export-control screening dossier",
  china_statutory_inspection_screening: "China statutory-inspection screening record",
  end_user_end_use_statement: "End-user and end-use statement",
  india_wpc_eta: "India WPC ETA and import undertaking",
  india_bis_adapter: "India BIS CRS adapter evidence",
  india_mtcte: "India MTCTE evidence or scope determination",
  india_repa: "India importer REPA authorisation",
  india_retail_labels: "India retail-package declarations",
  india_exporter_iec: "India exporter IEC evidence",
  india_shipping_bill: "India shipping bill or bill of export",
  india_export_policy_screening: "India Schedule II export-policy screen",
  india_scomet_screening: "India SCOMET screening dossier",
  china_import_declaration: "China Customs import declaration",
  china_import_licence_screening: "China import-licence catalogue screen",
  china_tariff_classification: "China tariff classification and rate result",
  china_product_market_access_screening: "China product-market access screening dossier",
  china_party_end_use_screening: "China party, end-user and end-use screening dossier",
  china_trade_remedy_screening: "China trade-remedy screening result",
  authority_acknowledgement: "Authority acknowledgement or release document",
};

export interface ProductProfileFact {
  label: string;
  name: string;
  sourceLocator: string;
  value: string;
}

export const REFERENCE_PRODUCT_PROFILE = {
  profileId: "tp-link-archer-ax12-in-1-8",
  boundedScope: "TP-Link Archer AX12, India hardware version 1.8 only",
  canonicalCaseIdentity: "TP-Link Archer AX12 (IN) 1.8",
  model: "Archer AX12",
  hardwareVersion: "IN 1.8",
  userConfirmationRequired: true as const,
  source: {
    authority: "TP-Link India",
    title: "Archer AX12 (IN) 1.8 Datasheet",
    url: "https://static.tp-link.com/upload/product-overview/2025/202511/20251125/Archer%20AX12%28IN%291.8_Datasheet.pdf",
    retrievedAt: "2026-08-25",
    reviewAfter: "2026-11-25",
    provenanceKind: "official_manufacturer_datasheet" as const,
  },
  facts: [
    {
      name: "wifi_speed",
      label: "Rated Wi-Fi speed",
      value: "1201 Mbps (5 GHz) + 300 Mbps (2.4 GHz)",
      sourceLocator: "Specifications — Wireless",
    },
    {
      name: "frequency_bands",
      label: "Frequency bands",
      value: "2.4 GHz and 5 GHz",
      sourceLocator: "Specifications — Wireless",
    },
    {
      name: "ethernet_ports",
      label: "Ethernet ports",
      value: "1 Gigabit WAN + 3 Gigabit LAN",
      sourceLocator: "Specifications — Hardware",
    },
    {
      name: "power",
      label: "External power supply",
      value: "12 V / 1 A",
      sourceLocator: "Specifications — Hardware",
    },
  ] satisfies ProductProfileFact[],
};

const REFERENCE_PRODUCT_PROFILE_IDENTITIES = [
  REFERENCE_PRODUCT_PROFILE.canonicalCaseIdentity,
  "TP-Link Archer AX12 (IN) hardware version 1.8",
  "Archer AX12 (IN) 1.8",
  "Archer AX12 IN 1.8",
] as const;

function normalizeComparable(value: string) {
  return value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
}

const NORMALIZED_REFERENCE_PRODUCT_IDENTITIES = new Set(
  REFERENCE_PRODUCT_PROFILE_IDENTITIES.map(normalizeComparable),
);

export function isReferenceProductProfileIdentity(modelIdentity: string) {
  return NORMALIZED_REFERENCE_PRODUCT_IDENTITIES.has(normalizeComparable(modelIdentity));
}

export function resolveReferenceProductProfileConfirmation(modelIdentity: string, confirmedAt: string) {
  if (!isReferenceProductProfileIdentity(modelIdentity)) {
    return {
      status: "needs_variant_confirmation" as const,
      focusedQuestion: "Enter and confirm the exact TP-Link Archer AX12 (IN) hardware version 1.8 identity shown on the purchased unit or case document.",
    };
  }
  return {
    status: "confirmed" as const,
    confirmation: {
      profileId: REFERENCE_PRODUCT_PROFILE.profileId,
      confirmedAt,
      confirmedByUser: true as const,
      modelIdentity: REFERENCE_PRODUCT_PROFILE.canonicalCaseIdentity,
    },
  };
}

export function discoverReferenceProductProfile(query: string) {
  const normalized = query.trim().toLowerCase().replaceAll(/[()_-]/g, " ").replaceAll(/\s+/g, " ");
  if (!normalized.includes("archer ax12")) {
    return {
      status: "outside_bounded_scope" as const,
      focusedQuestions: ["BWMI-20 supports only TP-Link Archer AX12 IN hardware version 1.8."],
    };
  }
  const hasIn = /\bin\b|india/.test(normalized);
  const hasVersion = /(?:version|hardware|v)?\s*1(?:\.|\s)8\b/.test(normalized);
  if (!hasIn || !hasVersion) {
    return {
      status: "needs_variant_confirmation" as const,
      focusedQuestions: [
        "Confirm that the purchased unit is the India-region Archer AX12 hardware version 1.8 shown on its label or invoice.",
      ],
      candidate: REFERENCE_PRODUCT_PROFILE,
    };
  }
  return {
    status: "candidate_found" as const,
    focusedQuestions: [
      "Confirm this official-source candidate matches the purchased model and hardware version before using its facts in the Trade Case.",
    ],
    candidate: REFERENCE_PRODUCT_PROFILE,
  };
}

export interface DocumentRequirement {
  documentType: Exclude<DocumentType, "authority_acknowledgement">;
  filingDestination: {
    access: "public_guidance" | "protected_portal" | "manual_authority";
    label: string;
    url: string;
  };
  id: string;
  issuer: string;
  jurisdiction: "China" | "India" | "Cross-border";
  requiredVisibleFacts: Array<{ field: DocumentFactField; label: string }>;
  sourceIds: string[];
  title: string;
  whyRequired: string;
}

export const CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "shared-commercial-invoice",
    documentType: "commercial_invoice",
    title: "Case-matched commercial invoice",
    jurisdiction: "Cross-border",
    issuer: "China exporter / seller",
    filingDestination: { access: "protected_portal", label: "China Single Window and India ICEGATE supporting-document workflows", url: "https://www.singlewindow.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "invoice number" },
      { field: "documentDate", label: "invoice date" },
      { field: "exporterIdentity", label: "exporter / seller" },
      { field: "importerIdentity", label: "importer / buyer" },
      { field: "modelIdentity", label: "exact product model and variant" },
      { field: "itemValueInr", label: "case transaction value" },
    ],
    whyRequired: "Supports the declared parties, exact model, quantity and transaction value on both sides.",
    sourceIds: ["gacc-goods-declaration-guide-2026", "dgft-baseline-import-documents"],
  },
  {
    id: "shared-packing-list",
    documentType: "packing_list",
    title: "Case-matched packing list",
    jurisdiction: "Cross-border",
    issuer: "China exporter / packer",
    filingDestination: { access: "protected_portal", label: "China Single Window and India ICEGATE supporting-document workflows", url: "https://www.icegate.gov.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "packing-list number" },
      { field: "documentDate", label: "packing-list date" },
      { field: "exporterIdentity", label: "shipper / exporter" },
      { field: "importerIdentity", label: "consignee / importer" },
      { field: "modelIdentity", label: "exact product model and variant" },
      { field: "quantity", label: "packed quantity" },
    ],
    whyRequired: "Supports packages, quantity, weights and model consistency for the shipment.",
    sourceIds: ["gacc-goods-declaration-guide-2026", "dgft-baseline-import-documents"],
  },
  {
    id: "shared-transport-document",
    documentType: "transport_document",
    title: "Bill of lading, airway bill or equivalent transport document",
    jurisdiction: "Cross-border",
    issuer: "Carrier or freight forwarder",
    filingDestination: { access: "protected_portal", label: "China Single Window and India ICEGATE supporting-document workflows", url: "https://www.icegate.gov.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "transport-document number" },
      { field: "documentDate", label: "transport-document date" },
      { field: "exporterIdentity", label: "shipper / exporter" },
      { field: "importerIdentity", label: "consignee / importer" },
      { field: "exportPort", label: "China export port" },
      { field: "importPort", label: "India import port" },
    ],
    whyRequired: "Supports the actual route, ports, consignee and shipment reference.",
    sourceIds: ["gacc-goods-declaration-guide-2026", "dgft-baseline-import-documents"],
  },
  {
    id: "china-exporter-registration",
    documentType: "china_exporter_registration",
    title: "China exporter registration record",
    jurisdiction: "China",
    issuer: "Competent Chinese registration authority",
    filingDestination: { access: "protected_portal", label: "GACC goods-declaration service", url: "https://online.customs.gov.cn/static/pages/guides/000629002001/000629002001.html" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "registration reference" },
      { field: "exporterIdentity", label: "registered China exporter" },
    ],
    whyRequired: "The admitted GACC guide identifies a Customs-registered enterprise as the eligible applicant.",
    sourceIds: ["prc-foreign-trade-law-2025", "gacc-goods-declaration-guide-2026"],
  },
  {
    id: "china-customs-export-declaration",
    documentType: "china_customs_declaration",
    title: "China Customs export declaration",
    jurisdiction: "China",
    issuer: "Exporter or appointed declarant; receipt/acceptance only by GACC",
    filingDestination: { access: "protected_portal", label: "China International Trade Single Window", url: "https://www.singlewindow.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "Customs declaration number" },
      { field: "documentDate", label: "declaration date" },
      { field: "exporterIdentity", label: "China exporter / declarant" },
      { field: "importerIdentity", label: "foreign consignee / India importer" },
      { field: "productDescription", label: "declared product description and scope" },
      { field: "chinaTariffCode", label: "declared 10-digit China commodity code" },
      { field: "originCountryCode", label: "declared China origin" },
      { field: "exportPort", label: "China exit Customs / port" },
    ],
    whyRequired: "Goods leaving China require declaration data and case-specific accompanying documents.",
    sourceIds: ["gacc-order-277-declaration", "gacc-goods-declaration-guide-2026"],
  },
  {
    id: "china-export-control-dossier",
    documentType: "china_export_control_screening",
    title: "Dated export-control screening dossier",
    jurisdiction: "China",
    issuer: "Exporter and qualified compliance reviewer; a licence only by MOFCOM",
    filingDestination: { access: "protected_portal", label: "MOFCOM dual-use export-control service", url: "https://exportcontrol.mofcom.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "screening dossier reference" },
      { field: "documentDate", label: "screening date" },
      { field: "exporterIdentity", label: "screened exporter" },
      { field: "endUserIdentity", label: "screened end user" },
      { field: "modelIdentity", label: "exact screened product variant" },
      { field: "chinaTariffCode", label: "screened 10-digit China commodity code" },
      { field: "endUse", label: "screened end use" },
    ],
    whyRequired: "Records the exact commodity, technical threshold, temporary-control and catch-all review for this case.",
    sourceIds: ["prc-dual-use-regulation-792", "prc-dual-use-list-2026-consolidated", "mofcom-export-licence-catalogue-2026"],
  },
  {
    id: "china-statutory-inspection-screen",
    documentType: "china_statutory_inspection_screening",
    title: "Current statutory-inspection catalogue screen",
    jurisdiction: "China",
    issuer: "Exporter / declarant; inspection evidence only by the competent GACC authority",
    filingDestination: { access: "manual_authority", label: "GACC commodity-inspection authority for the export port", url: "https://online.customs.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentDate", label: "catalogue-screen date" },
      { field: "chinaTariffCode", label: "screened 10-digit China commodity code" },
      { field: "productDescription", label: "screened commodity description and scope" },
    ],
    whyRequired: "The Inspection Law makes catalogue inclusion material, while the exact current row remains a visible coverage gap.",
    sourceIds: ["prc-commodity-inspection-law-2021"],
  },
  {
    id: "china-end-user-end-use",
    documentType: "end_user_end_use_statement",
    title: "End-user and end-use statement",
    jurisdiction: "China",
    issuer: "Consignee / end user, countersigned as required by the exporter",
    filingDestination: { access: "protected_portal", label: "MOFCOM dual-use licensing service when a licence determination requires it", url: "https://exportcontrol.mofcom.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentDate", label: "statement date" },
      { field: "endUserIdentity", label: "identified end user" },
      { field: "modelIdentity", label: "exact product model and variant" },
      { field: "endUse", label: "specific intended end use" },
    ],
    whyRequired: "Catch-all and party review depends on the exact consignee, end user and intended use.",
    sourceIds: ["prc-dual-use-regulation-792"],
  },
  {
    id: "india-wpc-eta",
    documentType: "india_wpc_eta",
    title: "Exact-model WPC ETA and import undertaking",
    jurisdiction: "India",
    issuer: "DoT Wireless Planning and Coordination Wing / applicant undertaking",
    filingDestination: { access: "protected_portal", label: "Saral Sanchar WPC ETA service", url: "https://saralsanchar.gov.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "ETA reference" },
      { field: "documentDate", label: "ETA / undertaking date" },
      { field: "modelIdentity", label: "authorised exact product model" },
      { field: "manufacturerIdentity", label: "identified manufacturer" },
    ],
    whyRequired: "The confirmed router intentionally transmits in admitted licence-exempt frequency bands.",
    sourceIds: ["dot-wpc-eta-service", "dot-wpc-import-compendium", "dot-license-exempt-bands"],
  },
  {
    id: "india-bis-adapter",
    documentType: "india_bis_adapter",
    title: "Exact-adapter BIS CRS evidence",
    jurisdiction: "India",
    issuer: "Bureau of Indian Standards / registered adapter manufacturer",
    filingDestination: { access: "protected_portal", label: "BIS CRS registration service", url: "https://www.crsbis.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "BIS registration reference" },
      { field: "documentDate", label: "registration date" },
      { field: "expiryDate", label: "visible validity / expiry date" },
      { field: "adapterModelIdentity", label: "registered exact adapter model" },
      { field: "manufacturerIdentity", label: "registered manufacturer" },
    ],
    whyRequired: "The admitted retail set contains a dedicated external AC-to-DC IT power adapter.",
    sourceIds: ["bis-cro-2021-adapter", "bis-scheme-ii-adapter"],
  },
  {
    id: "india-mtcte",
    documentType: "india_mtcte",
    title: "Exact-model MTCTE certificate or scope determination",
    jurisdiction: "India",
    issuer: "Telecommunication Engineering Centre",
    filingDestination: { access: "protected_portal", label: "TEC MTCTE portal", url: "https://www.mtcte.tec.gov.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "MTCTE certificate / determination reference" },
      { field: "documentDate", label: "certificate / determination date" },
      { field: "expiryDate", label: "visible validity / expiry date" },
      { field: "modelIdentity", label: "covered exact product model" },
      { field: "manufacturerIdentity", label: "identified manufacturer" },
    ],
    whyRequired: "The admitted product is Wi-Fi customer-premises equipment intended for the Indian market.",
    sourceIds: ["mtcte-framework-2025", "mtcte-products-current", "mtcte-procedure-2024"],
  },
  {
    id: "india-repa",
    documentType: "india_repa",
    title: "Importer REPA authorisation",
    jurisdiction: "India",
    issuer: "Department of Telecommunications",
    filingDestination: { access: "protected_portal", label: "DoT Radio Equipment Possession Authorisation service", url: "https://www.eservices.dot.gov.in/radio-equipment-possession-authorisation-services" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "REPA reference" },
      { field: "documentDate", label: "authorisation date" },
      { field: "expiryDate", label: "visible validity / expiry date" },
      { field: "importerIdentity", label: "authorised India importer" },
    ],
    whyRequired: "The confirmed importer will possess and deal in radio equipment for sale.",
    sourceIds: ["dot-repa-2026"],
  },
  {
    id: "india-retail-labels",
    documentType: "india_retail_labels",
    title: "Final imported retail-package declarations",
    jurisdiction: "India",
    issuer: "Indian importer / packer",
    filingDestination: { access: "public_guidance", label: "DGFT General Notes to Import Policy", url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf" },
    requiredVisibleFacts: [
      { field: "productDescription", label: "retail product description" },
      { field: "modelIdentity", label: "exact retail product model" },
      { field: "importerIdentity", label: "India importer declaration" },
      { field: "originCountryCode", label: "country-of-origin declaration" },
    ],
    whyRequired: "The confirmed goods are prepackaged for retail sale in India.",
    sourceIds: ["dgft-general-import-notes-2025"],
  },
];

export const INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "india-exporter-iec",
    documentType: "india_exporter_iec",
    title: "India exporter IEC evidence",
    jurisdiction: "India",
    issuer: "Directorate General of Foreign Trade",
    filingDestination: { access: "protected_portal", label: "DGFT IEC services", url: "https://www.dgft.gov.in/CP/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "IEC number" },
      { field: "documentDate", label: "visible IEC record date" },
      { field: "exporterIdentity", label: "India exporter legal identity" },
    ],
    whyRequired: "The India exporter must be identified and the applicable IEC evidence retained for the case.",
    sourceIds: ["dgft-ftp-2023-export-documents"],
  },
  {
    id: "india-shipping-bill",
    documentType: "india_shipping_bill",
    title: "India shipping bill or bill of export",
    jurisdiction: "India",
    issuer: "Exporter or Customs Broker; acceptance only by India Customs",
    filingDestination: { access: "protected_portal", label: "ICEGATE export filing", url: "https://www.icegate.gov.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "shipping-bill reference" },
      { field: "documentDate", label: "shipping-bill date" },
      { field: "exporterIdentity", label: "India exporter" },
      { field: "importerIdentity", label: "China consignee / importer" },
      { field: "indiaTariffCode", label: "declared eight-digit Indian ITC(HS) code" },
      { field: "originCountryCode", label: "declared country of origin" },
      { field: "exportPort", label: "India export port / Customs station" },
    ],
    whyRequired: "The case requires a shipment-specific India export declaration with the declared parties, classification, origin and port.",
    sourceIds: ["dgft-ftp-2023-export-documents"],
  },
  {
    id: "india-export-policy-screen",
    documentType: "india_export_policy_screening",
    title: "Current India Schedule II export-policy screen",
    jurisdiction: "India",
    issuer: "Exporter or qualified reviewer; authorisation only by DGFT",
    filingDestination: { access: "public_guidance", label: "DGFT ITC(HS) Schedule II", url: "https://www.dgft.gov.in/CP/" },
    requiredVisibleFacts: [
      { field: "documentDate", label: "screening date" },
      { field: "indiaTariffCode", label: "screened eight-digit Indian ITC(HS) code" },
      { field: "productDescription", label: "exact screened product description" },
    ],
    whyRequired: "The effective Schedule II row and any policy condition must be checked for the exact Indian code and product.",
    sourceIds: ["dgft-schedule-ii-hosting-2025"],
  },
  {
    id: "india-scomet-screen",
    documentType: "india_scomet_screening",
    title: "India SCOMET technical and end-use screening dossier",
    jurisdiction: "India",
    issuer: "Exporter and qualified compliance reviewer; licence only by DGFT",
    filingDestination: { access: "protected_portal", label: "DGFT SCOMET services", url: "https://www.dgft.gov.in/CP/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "screening dossier reference" },
      { field: "documentDate", label: "screening date" },
      { field: "modelIdentity", label: "exact screened product model" },
      { field: "endUserIdentity", label: "screened end user" },
      { field: "endUse", label: "screened end use" },
    ],
    whyRequired: "Encryption, software, technology, technical thresholds, parties, end user and end use must be screened against the current SCOMET list.",
    sourceIds: ["dgft-scomet-list-2025"],
  },
  {
    id: "shared-india-to-china-invoice",
    documentType: "commercial_invoice",
    title: "Case-matched commercial invoice",
    jurisdiction: "Cross-border",
    issuer: "India exporter / seller",
    filingDestination: { access: "protected_portal", label: "ICEGATE and China Single Window supporting-document workflows", url: "https://www.icegate.gov.in/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "invoice number" },
      { field: "documentDate", label: "invoice date" },
      { field: "exporterIdentity", label: "India exporter / seller" },
      { field: "importerIdentity", label: "China importer / buyer" },
      { field: "modelIdentity", label: "exact product model" },
      { field: "quantity", label: "invoice quantity" },
    ],
    whyRequired: "Supports the exact model, parties, quantity and transaction across both Customs declarations.",
    sourceIds: ["dgft-ftp-2023-export-documents", "gacc-order-277-import-declaration"],
  },
  {
    id: "shared-india-to-china-packing-list",
    documentType: "packing_list",
    title: "Case-matched packing list",
    jurisdiction: "Cross-border",
    issuer: "India exporter / packer",
    filingDestination: { access: "protected_portal", label: "ICEGATE and China Single Window supporting-document workflows", url: "https://www.singlewindow.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "packing-list number" },
      { field: "documentDate", label: "packing-list date" },
      { field: "exporterIdentity", label: "shipper / exporter" },
      { field: "importerIdentity", label: "consignee / importer" },
      { field: "modelIdentity", label: "exact product model" },
      { field: "quantity", label: "packed quantity" },
    ],
    whyRequired: "Supports model, packages and quantity consistency for the shipment.",
    sourceIds: ["dgft-ftp-2023-export-documents", "gacc-order-277-import-declaration"],
  },
  {
    id: "shared-india-to-china-transport",
    documentType: "transport_document",
    title: "Bill of lading, airway bill or equivalent transport document",
    jurisdiction: "Cross-border",
    issuer: "Carrier or freight forwarder",
    filingDestination: { access: "protected_portal", label: "ICEGATE and China Single Window supporting-document workflows", url: "https://www.singlewindow.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "transport-document number" },
      { field: "documentDate", label: "transport-document date" },
      { field: "exporterIdentity", label: "shipper / exporter" },
      { field: "importerIdentity", label: "consignee / importer" },
      { field: "exportPort", label: "India export port" },
      { field: "importPort", label: "China import port" },
    ],
    whyRequired: "Supports the confirmed route and transport leg for both declarations.",
    sourceIds: ["dgft-ftp-2023-export-documents", "gacc-order-277-import-declaration"],
  },
  {
    id: "china-import-declaration",
    documentType: "china_import_declaration",
    title: "China Customs import declaration",
    jurisdiction: "China",
    issuer: "China importer or appointed declarant; acceptance only by GACC",
    filingDestination: { access: "protected_portal", label: "China International Trade Single Window", url: "https://www.singlewindow.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "China declaration reference" },
      { field: "documentDate", label: "declaration date" },
      { field: "exporterIdentity", label: "India exporter" },
      { field: "importerIdentity", label: "China importer / declarant" },
      { field: "chinaTariffCode", label: "declared ten-digit China commodity code" },
      { field: "originCountryCode", label: "declared India origin" },
      { field: "importPort", label: "China import port / Customs district" },
    ],
    whyRequired: "Goods entering China require declaration data and accompanying case documents.",
    sourceIds: ["gacc-order-277-import-declaration"],
  },
  {
    id: "china-import-licence-screen",
    documentType: "china_import_licence_screening",
    title: "Current China import-licence catalogue screen",
    jurisdiction: "China",
    issuer: "China importer / qualified reviewer; licence only by MOFCOM",
    filingDestination: { access: "protected_portal", label: "MOFCOM import-licence service", url: "https://xkzj.mofcom.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentDate", label: "screening date" },
      { field: "chinaTariffCode", label: "screened ten-digit China commodity code" },
      { field: "productDescription", label: "exact screened product description" },
    ],
    whyRequired: "The exact Chinese code and description must be checked against the effective annual catalogue.",
    sourceIds: ["mofcom-import-licence-catalogue-2026"],
  },
  {
    id: "china-tariff-result",
    documentType: "china_tariff_classification",
    title: "Exact China tariff classification and rate result",
    jurisdiction: "China",
    issuer: "China importer / broker; binding or accepted result only by GACC",
    filingDestination: { access: "manual_authority", label: "GACC tariff and Customs service", url: "https://online.customs.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "result or query reference" },
      { field: "documentDate", label: "result date" },
      { field: "chinaTariffCode", label: "confirmed ten-digit China commodity code" },
      { field: "productDescription", label: "case-matched tariff description" },
    ],
    whyRequired: "Classification, origin, duty, VAT and any other border charge require an exact current authority result for the case.",
    sourceIds: ["prc-tariff-schedule-2026", "prc-tariff-law-2024", "prc-vat-law-2024"],
  },
  {
    id: "china-product-market-access",
    documentType: "china_product_market_access_screening",
    title: "China CCC, network-access and radio type-approval dossier",
    jurisdiction: "China",
    issuer: "China importer / manufacturer and qualified reviewer; status only by CNCA or MIIT",
    filingDestination: { access: "protected_portal", label: "CNCA and MIIT product-market services", url: "https://www.cnca.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "screening or authority-result reference" },
      { field: "documentDate", label: "screening date" },
      { field: "modelIdentity", label: "exact screened product model" },
      { field: "manufacturerIdentity", label: "identified manufacturer" },
    ],
    whyRequired: "The exact router model must be screened against current CCC, telecom network-access and radio type-approval scope and status.",
    sourceIds: ["cnca-ccc-scope-2023", "cnca-ccc-rules-2026", "miit-network-access-2024", "miit-radio-approval-guide-2020"],
  },
  {
    id: "china-party-end-use-screen",
    documentType: "china_party_end_use_screening",
    title: "China party, end-user and end-use screening dossier",
    jurisdiction: "China",
    issuer: "Exporter, importer and qualified compliance reviewer",
    filingDestination: { access: "manual_authority", label: "Owning China authority for any identified restriction", url: "https://www.mofcom.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "screening reference" },
      { field: "documentDate", label: "screening date" },
      { field: "importerIdentity", label: "screened importer" },
      { field: "endUserIdentity", label: "screened end user" },
      { field: "endUse", label: "screened end use" },
    ],
    whyRequired: "The exact parties, end user and end use require current case-specific screening.",
    sourceIds: ["prc-tariff-law-2024"],
  },
  {
    id: "china-trade-remedy-screen",
    documentType: "china_trade_remedy_screening",
    title: "Current China trade-remedy screen",
    jurisdiction: "China",
    issuer: "China importer / qualified reviewer; measure only by the competent authority",
    filingDestination: { access: "public_guidance", label: "MOFCOM trade-remedy publications", url: "https://www.mofcom.gov.cn/" },
    requiredVisibleFacts: [
      { field: "documentNumber", label: "screening reference" },
      { field: "documentDate", label: "screening date" },
      { field: "exporterIdentity", label: "screened exporter" },
      { field: "producerIdentity", label: "screened producer" },
      { field: "originCountryCode", label: "screened origin" },
    ],
    whyRequired: "Origin-, producer- and exporter-specific trade remedies can change the border-charge result.",
    sourceIds: ["prc-tariff-law-2024"],
  },
  {
    id: "china-end-user-end-use-india-export",
    documentType: "end_user_end_use_statement",
    title: "Case-matched end-user and end-use statement",
    jurisdiction: "Cross-border",
    issuer: "China consignee / end user, countersigned as required",
    filingDestination: { access: "manual_authority", label: "DGFT or China authority when a control requires it", url: "https://www.dgft.gov.in/CP/" },
    requiredVisibleFacts: [
      { field: "documentDate", label: "statement date" },
      { field: "endUserIdentity", label: "identified end user" },
      { field: "modelIdentity", label: "exact product model" },
      { field: "endUse", label: "specific end use" },
    ],
    whyRequired: "Both India export-control and China case-party review depend on the exact end user and end use.",
    sourceIds: ["dgft-scomet-list-2025"],
  },
];

export interface PreparationDocumentInput {
  documentType: string;
  facts: Array<{
    field: string;
    reviewStatus: "confirmed" | "corrected" | "pending";
    value: string;
  }>;
  fileName: string;
}

export function documentMeetsRequiredVisibleFacts(
  documentType: string,
  facts: PreparationDocumentInput["facts"],
  tradeDirection: "china_to_india" | "india_to_china" = "china_to_india",
) {
  const requirements = tradeDirection === "india_to_china"
    ? INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS
    : CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS;
  const requirement = requirements.find(
    (candidate) => candidate.documentType === documentType,
  );
  return Boolean(requirement?.requiredVisibleFacts.every((requiredFact) => facts.some((fact) => (
    fact.field === requiredFact.field &&
    fact.reviewStatus !== "pending" &&
    fact.value.trim().length > 0
  ))));
}

export interface ProductProfileConfirmation {
  confirmedAt: string;
  confirmedByUser: true;
  modelIdentity: string;
  profileId: string;
}

const REQUIRED_CASE_FACTS = [
  "product_model",
  "manufacturer",
  "adapter_model",
  "china_tariff_code",
  "exporter",
  "producer",
  "importer",
  "end_user",
  "manufacturing_site",
  "origin_basis",
  "end_use",
  "export_port",
  "import_port",
  "item_value_inr",
  "assessment_date",
] as const;

const CASE_FACT_ALIASES: Record<string, string> = {
  modelIdentity: "product_model",
  manufacturerIdentity: "manufacturer",
  adapterModelIdentity: "adapter_model",
  indiaTariffCode: "india_tariff_code",
  chinaTariffCode: "china_tariff_code",
  exporterIdentity: "exporter",
  producerIdentity: "producer",
  importerIdentity: "importer",
  endUserIdentity: "end_user",
  originCountryCode: "origin_country_code",
  manufacturingSite: "manufacturing_site",
  originBasis: "origin_basis",
  endUse: "end_use",
  exportPort: "export_port",
  importPort: "import_port",
  itemValueInr: "item_value_inr",
};

export function evaluatePreparationWorkflow(input: {
  confirmedFacts: Array<{ name: string; value: string }>;
  documents: PreparationDocumentInput[];
  productProfileConfirmation: ProductProfileConfirmation | null;
}) {
  const caseFacts = new Map(input.confirmedFacts.map((fact) => [fact.name, fact.value.trim()]));
  const missingInformation: string[] = REQUIRED_CASE_FACTS.filter((name) => !caseFacts.get(name));
  if (
    !input.productProfileConfirmation?.confirmedByUser ||
    input.productProfileConfirmation.profileId !== REFERENCE_PRODUCT_PROFILE.profileId ||
    !isReferenceProductProfileIdentity(input.productProfileConfirmation.modelIdentity) ||
    !isReferenceProductProfileIdentity(caseFacts.get("product_model") ?? "")
  ) {
    missingInformation.unshift("confirmed exact Archer AX12 (IN) hardware version 1.8 reference-product identity");
  }

  const uploadedTypes = new Set(input.documents.map((document) => document.documentType));
  const missingDocuments = CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS
    .filter((requirement) => !uploadedTypes.has(requirement.documentType))
    .map((requirement) => requirement.title);
  const visibleContentFindings: Array<{
    kind: "missing_required_visible_fact" | "pending_user_review" | "invalid_visible_date" | "expired_visible_date";
    fileName: string;
    field: string;
    message: string;
  }> = input.documents.flatMap((document) =>
    document.facts
      .filter((fact) => fact.reviewStatus === "pending")
      .map((fact) => ({
        kind: "pending_user_review" as const,
        fileName: document.fileName,
        field: fact.field,
        message: `${fact.field} is visible but still needs user confirmation or correction.`,
      })),
  );
  for (const requirement of CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS) {
    for (const document of input.documents.filter((candidate) => candidate.documentType === requirement.documentType)) {
      for (const requiredFact of requirement.requiredVisibleFacts) {
        const candidates = document.facts.filter((fact) => fact.field === requiredFact.field);
        const hasVisibleValue = candidates.some((fact) => fact.value.trim().length > 0);
        if (hasVisibleValue) continue;
        visibleContentFindings.push({
          kind: "missing_required_visible_fact",
          fileName: document.fileName,
          field: requiredFact.field,
          message: `${document.fileName} is missing the visible ${requiredFact.label} required for ${requirement.title}.`,
        });
      }
    }
  }
  const assessmentDate = caseFacts.get("assessment_date");
  for (const document of input.documents) {
    for (const fact of document.facts) {
      if (fact.reviewStatus === "pending" || (fact.field !== "documentDate" && fact.field !== "expiryDate")) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fact.value) || Number.isNaN(Date.parse(`${fact.value}T00:00:00Z`))) {
        visibleContentFindings.push({
          kind: "invalid_visible_date",
          fileName: document.fileName,
          field: fact.field,
          message: `${fact.field} is visible but is not a supported YYYY-MM-DD date.`,
        });
      } else if (fact.field === "expiryDate" && assessmentDate && fact.value < assessmentDate) {
        visibleContentFindings.push({
          kind: "expired_visible_date",
          fileName: document.fileName,
          field: fact.field,
          message: `${document.fileName} visibly states an expiry date before the Trade Case assessment date.`,
        });
      }
    }
  }

  const consistencyFindings: Array<{
    field: string;
    kind: "case_document_conflict" | "cross_document_conflict";
    message: string;
    values: string[];
  }> = [];
  const valuesByField = new Map<string, Set<string>>();
  for (const document of input.documents) {
    for (const fact of document.facts) {
      if (fact.reviewStatus === "pending" || !fact.value.trim()) continue;
      const values = valuesByField.get(fact.field) ?? new Set<string>();
      values.add(fact.value.trim());
      valuesByField.set(fact.field, values);
    }
  }
  const documentScopedFields = new Set(["documentNumber", "documentDate", "expiryDate", "incoterm"]);
  for (const [field, values] of valuesByField) {
    if (documentScopedFields.has(field)) continue;
    const normalizedValues = new Set([...values].map(normalizeComparable));
    if (normalizedValues.size > 1) {
      consistencyFindings.push({
        field,
        kind: "cross_document_conflict",
        values: [...values],
        message: `${field} has conflicting reviewed values across uploaded documents.`,
      });
      continue;
    }
    const caseName = CASE_FACT_ALIASES[field];
    const caseValue = caseName ? caseFacts.get(caseName) : undefined;
    const documentValue = [...values][0];
    if (caseValue && documentValue && normalizeComparable(caseValue) !== normalizeComparable(documentValue)) {
      consistencyFindings.push({
        field,
        kind: "case_document_conflict",
        values: [caseValue, documentValue],
        message: `${field} conflicts with the confirmed Trade Case value.`,
      });
    }
  }

  const authorityEvidenceObservations = input.documents
    .filter((document) => document.documentType === "authority_acknowledgement")
    .map((document) => {
      const visibleNumber = document.facts.find((fact) => fact.field === "documentNumber" && fact.reviewStatus !== "pending")?.value;
      return {
        fileName: document.fileName,
        statement: visibleNumber
          ? `The uploaded document visibly states reference ${visibleNumber}; live authority status was not checked.`
          : "An authority acknowledgement was uploaded, but no supported reviewed reference was extracted; live authority status was not checked.",
      };
    });

  let status:
    | "Needs information"
    | "Requirements identified"
    | "Documents required"
    | "Uploads checked"
    | "Document Package Ready for Submission Within Verified Scope";
  if (missingInformation.length > 0) status = "Needs information";
  else if (input.documents.length === 0) status = "Documents required";
  else if (missingDocuments.length > 0 || visibleContentFindings.length > 0 || consistencyFindings.length > 0) status = "Uploads checked";
  else status = "Document Package Ready for Submission Within Verified Scope";

  return {
    status,
    requirements: CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS,
    missingInformation,
    missingDocuments,
    visibleContentFindings,
    consistencyFindings,
    authorityEvidenceObservations,
    authenticityStatus: "unverified" as const,
    filingStatus: authorityEvidenceObservations.length > 0 ? "not_verified_from_upload" as const : "not_filed" as const,
    acceptanceStatus: "unverified" as const,
    clearanceStatus: "unverified" as const,
    portalBoundary: "Protected portal integration is not required for preparation. Filing, acceptance and clearance require authority evidence.",
  };
}

const INDIA_TO_CHINA_REQUIRED_CASE_FACTS = [
  "product_model",
  "manufacturer",
  "product_description",
  "technical_specifications",
  "india_tariff_code",
  "china_tariff_code",
  "exporter",
  "producer",
  "importer",
  "end_user",
  "manufacturing_site",
  "origin_basis",
  "intended_use",
  "end_use",
  "export_port",
  "import_port",
  "destination_province",
  "item_value_cny",
  "assessment_date",
] as const;

export function evaluateIndiaToChinaPreparationWorkflow(input: {
  confirmedFacts: Array<{ name: string; value: string }>;
  documents: PreparationDocumentInput[];
}) {
  const caseFacts = new Map(input.confirmedFacts.map((fact) => [fact.name, fact.value.trim()]));
  const missingInformation = INDIA_TO_CHINA_REQUIRED_CASE_FACTS
    .filter((name) => !caseFacts.get(name))
    .map((name) => name.replaceAll("_", " "));
  const uploadedTypes = new Set(input.documents.map((document) => document.documentType));
  const missingDocuments = INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS
    .filter((requirement) => !uploadedTypes.has(requirement.documentType))
    .map((requirement) => requirement.title);
  const visibleContentFindings: Array<{
    kind: "missing_required_visible_fact" | "pending_user_review" | "invalid_visible_date" | "expired_visible_date";
    fileName: string;
    field: string;
    message: string;
  }> = [];
  for (const document of input.documents) {
    for (const fact of document.facts.filter((candidate) => candidate.reviewStatus === "pending")) {
      visibleContentFindings.push({
        kind: "pending_user_review",
        fileName: document.fileName,
        field: fact.field,
        message: `${fact.field} is visible but still needs user confirmation or correction.`,
      });
    }
  }
  for (const requirement of INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS) {
    for (const document of input.documents.filter((candidate) => candidate.documentType === requirement.documentType)) {
      for (const requiredFact of requirement.requiredVisibleFacts) {
        const hasReviewedValue = document.facts.some((fact) => (
          fact.field === requiredFact.field && fact.reviewStatus !== "pending" && fact.value.trim().length > 0
        ));
        if (hasReviewedValue) continue;
        visibleContentFindings.push({
          kind: "missing_required_visible_fact",
          fileName: document.fileName,
          field: requiredFact.field,
          message: `${document.fileName} is missing the reviewed visible ${requiredFact.label} required for ${requirement.title}.`,
        });
      }
    }
  }
  const assessmentDate = caseFacts.get("assessment_date");
  for (const document of input.documents) {
    for (const fact of document.facts) {
      if (fact.reviewStatus === "pending" || (fact.field !== "documentDate" && fact.field !== "expiryDate")) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fact.value) || Number.isNaN(Date.parse(`${fact.value}T00:00:00Z`))) {
        visibleContentFindings.push({
          kind: "invalid_visible_date",
          fileName: document.fileName,
          field: fact.field,
          message: `${fact.field} is visible but is not a supported YYYY-MM-DD date.`,
        });
      } else if (fact.field === "expiryDate" && assessmentDate && fact.value < assessmentDate) {
        visibleContentFindings.push({
          kind: "expired_visible_date",
          fileName: document.fileName,
          field: fact.field,
          message: `${document.fileName} visibly states an expiry date before the Trade Case assessment date.`,
        });
      }
    }
  }

  const consistencyFindings: Array<{
    field: string;
    kind: "case_document_conflict" | "cross_document_conflict";
    message: string;
    values: string[];
  }> = [];
  const valuesByField = new Map<string, Set<string>>();
  for (const document of input.documents) {
    for (const fact of document.facts) {
      if (fact.reviewStatus === "pending" || !fact.value.trim()) continue;
      const values = valuesByField.get(fact.field) ?? new Set<string>();
      values.add(fact.value.trim());
      valuesByField.set(fact.field, values);
    }
  }
  const documentScopedFields = new Set(["documentNumber", "documentDate", "expiryDate", "incoterm"]);
  for (const [field, values] of valuesByField) {
    if (documentScopedFields.has(field)) continue;
    const normalizedValues = new Set([...values].map(normalizeComparable));
    if (normalizedValues.size > 1) {
      consistencyFindings.push({
        field,
        kind: "cross_document_conflict",
        values: [...values],
        message: `${field} has conflicting reviewed values across uploaded documents.`,
      });
      continue;
    }
    const caseName = CASE_FACT_ALIASES[field];
    const caseValue = caseName ? caseFacts.get(caseName) : undefined;
    const documentValue = [...values][0];
    if (caseValue && documentValue && normalizeComparable(caseValue) !== normalizeComparable(documentValue)) {
      consistencyFindings.push({
        field,
        kind: "case_document_conflict",
        values: [caseValue, documentValue],
        message: `${field} conflicts with the confirmed Trade Case value.`,
      });
    }
  }
  const authorityEvidenceObservations = input.documents
    .filter((document) => document.documentType === "authority_acknowledgement")
    .map((document) => ({
      fileName: document.fileName,
      statement: "An authority document was uploaded, but live filing, certificate, payment, acceptance and release status were not checked.",
    }));
  let status:
    | "Needs information"
    | "Requirements identified"
    | "Documents required"
    | "Uploads checked"
    | "Document Package Ready for Submission Within Verified Scope";
  if (missingInformation.length > 0) status = "Needs information";
  else if (input.documents.length === 0) status = "Documents required";
  else if (missingDocuments.length > 0 || visibleContentFindings.length > 0 || consistencyFindings.length > 0) status = "Uploads checked";
  else status = "Document Package Ready for Submission Within Verified Scope";

  return {
    status,
    requirements: INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS,
    missingInformation,
    missingDocuments,
    visibleContentFindings,
    consistencyFindings,
    authorityEvidenceObservations,
    authenticityStatus: "unverified" as const,
    filingStatus: authorityEvidenceObservations.length > 0 ? "not_verified_from_upload" as const : "not_filed" as const,
    acceptanceStatus: "unverified" as const,
    clearanceStatus: "unverified" as const,
    portalBoundary: "Protected portal integration is not required for preparation. ICEGATE, China Single Window, licence, certificate, payment, acceptance and release status require authority evidence.",
  };
}
