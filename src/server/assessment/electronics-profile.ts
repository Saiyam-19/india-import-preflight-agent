import {
  CHARACTERISTIC_CATALOG,
  normalizeCharacteristicValue,
  type CharacteristicId,
  type ElectronicsProfile,
  type RegulatoryCharacteristic,
} from "../knowledge/electronics-domain";

type ConfirmedFact = { name: string; value: string };

type ProfileDocument = {
  id: string;
  documentType: string;
  facts: Array<{
    field?: string;
    current?: { reviewStatus?: string; value?: string };
  }>;
};

export type ProfileClassificationCandidate = ElectronicsProfile["classificationCandidates"][number];

const BOOLEAN_TRUE = new Set(["true", "yes", "present"]);
const BOOLEAN_FALSE = new Set(["false", "no", "absent"]);

const NEXT_LABEL = [
  "quantity", "unit price", "price per (?:unit|piece|pc)", "origin(?: location)?", "destination(?: location)?",
  "(?:product )?model", "principal function", "(?:technical )?specifications?", "product URL", "incoterm",
  "freight", "insurance", "product form", "product condition", "retail prepackaged", "radio transmitter",
  "radio frequency", "transmit power", "public network connection", "telecom interface", "battery present",
  "battery chemistry", "battery capacity", "battery voltage", "external power supply", "input voltage",
  "rated output", "camera present", "encryption present", "controlled or dual use", "ITC(?:[- ]?HS)? code",
  "BIS entry", "TEC entry", "WPC entry",
].join("|");

function capture(text: string, label: string) {
  return text.match(new RegExp(
    `(?:^|[;,\\n]\\s*|[.!?]\\s+)${label}\\s*(?:is\\s+|are\\s+|[:=-]\\s*)?(.+?)(?=;|\\n|,\\s*(?:${NEXT_LABEL})\\s*(?:is\\s+|are\\s+|[:=-])|(?<!\\d)[.!?](?:\\s+[A-Z]|\\s*$)|$)`,
    "i",
  ))?.[1]?.trim().replace(/[.!?]+$/, "").trim();
}

function setFact(facts: Map<string, string>, name: string, value: string | undefined) {
  const trimmed = value?.trim();
  if (trimmed) facts.set(name, trimmed);
}

function proseValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const value = text.match(pattern)?.[1]?.trim().replace(/[.!?]+$/, "").trim();
    if (value) return value;
  }
  return undefined;
}

function explicitBoolean(text: string, patterns: Array<{ pattern: RegExp; value: "yes" | "no" }>) {
  return patterns.find(({ pattern }) => pattern.test(text))?.value;
}

const PROSE_FIELDS: Array<{ name: string; patterns: RegExp[] }> = [
  {
    name: "origin_location",
    patterns: [
      /\b(?:supplier|seller|shipper)\s+(?:is|are|ships?)\s+(?:from\s+)?(?:in|at|from)\s+([^.;,]+?\b\d{4,6})\b/i,
      /\b(?:origin|ships? from|shipping from)\s*(?:is|:|-)?\s*([^.;,]+?\b\d{4,6})\b/i,
    ],
  },
  {
    name: "destination_location",
    patterns: [
      /\b(?:delivery|destination)\s+(?:is|will be|goes?)?\s*(?:to|in|at|:|-)?\s*([^.;,]+?\b\d{4,6})\b/i,
      /\b(?:deliver(?:ed|y)?|shipping|ships?)\s+to\s+([^.;,]+?\b\d{4,6})\b/i,
    ],
  },
  {
    name: "product_model",
    patterns: [
      /\b(?:it\s+is|this\s+is|the\s+product\s+is)\s+(?:the\s+)?model\s+([A-Za-z0-9][A-Za-z0-9._/-]*)(?=\s+and\b|[.;,]|$)/i,
      /\b(?:product\s+)?model\s*(?:is|:|=|-)?\s*([A-Za-z0-9][A-Za-z0-9._/-]*)(?=\s+and\b|[.;,]|$)/i,
    ],
  },
  {
    name: "principal_function",
    patterns: [
      /\b(?:its|the)\s+(?:job|principal function)\s+is\s+([^.;]+?)(?=\s+and\s+(?:the|it|its)\b|[.;]|$)/i,
      /\b(?:used|designed)\s+(?:to|for)\s+([^.;]+?)(?=\s+and\s+(?:the|it|its)\b|[.;]|$)/i,
    ],
  },
  {
    name: "technical_specifications",
    patterns: [
      /\b(?:the\s+)?datasheet\s+(?:says|states|specifies|lists)\s+([^.;]+)/i,
      /\b(?:technical\s+)?specifications?\s*(?:are|is|:|=|-)?\s*([^.;]+)/i,
    ],
  },
];

