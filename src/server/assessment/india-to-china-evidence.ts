import type { EvidenceState } from "@/server/assessment/india-import-assessment";

export interface IndiaToChinaSource {
  admissionState: "admitted";
  authority: string;
  authoritativeText: {
    kind: "Authoritative Text";
    language: "en" | "zh-CN";
    text: string;
  };
  effectiveFrom: string;
  id: string;
  instrumentId: string;
  lastChecked: string;
  locator: string;
  reviewAfter: string;
  sha256: string;
  snapshotPath: string;
  title: string;
  translation?: {
    kind: "Official Translation" | "Derived Translation";
    language: "en";
    materialAmbiguity: string | null;
    reviewedAt: string;
    text: string;
  };
  url: string;
}

const CHECKED_AT = "2026-08-25";
const REVIEW_AFTER = "2026-12-31";

export const INDIA_TO_CHINA_SOURCES: IndiaToChinaSource[] = [
  {
    id: "dgft-ftp-2023-export-documents",
    authority: "Directorate General of Foreign Trade (DGFT)",
    title: "Foreign Trade Policy 2023 — Chapter 2",
    instrumentId: "Notification No. 1/2023",
    url: "https://content.dgft.gov.in/Website/dgftprod/61d61bc2-272e-4880-b96c-c8f685a3b244/Foreign%20Trade%20Policy%202023.pdf",
    effectiveFrom: "2023-04-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "f16265d88b82a6ce9f4a8436216e0b237953b587f723236a367960388d41edac",
    snapshotPath: "evidence/official/dgft-ftp-2023-chapter-2.pdf",
    admissionState: "admitted",
    locator: "Chapter 2, paragraphs 2.05(a)–(c) and 2.06(a)–(d), PDF page 25",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "en",
      text: "An IEC is mandatory for export from India subject to stated exemptions. Baseline goods documents include the transport document, commercial invoice-cum-packing list, and shipping bill or bill of export, while product authorities may require additional documents.",
    },
  },
  {
    id: "dgft-schedule-ii-hosting-2025",
    authority: "Directorate General of Foreign Trade (DGFT)",
    title: "Notification No. 50/2024-25 — ITC(HS) Schedule II hosted on the DGFT website",
    instrumentId: "Notification No. 50/2024-25",
    url: "https://content.dgft.gov.in/Website/Notification_ITCHS.pdf",
    effectiveFrom: "2025-01-13",
    lastChecked: CHECKED_AT,
    reviewAfter: "2026-09-30",
    sha256: "631d57f301fbb284439295e7c5eb41c98db7873ea84fdfe908f09e1894aeecb9",
    snapshotPath: "evidence/official/dgft-schedule-ii-hosting-notification-2025.pdf",
    admissionState: "admitted",
    locator: "Notification operative paragraph and Schedule II hosting direction",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "en",
      text: "The export-policy Schedule II is maintained on the DGFT website and the effective case row must be checked for the exact ITC(HS) code and date.",
    },
  },
  {
    id: "dgft-scomet-list-2025",
    authority: "Directorate General of Foreign Trade (DGFT)",
    title: "Updated SCOMET List 2025",
    instrumentId: "Notification No. 31/2025-26 and consolidated Appendix 3 to Schedule II",
    url: "https://content.dgft.gov.in/Website/dgftprod/82cccea3-646e-435c-876f-88476c4ed5ca/Updated%20SCOMET%20List%202025%20%28as%20on%2023.09.2025%29.docx.pdf",
    effectiveFrom: "2025-10-23",
    lastChecked: CHECKED_AT,
    reviewAfter: "2026-09-23",
    sha256: "6e43cbfd99440f0b29e67eecef014c7fb2a0deb297c1997106bebd83fb199b43",
    snapshotPath: "evidence/official/dgft-scomet-list-2025.pdf",
    admissionState: "admitted",
    locator: "Complete consolidated list; Category 5 information-security entries and router/switch/gateway notes around PDF page 305",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "en",
      text: "SCOMET applicability depends on the exact controlled entry, technical parameters, software and technology, parties, end user and end use. Router-related notes do not replace a parameter-level case screen.",
    },
  },
  {
    id: "dgft-ecoo-migration-2024",
    authority: "Directorate General of Foreign Trade (DGFT)",
    title: "Migration of e-CoO to the new platform",
    instrumentId: "Trade Notice No. 13/2024-25",
    url: "https://content.dgft.gov.in/Website/dgftprod/6737c077-e988-47df-9b94-adae38dcaefb/Trade%20Notice%20-%20eCoO%20Migration%20to%20new%20Platform-reg..pdf",
    effectiveFrom: "2025-01-17",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "31bb580a80d94062f3fc70ac39ffc46b4eaeb5ff435dbb6dfca3de1ece498fbf",
    snapshotPath: "evidence/official/dgft-ecoo-migration-2024.pdf",
    admissionState: "admitted",
    locator: "Migration timetable and preferential certificate-of-origin application direction",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "en",
      text: "Preferential certificate-of-origin applications migrated to the e-CoO 2.0 platform. Platform migration does not establish product eligibility, origin qualification, issuance, validity or direct transport.",
    },
  },
  {
    id: "gacc-order-277-import-declaration",
    authority: "General Administration of Customs of the People's Republic of China (GACC)",
    title: "中华人民共和国海关进出口货物申报管理规定",
    instrumentId: "海关总署令第277号",
    url: "https://fdi.mofcom.gov.cn/come-falvfagui-con.html?id=11519",
    effectiveFrom: "2025-05-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "f8a4f3dd6bcd7b97a025ee85817286482504fe3327676f1ecf4342904479ec63",
    snapshotPath: "evidence/official/gacc-order-277-declaration.html",
    admissionState: "admitted",
    locator: "Articles 1–2 and 25–28; effective-date clause",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "中华人民共和国海关进出口货物申报管理规定（海关总署令第277号，自2025年5月1日起施行）。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "GACC Order 277 governs declarations for goods imported into and exported from China and took effect on 1 May 2025.",
    },
  },
  {
    id: "mofcom-import-licence-catalogue-2026",
    authority: "MOFCOM and GACC",
    title: "进口许可证管理货物目录（2026年）",
    instrumentId: "商务部 海关总署公告2025年第88号",
    url: "https://xkzj.mofcom.gov.cn/tzgg/art/2026/art_7ad4508a20f04807b4926134a6f9d10c.html",
    effectiveFrom: "2026-01-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "1646806989943ad6c3412d9cd11f8edd40363b70448f7083f3075b58f9d1bc69",
    snapshotPath: "evidence/official/mofcom-import-licence-catalogue-2026.html",
    admissionState: "admitted",
    locator: "Announcement effective clause and attached 2026 catalogue",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "现公布《进口许可证管理货物目录（2026年）》，自2026年1月1日起执行。进口目录所列货物应当依法申请进口许可证。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "The 2026 import-licence catalogue applies from 1 January 2026. Goods listed in it require an import licence; applicability needs an exact catalogue-row match.",
    },
  },
  {
    id: "prc-tariff-schedule-2026",
    authority: "State Council Tariff Commission",
    title: "中华人民共和国进出口税则（2026）",
    instrumentId: "税委会公告2025年第12号",
    url: "https://czj.cq.gov.cn/zwgk_268/zfxxgkml/cszc/202602/t20260213_15444510_wap.html",
    effectiveFrom: "2026-01-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "d725cb7df35275e5739c6e21916e1df39a220b49ef36026a08c9e143cc0545f2",
    snapshotPath: "evidence/official/prc-tariff-schedule-2026-announcement.html",
    admissionState: "admitted",
    locator: "Announcement and official 2026 tariff attachment; exact row remains case-result evidence",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "《中华人民共和国进出口税则（2026）》自2026年1月1日起实施。具体税目、税率和注释应以税则及案件适用结果为准。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "The 2026 tariff applies from 1 January 2026. The exact heading, rate and notes must come from the schedule and the case-applicable authority result.",
    },
  },
  {
    id: "prc-tariff-law-2024",
    authority: "National People's Congress / State Taxation Administration",
    title: "中华人民共和国关税法",
    instrumentId: "中华人民共和国主席令第二十三号",
    url: "https://fgk.chinatax.gov.cn/zcfgk/c100009/c5234556/content.html",
    effectiveFrom: "2024-12-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "4d13dd290ca75060d04c2014cfa15841e22e95402c3f7171eb79df119c91265b",
    snapshotPath: "evidence/official/prc-tariff-law-2024.html",
    admissionState: "admitted",
    locator: "Articles 4, 9–16, 20 and 23–31",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "进口货物的关税，以从价计征、从量计征或者国家规定的其他方式计征。完税价格、原产地和适用税率应当依法确定。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Import duty is assessed by ad valorem, specific or other prescribed methods. Customs value, origin and the applicable tariff rate must be determined under the law.",
    },
  },
  {
    id: "prc-vat-law-2024",
    authority: "National People's Congress / State Taxation Administration",
    title: "中华人民共和国增值税法",
    instrumentId: "中华人民共和国主席令第四十一号",
    url: "https://shanghai.chinatax.gov.cn/sjtax/ztzl/yshj/ldjj/202412/t474700.html",
    effectiveFrom: "2026-01-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "805c8b7a0e368aa445855e2400b14b9a967a88f851daea23eef38a01791149e5",
    snapshotPath: "evidence/official/prc-vat-law-2024.html",
    admissionState: "admitted",
    locator: "Articles 3, 10 and 14; effective-date clause",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "进口货物，应当依照本法规定缴纳增值税。进口货物的计税价格为关税完税价格加关税和消费税。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Imported goods are subject to VAT. The import VAT base is Customs value plus Customs duty and consumption tax.",
    },
  },
  {
    id: "prc-vat-implementation-2026",
    authority: "State Council / State Taxation Administration",
    title: "中华人民共和国增值税法实施条例",
    instrumentId: "国务院令第826号",
    url: "https://shanghai.chinatax.gov.cn/zcfw/zcfgk/zzs/202601/t478908.html",
    effectiveFrom: "2026-01-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "d7af655c94b93b857b750595f2ef542f2c20613e175481ae92f78f0efa5a0f9d",
    snapshotPath: "evidence/official/prc-vat-implementation-2026.html",
    admissionState: "admitted",
    locator: "Import-related definitions, taxable amount and effective-date provisions",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "进口货物增值税的计税价格和应纳税额，依照增值税法和本条例的有关规定计算。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Import VAT taxable value and tax payable are calculated under the VAT Law and its implementation regulation.",
    },
  },
  {
    id: "cnca-ccc-scope-2023",
    authority: "Certification and Accreditation Administration of China (CNCA) / SAMR",
    title: "强制性产品认证目录描述与界定表",
    instrumentId: "市场监管总局公告2023年第36号",
    url: "https://www.cnca.gov.cn/zwxx/gg/zjgg/art/2023/art_31ce43f5837d408cb2023ec693615ada.html",
    effectiveFrom: "2023-08-10",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "872b065b41249af3c2b37f7ddcb54be10d2b0d29ece5e6c5c5babdf5f55a73d9",
    snapshotPath: "evidence/official/cnca-ccc-scope-2023.html",
    admissionState: "admitted",
    locator: "Catalogue description and scope table; exact product boundary must be matched",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "列入强制性产品认证目录的产品，应当按照目录描述与界定表和适用认证实施规则确定认证范围。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Products in the compulsory-certification catalogue must be assessed against the catalogue scope description and the applicable implementation rule. Product-name or tariff-code similarity alone is insufficient.",
    },
  },
  {
    id: "cnca-ccc-rules-2026",
    authority: "Certification and Accreditation Administration of China (CNCA)",
    title: "强制性产品认证实施规则",
    instrumentId: "CNCA current implementation-rules index",
    url: "https://www.cnca.gov.cn/hlwfw/ywzl/qzxcprz/ssgz/art/2026/art_5261f654e02d45edaf0805fb268c9fc9.html",
    effectiveFrom: "2026-04-17",
    lastChecked: CHECKED_AT,
    reviewAfter: "2026-10-31",
    sha256: "990b364f4850a3bbddc88e715bd23d7b316aa0703c97a1b77ecac4a5952de622",
    snapshotPath: "evidence/official/cnca-ccc-rules-2026.html",
    admissionState: "admitted",
    locator: "Current implementation-rules summary and update markers",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "强制性产品认证应当适用现行认证实施规则；具体产品范围和证书状态须按产品和型号核验。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "The current implementation rule must be used for compulsory certification, with exact product scope and certificate status checked for the model.",
    },
  },
  {
    id: "miit-network-access-2024",
    authority: "Ministry of Industry and Information Technology (MIIT)",
    title: "电信设备进网管理办法",
    instrumentId: "工业和信息化部令第11号（第68号修改）",
    url: "https://www.miit.gov.cn/zcfg/xxtxl/art/2024/art_773927399a0a4864b47dfab2ba120302.html",
    effectiveFrom: "2024-01-18",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "06b4f124a1b1a7ec3fd615f71e91bb8827e984207bba1b2a0a61d69f8c821a32",
    snapshotPath: "evidence/official/miit-network-access-2024.html",
    admissionState: "admitted",
    locator: "Articles 3 and 8; exact current equipment-catalogue match remains case specific",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "国家对接入公用电信网使用的电信终端设备、无线电通信设备和涉及网间互联的设备实行进网许可制度。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "China applies network-access permission to covered terminal, radio-communications and interconnection equipment used on public telecommunications networks. Exact catalogue applicability is case specific.",
    },
  },
  {
    id: "miit-radio-approval-guide-2020",
    authority: "Ministry of Industry and Information Technology (MIIT)",
    title: "无线电发射设备型号核准办事指南",
    instrumentId: "MIIT radio transmitting equipment type-approval service guide",
    url: "https://ythzxfw.miit.gov.cn/bssx/axy/wxdhwxtx/art/2020/art_e00be70da40a4355afe7b869eba30fdb.html",
    effectiveFrom: "2020-09-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "f1eed268fa244fdebd4d6a28f47e99afa3a58d861fe699f8b800b9ddd206096b",
    snapshotPath: "evidence/official/miit-radio-approval-guide-2020.html",
    admissionState: "admitted",
    locator: "Scope, application materials, process and result fields",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "生产或者进口在国内销售、使用的无线电发射设备，应当按照适用范围办理无线电发射设备型号核准。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Radio transmitting equipment produced or imported for sale or use in China must obtain type approval when within the applicable scope. Exact model approval remains case specific.",
    },
  },
];

