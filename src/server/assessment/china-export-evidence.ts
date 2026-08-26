import type { ConnectorState, EvidenceState } from "@/server/assessment/india-import-assessment";

export interface ChinaExportSource {
  admissionState: "admitted";
  authority: string;
  authoritativeText: {
    kind: "Authoritative Text";
    language: "zh-CN";
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
  translation: {
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

export const CHINA_EXPORT_SOURCES: ChinaExportSource[] = [
  {
    id: "prc-foreign-trade-law-2025",
    authority: "Ministry of Commerce of the People's Republic of China (MOFCOM)",
    title: "中华人民共和国对外贸易法",
    instrumentId: "中华人民共和国主席令第六十七号",
    url: "https://www.mofcom.gov.cn/zfxxgk/gkml/art/2025/art_fdc193e921ce4a298fe46e85c242b54e.html",
    effectiveFrom: "2026-03-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "81334f4143fb03b025475fc242ab8baf3f908309acf5dc06984202cb7223eadf",
    snapshotPath: "evidence/official/prc-foreign-trade-law-2025.html",
    admissionState: "admitted",
    locator: "Articles 11, 15–25 and 37–40; promulgation paragraph",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "第十一条　本法所称对外贸易经营者，是指依法办理经营主体登记或者其他执业手续，依照本法和其他有关法律、行政法规的规定从事对外贸易活动的个人、组织。第十五条　对外贸易经营者应当按照规定提交与其对外贸易经营活动有关的文件及资料。第二十一条　国家对限制进出口的货物，实行配额、许可证等方式管理。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "A foreign-trade operator is a registered person or organisation conducting foreign trade under law. Operators must submit required trade documents. Restricted goods are administered through quotas, licences, or other specified measures.",
    },
  },
  {
    id: "gacc-order-277-declaration",
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
    id: "gacc-goods-declaration-guide-2026",
    authority: "General Administration of Customs of the People's Republic of China (GACC)",
    title: "货物申报办事指南",
    instrumentId: "11100000000014154E1000629002001",
    url: "https://online.customs.gov.cn/static/pages/guides/000629002001/000629002001.html",
    effectiveFrom: "2025-05-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "f9674fbca7de221a8ec6158f1225cb78def41bb6abf73f3e14ea9cc0057388f7",
    snapshotPath: "evidence/official/gacc-goods-declaration-guide-2026.html",
    admissionState: "admitted",
    locator: "Process text and materials directory, lines 37–50; legal basis lines 58–61",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "按照要求传送报关单电子数据及随附单证。材料包括合同、发票、运输单据、装箱单、进出口所需的许可证件及海关总署规定的其他单证。受理条件为在海关注册登记的企业。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "The declarant transmits electronic declaration data and accompanying documents. The guide lists commercial documents, required licences and other Customs documents, and identifies Customs-registered enterprises as eligible applicants.",
    },
  },
  {
    id: "mofcom-export-licence-catalogue-2026",
    authority: "MOFCOM and GACC",
    title: "出口许可证管理货物目录（2026年）",
    instrumentId: "商务部 海关总署公告2025年第89号",
    url: "https://picpolicy.mofcom.gov.cn/file/20260106/54801767665477797.pdf",
    effectiveFrom: "2026-01-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "c28b850eabed4ae8ba811dc41a04b2d01a32b1320df0d0edbeffd3aaa10fd500",
    snapshotPath: "evidence/official/mofcom-export-licence-catalogue-2026.pdf",
    admissionState: "admitted",
    locator: "Complete 59-page 2026 catalogue; Chinese commodity code 8517623690 and heading 8517 have no row",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "2026年实行许可证管理的出口货物共43种，详见目录。对外贸易经营者出口目录内所列货物的，应申请取得出口许可证，凭出口许可证向海关办理通关验放手续。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "The 2026 catalogue contains 43 categories. An operator exporting goods listed in the catalogue must obtain an export licence and present it for Customs clearance. Applicability requires an exact catalogue match.",
    },
  },
  {
    id: "prc-dual-use-regulation-792",
    authority: "State Council of the People's Republic of China / MOFCOM",
    title: "中华人民共和国两用物项出口管制条例",
    instrumentId: "国务院令第792号",
    url: "https://exportcontrol.mofcom.gov.cn/article/zcfg/gnzcfg/gzjgfxwj/202410/1057.html",
    effectiveFrom: "2024-12-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "fdc382ab0b3b9b2f28f9cd6ff8347d225a650994f07b320cbeb50fe9d16a6e63",
    snapshotPath: "evidence/official/prc-dual-use-regulation-792.html",
    admissionState: "admitted",
    locator: "Articles 2, 10–18 and end-user/end-use provisions",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "第十一条制定、调整两用物项出口管制清单。第十二条可以对清单以外的货物、技术和服务实施临时管制。第十四条国家对两用物项的出口实行许可制度。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "The authorities maintain a dual-use control list, may impose temporary controls outside the list, and license exports of controlled dual-use items. List absence alone does not resolve temporary or catch-all controls.",
    },
  },
  {
    id: "prc-dual-use-list-2026-consolidated",
    authority: "MOFCOM, MIIT, GACC and the State Cryptography Administration",
    title: "中华人民共和国两用物项出口管制清单",
    instrumentId: "商务部公告2024年第51号（2026年6月官方合并文本）",
    url: "https://exportcontrol.mofcom.gov.cn/upload/uploadfile/attach/202606/12/20260612151240357.pdf",
    effectiveFrom: "2024-12-01",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "b4be9b44fd90d82301290d6c17851bb8c0b33cb563e6287c359dd7a4d162deee",
    snapshotPath: "evidence/official/prc-dual-use-list-2026-consolidated.pdf",
    admissionState: "admitted",
    locator: "PDF pages 120–123, entries 5A002, 5A004, 5B002, 5D002 and 5E002",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "5A002 信息安全系统、设备及其部件，包括达到所列密码算法和性能阈值的安全芯片、密码机、密码卡、加密VPN设备、密钥管理产品、专用密码设备和量子密码设备。5A004为密码分析设备。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Entry 5A002 controls specified information-security systems, equipment and components that meet the listed cryptographic function and performance thresholds; 5A004 covers cryptanalytic equipment. Matching requires exact product parameters.",
    },
  },
  {
    id: "prc-commodity-inspection-law-2021",
    authority: "National People's Congress / MOFCOM policy service",
    title: "中华人民共和国进出口商品检验法（2021修正）",
    instrumentId: "中华人民共和国主席令第八十一号",
    url: "https://policy.mofcom.gov.cn/claw/clawContent.shtml?id=90362",
    effectiveFrom: "2021-04-29",
    lastChecked: CHECKED_AT,
    reviewAfter: REVIEW_AFTER,
    sha256: "251ea1b06803f190ad66c2df3af87797bc02aa0f9a13144d824a066691bc088c",
    snapshotPath: "evidence/official/prc-commodity-inspection-law-2021.html",
    admissionState: "admitted",
    locator: "Articles 4–7, 15–18 and 23–25",
    authoritativeText: {
      kind: "Authoritative Text",
      language: "zh-CN",
      text: "列入目录的进出口商品，由商检机构实施检验。出口商品未经检验合格的，不准出口。",
    },
    translation: {
      kind: "Derived Translation",
      language: "en",
      reviewedAt: CHECKED_AT,
      materialAmbiguity: null,
      text: "Import and export commodities included in the statutory catalogue are inspected by the commodity-inspection authorities; covered export goods may not be exported without passing the required inspection.",
    },
  },
];