const BOOLEAN_PROSE_FIELDS: Array<{
  name: CharacteristicId;
  patterns: Array<{ pattern: RegExp; value: "yes" | "no" }>;
}> = [
  { name: "radio.transmitter_present", patterns: [
    { pattern: /\b(?:has|with|includes?)\s+(?:a\s+)?radio transmitter\b/i, value: "yes" },
    { pattern: /\b(?:has|with|includes?|there is)\s+no\s+radio transmitter\b|\bwithout\s+(?:a\s+)?radio transmitter\b/i, value: "no" },
  ] },
  { name: "battery.present", patterns: [
    { pattern: /\b(?:has|with|includes?)\s+(?:a\s+)?battery\b/i, value: "yes" },
    { pattern: /\b(?:has|with|includes?|there is)\s+no\s+battery\b|\bwithout\s+(?:a\s+)?battery\b|\bno\s+radio transmitter\s+or\s+battery\b/i, value: "no" },
  ] },
  { name: "camera.present", patterns: [
    { pattern: /\b(?:has|with|includes?)\s+(?:a\s+)?camera\b/i, value: "yes" },
    { pattern: /\b(?:has|with|includes?|there is)\s+no\s+camera\b|\bwithout\s+(?:a\s+)?camera\b/i, value: "no" },
  ] },
  { name: "encryption.present", patterns: [
    { pattern: /\b(?:has|uses?|with|includes?)\s+encryption\b/i, value: "yes" },
    { pattern: /\b(?:has|uses?|with|includes?)\s+no\s+encryption\b|\bwithout\s+encryption\b/i, value: "no" },
  ] },
  { name: "packaging.retail_prepackaged", patterns: [
    { pattern: /\b(?:comes?|is|are)\s+(?:in\s+)?retail(?:er)?[ -]packag(?:ed|ing)\b/i, value: "yes" },
    { pattern: /\bnot\s+retail(?:er)?[ -]packag(?:ed|ing)\b|\bwithout\s+retail(?:er)?[ -]packaging\b/i, value: "no" },
  ] },
  { name: "end_use.controlled_or_dual_use", patterns: [
    { pattern: /\b(?:is|are)\s+(?:a\s+)?controlled or dual[ -]use\b/i, value: "yes" },
    { pattern: /\b(?:is|are)\s+not\s+controlled or dual[ -]use\b/i, value: "no" },
  ] },
];