export interface IndiaToChinaCoverageEntry {
  authority: string;
  claimSourceId: string;
  connectorId: string;
  connectorIds?: string[];
  coverageState: "full_support";
  domainId: string;
  requiredEvidenceId: string;
  sourceIds: string[];
  whyApplicable: string;
}

export const INDIA_TO_CHINA_COVERAGE_MANIFEST: IndiaToChinaCoverageEntry[] = [
  {
    domainId: "india-exporter-and-customs",
    coverageState: "full_support",
    authority: "DGFT / India Customs",
    connectorId: "india-dgft-publications",
    connectorIds: ["india-dgft-publications", "india-customs-publications"],
    requiredEvidenceId: "india_exporter_iec",
    claimSourceId: "dgft-ftp-2023-export-documents",
    sourceIds: ["dgft-ftp-2023-export-documents"],
    whyApplicable: "An India exporter is preparing goods for export and must retain the applicable IEC and baseline export documents.",
  },
  {
    domainId: "india-export-policy",
    coverageState: "full_support",
    authority: "DGFT",
    connectorId: "india-dgft-publications",
    requiredEvidenceId: "india_schedule_ii_screening",
    claimSourceId: "dgft-schedule-ii-hosting-2025",
    sourceIds: ["dgft-schedule-ii-hosting-2025"],
    whyApplicable: "The exact Indian eight-digit ITC(HS) code and effective-date row must be screened against Schedule II export policy.",
  },
  {
    domainId: "india-scomet-export-control",
    coverageState: "full_support",
    authority: "DGFT SCOMET",
    connectorId: "india-dgft-publications",
    requiredEvidenceId: "india_scomet_screening",
    claimSourceId: "dgft-scomet-list-2025",
    sourceIds: ["dgft-scomet-list-2025"],
    whyApplicable: "The router contains encryption and requires an exact technical, software, party, end-user and end-use SCOMET screen.",
  },
  {
    domainId: "china-customs-import-declaration",
    coverageState: "full_support",
    authority: "GACC / China Customs",
    connectorId: "china-gacc-publications",
    requiredEvidenceId: "china_customs_declaration_pack",
    claimSourceId: "gacc-order-277-import-declaration",
    sourceIds: ["gacc-order-277-import-declaration"],
    whyApplicable: "The goods enter China and require an import declaration and case-specific accompanying documents.",
  },
  {
    domainId: "china-import-licence",
    coverageState: "full_support",
    authority: "MOFCOM / GACC",
    connectorId: "china-mofcom-publications",
    requiredEvidenceId: "china_import_licence_screening",
    claimSourceId: "mofcom-import-licence-catalogue-2026",
    sourceIds: ["mofcom-import-licence-catalogue-2026"],
    whyApplicable: "The exact Chinese commodity code and description must be screened against the effective annual import-licence catalogue.",
  },
  {
    domainId: "china-tariff-and-origin",
    coverageState: "full_support",
    authority: "GACC / State Council Tariff Commission",
    connectorId: "china-tariff-tax-publications",
    requiredEvidenceId: "china_tariff_classification_result",
    claimSourceId: "prc-tariff-law-2024",
    sourceIds: ["prc-tariff-law-2024", "prc-tariff-schedule-2026"],
    whyApplicable: "China Customs must determine the exact tariff classification, origin, Customs value and effective duty row for the imported router.",
  },
  {
    domainId: "china-import-vat",
    coverageState: "full_support",
    authority: "State Taxation Administration / GACC",
    connectorId: "china-tariff-tax-publications",
    requiredEvidenceId: "china_tariff_classification_result",
    claimSourceId: "prc-vat-law-2024",
    sourceIds: ["prc-vat-law-2024", "prc-vat-implementation-2026"],
    whyApplicable: "Imported goods are subject to the confirmed case-applicable VAT rate and statutory import VAT base.",
  },
  {
    domainId: "china-product-market-access",
    coverageState: "full_support",
    authority: "CNCA / MIIT",
    connectorId: "china-product-market-publications",
    requiredEvidenceId: "china_product_market_access_screening",
    claimSourceId: "miit-radio-approval-guide-2020",
    sourceIds: ["cnca-ccc-scope-2023", "cnca-ccc-rules-2026", "miit-network-access-2024", "miit-radio-approval-guide-2020"],
    whyApplicable: "A Wi-Fi router requires exact-model CCC, telecom network-access and radio type-approval trigger and status checks before China market use.",
  },
  {
    domainId: "china-case-party-and-trade-remedy",
    coverageState: "full_support",
    authority: "MOFCOM / GACC",
    connectorId: "china-mofcom-publications",
    requiredEvidenceId: "china_party_end_use_screening",
    claimSourceId: "prc-tariff-law-2024",
    sourceIds: ["prc-tariff-law-2024"],
    whyApplicable: "The exact parties, end user, end use, origin, producer and exporter require current restricted-party and trade-remedy review.",
  },
];

export function indiaToChinaSourceState(
  source: IndiaToChinaSource,
  asOf: string,
  overrides: Partial<Record<string, EvidenceState>> = {},
): EvidenceState {
  if (overrides[source.id]) return overrides[source.id]!;
  if (source.effectiveFrom > asOf) return "not_yet_effective";
  return source.reviewAfter <= asOf ? "stale" : "admitted";
}

export function validateIndiaToChinaTranslations(sources: IndiaToChinaSource[]): string[] {
  return sources.flatMap((source) => {
    if (source.authoritativeText.kind !== "Authoritative Text") {
      return [`Source ${source.id} does not preserve Authoritative Text.`];
    }
    if (source.authoritativeText.language !== "zh-CN") return [];
    if (!source.translation || (source.translation.kind !== "Official Translation" && source.translation.kind !== "Derived Translation")) {
      return [`Source ${source.id} has an unlabelled English translation.`];
    }
    if (source.translation.materialAmbiguity) {
      return [`Source ${source.id} has material translation ambiguity: ${source.translation.materialAmbiguity}`];
    }
    return [];
  });
}