export interface ChinaExportCoverageEntry {
  authority: string;
  claimSourceId: string;
  connectorId: string;
  coverageState: "full_support" | "manual";
  domainId: string;
  limitation?: string;
  requiredEvidenceId: string;
  sourceIds: string[];
  whyApplicable: string;
}

export const CHINA_EXPORT_COVERAGE_MANIFEST: ChinaExportCoverageEntry[] = [
  {
    domainId: "china-foreign-trade",
    coverageState: "full_support",
    authority: "MOFCOM",
    connectorId: "china-mofcom-publications",
    requiredEvidenceId: "china_exporter_registration",
    claimSourceId: "prc-foreign-trade-law-2025",
    sourceIds: ["prc-foreign-trade-law-2025"],
    whyApplicable: "A China-registered exporter is preparing a goods export from China.",
  },
  {
    domainId: "china-customs-declaration",
    coverageState: "full_support",
    authority: "GACC / China Customs",
    connectorId: "china-gacc-publications",
    requiredEvidenceId: "china_customs_declaration_pack",
    claimSourceId: "gacc-goods-declaration-guide-2026",
    sourceIds: ["gacc-order-277-declaration", "gacc-goods-declaration-guide-2026"],
    whyApplicable: "The goods leave China and require an export declaration and accompanying documents.",
  },
  {
    domainId: "china-ordinary-export-licence",
    coverageState: "full_support",
    authority: "MOFCOM / GACC",
    connectorId: "china-mofcom-publications",
    requiredEvidenceId: "china_ordinary_export_licence_screening",
    claimSourceId: "mofcom-export-licence-catalogue-2026",
    sourceIds: ["mofcom-export-licence-catalogue-2026"],
    whyApplicable: "The exact Chinese commodity code and description must be screened against the effective annual catalogue.",
  },
  {
    domainId: "china-dual-use-export-control",
    coverageState: "full_support",
    authority: "MOFCOM Export Control Bureau",
    connectorId: "china-export-control-publications",
    requiredEvidenceId: "china_dual_use_list_screening",
    claimSourceId: "prc-dual-use-list-2026-consolidated",
    sourceIds: ["prc-dual-use-regulation-792", "prc-dual-use-list-2026-consolidated"],
    whyApplicable: "The router contains encryption and must be screened by technical parameters, parties, end user and end use, including temporary and catch-all controls.",
  },
  {
    domainId: "china-export-commodity-inspection",
    coverageState: "manual",
    authority: "GACC commodity-inspection authorities",
    connectorId: "china-gacc-publications",
    requiredEvidenceId: "china_statutory_inspection_screening",
    claimSourceId: "prc-commodity-inspection-law-2021",
    sourceIds: ["prc-commodity-inspection-law-2021"],
    whyApplicable: "The exact Chinese commodity code must be screened against the current statutory inspection catalogue.",
    limitation: "The current statutory-inspection catalogue row for the exact Chinese commodity code is not admitted.",
  },
  {
    domainId: "china-case-party-screening",
    coverageState: "manual",
    authority: "MOFCOM Export Control Bureau",
    connectorId: "china-structured-records",
    requiredEvidenceId: "china_catch_all_end_use_screening",
    claimSourceId: "prc-dual-use-regulation-792",
    sourceIds: ["prc-dual-use-regulation-792"],
    whyApplicable: "The exporter, consignee, end user and end use require a current case-specific restricted-party and catch-all review.",
    limitation: "A current case-specific restricted-party result from the owning authority is manual and not admitted.",
  },
];

export function chinaSourceState(
  source: ChinaExportSource,
  asOf: string,
  overrides: Partial<Record<string, EvidenceState>> = {},
): EvidenceState {
  if (overrides[source.id]) return overrides[source.id]!;
  if (source.effectiveFrom > asOf) return "not_yet_effective";
  return source.reviewAfter <= asOf ? "stale" : "admitted";
}

export function validateChinaSourceTranslations(sources: ChinaExportSource[]): string[] {
  return sources.flatMap((source) => {
    if (source.authoritativeText.kind !== "Authoritative Text" || source.authoritativeText.language !== "zh-CN") {
      return [`Source ${source.id} does not preserve Chinese Authoritative Text.`];
    }
    if (source.translation.kind !== "Official Translation" && source.translation.kind !== "Derived Translation") {
      return [`Source ${source.id} has an unlabelled English translation.`];
    }
    if (source.translation.materialAmbiguity) {
      return [`Source ${source.id} has material translation ambiguity: ${source.translation.materialAmbiguity}`];
    }
    return [];
  });
}

export function connectorBlocksCompletion(state: ConnectorState) {
  return state !== "available";
}