/** Extracts only values the user states explicitly; it never infers traits from a product name. */
export function extractConfirmedElectronicsFacts(text: string): ConfirmedFact[] {
  const facts = new Map<string, string>();
  const normalized = text.replaceAll(/[–—]/g, "-");
  if (/\b(?:already\s+)?(?:purchased|bought|ordered)\b|\bpost[- ]purchase\b/i.test(normalized)) {
    facts.set("purchase_stage", "already_purchased");
  } else if (/\b(?:before ordering|before purchase|considering|pre[- ]purchase)\b/i.test(normalized)) {
    facts.set("purchase_stage", "pre_purchase");
  }
  if (/\bheld by (?:Indian )?customs\b/i.test(normalized)) facts.set("shipment_stage", "held_by_customs");
  else if (/\b(?:has )?arrived\b|\bat (?:the )?(?:port|airport)\b/i.test(normalized)) facts.set("shipment_stage", "arrived");
  else if (/\bin transit\b/i.test(normalized)) facts.set("shipment_stage", "in_transit");
  else if (/\bpaid(?: for)?(?:,? but)? not (?:yet )?dispatched\b|\bnot (?:yet )?(?:dispatched|shipped)\b/i.test(normalized)) facts.set("shipment_stage", "paid_not_dispatched");
  else if (/\b(?:has been |already )?dispatched\b|\bshipped\b/i.test(normalized)) facts.set("shipment_stage", "dispatched");
  if (/\bpersonal (?:use|import|purpose)\b/i.test(normalized)) facts.set("import_purpose", "personal");
  if (/\bcommercial (?:use|import|purpose|resale)\b|\bfor (?:my|our|the) business\b|\bfor resale\b/i.test(normalized)) facts.set("import_purpose", "commercial");
  if (/\b(?:invoice|bill|proof(?: of purchase)?)\s+(?:is\s+)?(?:unavailable|not available)\b|\b(?:seller|supplier)\s+has\s+not\s+issued\s+(?:(?:the\s+)?(?:invoice|bill|proof)|it)\b|\bI\s+do\s+not\s+have\s+(?:the\s+)?(?:invoice|bill|proof(?: of purchase)?)\s+yet\b/i.test(normalized)) {
    facts.set("purchase_evidence_availability", "unavailable");
  } else if (/\b(?:invoice|bill|proof(?: of purchase)?)\s+(?:is\s+)?available\b|\bI\s+have\s+(?:the\s+)?(?:invoice|bill|proof(?: of purchase)?)\b/i.test(normalized)) {
    facts.set("purchase_evidence_availability", "available");
  }

  const quantity = capture(normalized, "quantity")
    ?? normalized.match(/\b(?:purchased|bought|ordering|order)\s+(\d+(?:\.\d+)?)\s+(?:units?|pieces?|pcs?)\b/i)?.[1]
    ?? normalized.match(/\b(?:purchased|bought|ordering|order)\s+(\d+(?:\.\d+)?)\s+[A-Za-z][A-Za-z0-9_-]*\b/i)?.[1]
    ?? normalized.match(/\b(\d+(?:\.\d+)?)\s+(?:units?|pieces?|pcs?)\s+(?:at|for)\b/i)?.[1];
  setFact(facts, "quantity", quantity);

  const price = normalized.match(/\b(USD|INR|CNY|EUR|GBP)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:each|per\s+(?:unit|piece|pc))\b/i)
    ?? normalized.match(/\b(?:unit price|price per (?:unit|piece|pc))\s*(?:is\s+|to\s+|[:=-]\s*)?(USD|INR|CNY|EUR|GBP)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (price) {
    facts.set("currency", price[1]!.toUpperCase());
    facts.set("unit_price", price[2]!);
  }

  setFact(facts, "origin_location", capture(normalized, "origin(?: location)?"));
  setFact(facts, "destination_location", capture(normalized, "destination(?: location)?"));
  setFact(facts, "product_model", capture(normalized, "(?:product )?model"));
  setFact(facts, "principal_function", capture(normalized, "principal function"));
  setFact(facts, "technical_specifications", capture(normalized, "(?:technical )?specifications?"));
  setFact(facts, "incoterm", capture(normalized, "incoterm"));
  const productUrl = capture(normalized, "product URL")
    ?? normalized.match(/https:\/\/[^\s;]+/i)?.[0];
  setFact(facts, "product_url", productUrl);

  for (const field of PROSE_FIELDS) {
    if (!facts.has(field.name)) setFact(facts, field.name, proseValue(normalized, field.patterns));
  }

  for (const [name, label] of [
    ["freight", "freight"],
    ["insurance", "insurance"],
  ] as const) {
    const amount = capture(normalized, label)?.match(/(?:USD|INR|CNY|EUR|GBP)?\s*([0-9]+(?:\.[0-9]+)?)/i)?.[1];
    setFact(facts, name, amount);
  }

  const explicitTraits: Array<[CharacteristicId, string]> = [
    ["product.form", "product form"],
    ["product.condition", "product condition"],
    ["packaging.retail_prepackaged", "retail prepackaged"],
    ["radio.transmitter_present", "radio transmitter"],
    ["radio.frequency_hz", "radio frequency"],
    ["radio.transmit_power_w", "transmit power"],
    ["telecom.public_network_connection", "public network connection"],
    ["telecom.interface", "telecom interface"],
    ["battery.present", "battery present"],
    ["battery.chemistry", "battery chemistry"],
    ["battery.capacity_ah", "battery capacity"],
    ["battery.voltage_v", "battery voltage"],
    ["power.external_supply_present", "external power supply"],
    ["power.input_voltage_v", "input voltage"],
    ["power.rated_output_w", "rated output"],
    ["camera.present", "camera present"],
    ["encryption.present", "encryption present"],
    ["end_use.controlled_or_dual_use", "controlled or dual use"],
    ["classification.itc_hs", "ITC(?:[- ]?HS)? code"],
    ["classification.bis_entry", "BIS entry"],
    ["classification.tec_entry", "TEC entry"],
    ["classification.wpc_entry", "WPC entry"],
  ];
  for (const [id, label] of explicitTraits) setFact(facts, id, capture(normalized, label));
  for (const field of BOOLEAN_PROSE_FIELDS) {
    if (!facts.has(field.name)) setFact(facts, field.name, explicitBoolean(normalized, field.patterns));
  }

  if (!facts.has("incoterm")) {
    setFact(facts, "incoterm", normalized.match(/\b(?:shipping|shipment|terms?)\s+(?:is|are|uses?)\s+(EXW|FCA|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP)\b/i)?.[1]?.toUpperCase());
  }
  for (const [name, label] of [["freight", "freight"], ["insurance", "insurance"]] as const) {
    if (facts.has(name)) continue;
    const amount = normalized.match(new RegExp(`\\b(?:USD|INR|CNY|EUR|GBP)\\s*([0-9]+(?:\\.[0-9]+)?)\\s+${label}\\b`, "i"))?.[1];
    setFact(facts, name, amount);
  }
  return [...facts].map(([name, value]) => ({ name, value }));
}

function namespaceFor(id: CharacteristicId): RegulatoryCharacteristic["namespace"] {
  const prefix = id.split(".")[0]!;
  if (prefix === "purchase" || prefix === "import") return "product";
  return prefix as RegulatoryCharacteristic["namespace"];
}

function parseCharacteristic(id: CharacteristicId, raw: string) {
  const definition = CHARACTERISTIC_CATALOG[id];
  const normalized = raw.trim().toLowerCase().replaceAll(/[ -]+/g, "_");
  if (definition.type === "boolean") {
    if (BOOLEAN_TRUE.has(normalized)) return { value: true as const };
    if (BOOLEAN_FALSE.has(normalized)) return { value: false as const };
    throw new Error(`${id} requires an explicit yes/no value.`);
  }
  if (definition.type === "number") {
    const match = raw.trim().match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*([a-zA-Z]+)$/);
    if (!match) throw new Error(`${id} requires a decimal value and unit.`);
    return normalizeCharacteristicValue(match[1]!, match[2]!);
  }
  if (definition.type === "digit_string") {
    if (!/^\d+$/.test(raw.trim())) throw new Error(`${id} requires a digit string.`);
    return { value: raw.trim() };
  }
  if (definition.type === "enum") {
    if (!definition.values.includes(normalized as never)) throw new Error(`${id} uses a non-canonical value.`);
    return { value: normalized };
  }
  if (!raw.trim()) throw new Error(`${id} cannot be empty.`);
  return { value: raw.trim() };
}

function confirmedDocumentFields(documents: ProfileDocument[]) {
  const fields = new Map<string, string>();
  for (const document of documents) {
    for (const fact of document.facts) {
      if (fact.field && fact.current?.value && ["confirmed", "corrected"].includes(fact.current.reviewStatus ?? "")) {
        fields.set(fact.field, fact.current.value);
      }
    }
  }
  return fields;
}

function dedupeCandidates(candidates: ProfileClassificationCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.system}:${candidate.codeOrEntry}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildElectronicsProfile(input: {
  confirmedFacts: ConfirmedFact[];
  documents: ProfileDocument[];
  classificationCandidates?: ProfileClassificationCandidate[];
  resolveClassificationProvenance?: (candidate: Required<Pick<ProfileClassificationCandidate, "claimId" | "sourceVersionId" | "exactLocator">>) => boolean;
}): ElectronicsProfile {
  const factMap = new Map(input.confirmedFacts.map((fact) => [fact.name, fact.value]));
  const documentFields = confirmedDocumentFields(input.documents);
  const value = (...names: string[]) => names.map((name) => factMap.get(name) ?? documentFields.get(name)).find(Boolean);
  const purchaseStage = value("purchase_stage") as ElectronicsProfile["intake"]["purchaseStage"];
  const purchaseEvidenceAvailability = value("purchase_evidence_availability") as ElectronicsProfile["intake"]["purchaseEvidenceAvailability"];
  const shipmentStage = value("shipment_stage") as ElectronicsProfile["intake"]["shipmentStage"];
  const purpose = value("import_purpose") as ElectronicsProfile["intake"]["purpose"];
  const productDescription = value("product_description", "productDescription") ?? "Unspecified electronics product";
  const principalFunction = value("principal_function", "endUse");
  const quantity = value("quantity");
  const unitPrice = value("unit_price", "itemValueInr");
  const currency = value("currency") ?? (value("itemValueInr") ? "INR" : undefined);
  const originLocation = value("origin_location", "exportPort");
  const destinationLocation = value("destination_location", "importPort");
  const productUrl = value("product_url");
  const productModel = value("product_model", "exact_product_identity", "modelIdentity");
  const technicalSpecifications = value("technical_specifications");
  const freight = value("freight", "freightInr");
  const insurance = value("insurance", "insuranceInr");
  const incoterm = value("incoterm");
  const intake: ElectronicsProfile["intake"] = {
    direction: "china_to_india",
    productDescription,
    purchaseEvidenceDocumentIds: purchaseStage === "already_purchased"
      ? input.documents.filter((document) => document.documentType === "commercial_invoice").map((document) => document.id)
      : [],
    ...(principalFunction ? { principalFunction } : {}),
    ...(quantity ? { quantity } : {}),
    ...(unitPrice ? { unitPrice } : {}),
    ...(currency ? { currency } : {}),
    ...(originLocation ? { originLocation } : {}),
    ...(destinationLocation ? { destinationLocation } : {}),
    ...(productUrl ? { productUrl } : {}),
    ...(productModel ? { productModel } : {}),
    ...(technicalSpecifications ? { technicalSpecifications } : {}),
    ...(purchaseStage ? { purchaseStage } : {}),
    ...(purchaseEvidenceAvailability ? { purchaseEvidenceAvailability } : {}),
    ...(shipmentStage ? { shipmentStage } : {}),
    ...(purpose ? { purpose } : {}),
    ...(freight ? { freight } : {}),
    ...(insurance ? { insurance } : {}),
    ...(incoterm ? { incoterm } : {}),
  };

  const characteristicFacts = new Map<CharacteristicId, { raw: string; provenance: "user" | "document" | "derived" }>();
  for (const id of Object.keys(CHARACTERISTIC_CATALOG) as CharacteristicId[]) {
    const raw = factMap.get(id);
    if (raw) characteristicFacts.set(id, { raw, provenance: "user" });
  }
  if (purchaseStage) characteristicFacts.set("purchase.stage", { raw: purchaseStage, provenance: "derived" });
  if (purpose) characteristicFacts.set("import.purpose", { raw: purpose, provenance: "derived" });
  const documentClassification = documentFields.get("indiaTariffCode");
  if (documentClassification && !characteristicFacts.has("classification.itc_hs")) {
    characteristicFacts.set("classification.itc_hs", { raw: documentClassification, provenance: "document" });
  }

  const characteristics = (Object.keys(CHARACTERISTIC_CATALOG) as CharacteristicId[]).map((id) => {
    const explicit = characteristicFacts.get(id);
    if (!explicit) return {
      id,
      namespace: namespaceFor(id),
      value: "unknown" as const,
      basis: "Not confirmed for this Trade Case.",
      provenance: "derived" as const,
      confirmed: false,
    };
    const parsed = parseCharacteristic(id, explicit.raw);
    return {
      id,
      namespace: namespaceFor(id),
      ...parsed,
      basis: explicit.provenance === "document" ? "Confirmed visible document fact." : "Explicitly confirmed case fact.",
      provenance: explicit.provenance,
      confirmed: true,
    };
  });

  const factCandidates: ProfileClassificationCandidate[] = [
    ["classification.itc_hs", "ITC_HS"],
    ["classification.bis_entry", "BIS_CRS"],
    ["classification.tec_entry", "TEC_MTCTE"],
    ["classification.wpc_entry", "WPC_ETA"],
  ].flatMap(([id, system]) => {
    const entry = characteristicFacts.get(id as CharacteristicId)?.raw;
    return entry ? [{ system: system as ProfileClassificationCandidate["system"], codeOrEntry: entry, evidenceState: "pending" as const, missingThresholdFacts: [] }] : [];
  });
  const classificationCandidates = dedupeCandidates([...(input.classificationCandidates ?? []), ...factCandidates]).map((candidate) => {
    const complete = Boolean(candidate.claimId && candidate.sourceVersionId && candidate.exactLocator);
    let resolved = false;
    if (candidate.evidenceState === "admitted" && complete && input.resolveClassificationProvenance) {
      try {
        resolved = input.resolveClassificationProvenance({
          claimId: candidate.claimId!,
          sourceVersionId: candidate.sourceVersionId!,
          exactLocator: candidate.exactLocator!,
        });
      } catch {
        resolved = false;
      }
    }
    return { ...candidate, evidenceState: resolved ? "admitted" as const : "pending" as const };
  });

  const found = (id: CharacteristicId) => characteristics.find((item) => item.id === id);
  const confirmedTrue = (id: CharacteristicId) => found(id)?.confirmed && found(id)?.value === true;
  const unresolvedCharacteristicQuestions: string[] = [];
  if (!found("product.form")?.confirmed || !found("product.condition")?.confirmed) {
    unresolvedCharacteristicQuestions.push("Confirm the product form (finished product/component/part/accessory) and whether it is new, used, or refurbished.");
  }
  if (!found("radio.transmitter_present")?.confirmed) {
    unresolvedCharacteristicQuestions.push("Confirm whether a radio transmitter is present; if yes, provide every frequency band and maximum transmit power.");
  } else if (confirmedTrue("radio.transmitter_present") && (!found("radio.frequency_hz")?.confirmed || !found("radio.transmit_power_w")?.confirmed)) {
    unresolvedCharacteristicQuestions.push("Provide the confirmed radio frequency and maximum transmit power with units.");
  }
  if (!found("telecom.public_network_connection")?.confirmed || !found("telecom.interface")?.confirmed) {
    unresolvedCharacteristicQuestions.push("Confirm public telecom-network connectivity and the interface type (none/IP/cellular/PSTN/satellite/multiple).");
  }
  if (!found("battery.present")?.confirmed) {
    unresolvedCharacteristicQuestions.push("Confirm whether a battery is present; if yes, provide chemistry, capacity, and voltage with units.");
  } else if (confirmedTrue("battery.present") && ["battery.chemistry", "battery.capacity_ah", "battery.voltage_v"].some((id) => !found(id as CharacteristicId)?.confirmed)) {
    unresolvedCharacteristicQuestions.push("Provide the confirmed battery chemistry, capacity, and voltage with units.");
  }
  if (!found("power.external_supply_present")?.confirmed) {
    unresolvedCharacteristicQuestions.push("Confirm whether an external power supply is included; if yes, provide rated input voltage and output power with units.");
  }
  if (["camera.present", "encryption.present", "packaging.retail_prepackaged", "end_use.controlled_or_dual_use"].some((id) => !found(id as CharacteristicId)?.confirmed)) {
    unresolvedCharacteristicQuestions.push("Confirm camera/video, encryption, retail packaging, and controlled or dual-use characteristics.");
  }

  return { intake, characteristics, classificationCandidates, unresolvedCharacteristicQuestions };
}

export function groupedElectronicsIntake(profile: ElectronicsProfile) {
  const missing: string[] = [];
  const recoveryActions: string[] = [];
  const journeyStage = profile.intake.purchaseStage === "already_purchased"
    ? "post_purchase_remediation" as const
    : "intake" as const;
  if (profile.intake.purchaseStage === "already_purchased") {
    if (profile.intake.purchaseEvidenceDocumentIds.length === 0 && profile.intake.purchaseEvidenceAvailability !== "unavailable") {
      missing.push("Invoice, bill, or proof-of-purchase document, or confirm that it is not currently available.");
    }
    if (profile.intake.purchaseEvidenceDocumentIds.length === 0 && profile.intake.purchaseEvidenceAvailability === "unavailable") {
      recoveryActions.push("Obtain the Commercial Invoice cum Packing List from the supplier before Customs filing.");
    }
    if (!profile.intake.shipmentStage) missing.push("Current shipment status: paid but not dispatched, dispatched, in transit, arrived, or held by Customs.");
  }
  if (!profile.intake.principalFunction) missing.push("Product description and principal function.");
  if (!profile.intake.quantity) missing.push("Quantity.");
  if (!profile.intake.unitPrice || !profile.intake.currency) missing.push("Unit price and currency.");
  if (!profile.intake.originLocation || !profile.intake.destinationLocation) missing.push("Origin and destination PIN/port.");
  if (!profile.intake.productUrl && !profile.intake.productModel && !profile.intake.technicalSpecifications) missing.push("Product URL, photo, model, datasheet, or technical specifications.");
  if (!profile.intake.purchaseStage) missing.push("Whether it is pre-purchase or already purchased.");
  if (!profile.intake.purpose) missing.push("Personal or commercial purpose.");
  if (missing.length > 0) {
    const dossierPromise = [
      "I’ll then return one action dossier containing:",
      "1. Documents to prepare",
      "2. Classification and regulatory checks",
      "3. Exact policy paragraphs and page numbers",
      "4. Verified online forms",
      "5. Relevant points of contact",
      "6. Duties, costs, blockers and responsible owner",
      "7. Government submission portals: verified link to the exact service/page, documents uploaded there, who must file, login requirements, fees/deadlines, and submission sequence.",
      "If already purchased, I’ll switch from pre-order guidance to clearance/remediation guidance.",
      "If filing is offline, broker-only, login-protected, unavailable online, or not admitted, I’ll state that clearly. I’ll never invent a portal or claim anything was submitted.",
    ].join("\n");
    const intakeRequest = [
      `I understand you want to import ${profile.intake.productDescription ?? "this product"} from China to India. To prepare the exact action plan, please provide:`,
      "- Quantity, unit price and currency",
      "- Origin and destination PIN/port",
      "- Product URL, photo, model or datasheet",
      "- Whether it is already purchased",
      "- Invoice, bill or proof of purchase, if available",
      "- Commercial or personal purpose",
      "To complete classification and costs, I may also ask for the principal function, technical specifications, freight, insurance and Incoterm.",
    ].join("\n");
    return {
      journeyStage,
      missing,
      nextActions: [...recoveryActions, ...missing],
      question: journeyStage === "post_purchase_remediation"
        ? `Please provide the remaining purchased-shipment items: ${missing.join(" ")}\n${dossierPromise}`
        : `${intakeRequest}\n${dossierPromise}`,
    };
  }
  return {
    journeyStage: profile.intake.purchaseStage === "pre_purchase" ? "pre_purchase_research" as const : journeyStage,
    missing: profile.unresolvedCharacteristicQuestions,
    nextActions: [...recoveryActions, ...profile.unresolvedCharacteristicQuestions],
    question: profile.unresolvedCharacteristicQuestions.length > 0
      ? `Please confirm these technical groups together: ${profile.unresolvedCharacteristicQuestions.join(" ")}`
      : "The confirmed intake and characteristic profile is ready for evidence-bound dossier evaluation.",
  };
}
