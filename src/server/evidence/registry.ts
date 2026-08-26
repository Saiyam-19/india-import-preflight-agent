import { z } from "zod";

export const JurisdictionSchema = z.enum(["India", "China"]);
export type Jurisdiction = z.infer<typeof JurisdictionSchema>;

export const ConnectorStateSchema = z.enum([
  "available",
  "manual",
  "login_required",
  "temporarily_unavailable",
  "unsupported",
]);
export type ConnectorState = z.infer<typeof ConnectorStateSchema>;

export interface OfficialConnector {
  allowedDomains: readonly string[];
  authority: string;
  id: string;
  jurisdiction: Jurisdiction;
  purpose: string;
  state: ConnectorState;
}

export const OFFICIAL_CONNECTORS: readonly OfficialConnector[] = [
  {
    id: "india-official-web",
    jurisdiction: "India",
    authority: "Government of India official publications",
    purpose: "Official-source discovery and public document retrieval",
    state: "available",
    allowedDomains: [
      "dgft.gov.in",
      "content.dgft.gov.in",
      "cbic.gov.in",
      "icegate.gov.in",
      "egazette.gov.in",
      "indiacode.nic.in",
      "bis.gov.in",
      "dot.gov.in",
      "meity.gov.in",
      "dgtr.gov.in",
      "tec.gov.in",
      "mtcte.tec.gov.in",
    ],
  },
  {
    id: "india-dgft-publications",
    jurisdiction: "India",
    authority: "Directorate General of Foreign Trade",
    purpose: "IEC, export policy, SCOMET and certificate-of-origin public instruments",
    state: "available",
    allowedDomains: ["dgft.gov.in", "content.dgft.gov.in", "trade.gov.in", "coo.dgft.gov.in"],
  },
  {
    id: "india-customs-publications",
    jurisdiction: "India",
    authority: "Central Board of Indirect Taxes and Customs",
    purpose: "India export declaration and Customs public instruments",
    state: "available",
    allowedDomains: ["cbic.gov.in", "taxinformation.cbic.gov.in", "icegate.gov.in", "indiacode.nic.in"],
  },
  {
    id: "india-icegate",
    jurisdiction: "India",
    authority: "Indian Customs Electronic Gateway",
    purpose: "Case-specific export declaration filing, document upload and status",
    state: "login_required",
    allowedDomains: ["icegate.gov.in"],
  },
  {
    id: "china-official-web",
    jurisdiction: "China",
    authority: "Government of China official publications",
    purpose: "Official-source discovery and public document retrieval",
    state: "available",
    allowedDomains: [
      "gov.cn",
      "customs.gov.cn",
      "mofcom.gov.cn",
      "samr.gov.cn",
      "cnca.gov.cn",
      "mof.gov.cn",
      "chinatax.gov.cn",
    ],
  },
  {
    id: "china-mofcom-publications",
    jurisdiction: "China",
    authority: "Ministry of Commerce of the People's Republic of China",
    purpose: "Foreign-trade, ordinary export-licence and official policy publications",
    state: "available",
    allowedDomains: ["mofcom.gov.cn"],
  },
  {
    id: "china-gacc-publications",
    jurisdiction: "China",
    authority: "General Administration of Customs of the People's Republic of China",
    purpose: "China Customs declaration and commodity-inspection publications",
    state: "available",
    allowedDomains: ["customs.gov.cn", "online.customs.gov.cn", "mofcom.gov.cn"],
  },
  {
    id: "china-export-control-publications",
    jurisdiction: "China",
    authority: "MOFCOM Export Control Bureau",
    purpose: "Dual-use control legislation, consolidated lists and annual licence catalogues",
    state: "available",
    allowedDomains: ["exportcontrol.mofcom.gov.cn", "mofcom.gov.cn"],
  },
  {
    id: "china-tariff-tax-publications",
    jurisdiction: "China",
    authority: "State Council Tariff Commission, GACC and State Taxation Administration",
    purpose: "China tariff schedule, tariff law, import VAT and public Customs tariff guidance",
    state: "available",
    allowedDomains: ["mof.gov.cn", "chinatax.gov.cn", "customs.gov.cn", "online.customs.gov.cn"],
  },
  {
    id: "china-product-market-publications",
    jurisdiction: "China",
    authority: "CNCA, SAMR and Ministry of Industry and Information Technology",
    purpose: "CCC, telecommunications network-access and radio type-approval public rules",
    state: "available",
    allowedDomains: ["cnca.gov.cn", "samr.gov.cn", "miit.gov.cn", "ythzxfw.miit.gov.cn"],
  },
  {
    id: "china-product-market-portals",
    jurisdiction: "China",
    authority: "CNCA and Ministry of Industry and Information Technology",
    purpose: "Case-specific certificate, permit, approval and registry status",
    state: "login_required",
    allowedDomains: ["cnca.gov.cn", "miit.gov.cn", "ythzxfw.miit.gov.cn"],
  },
  {
    id: "china-single-window",
    jurisdiction: "China",
    authority: "China International Trade Single Window / GACC",
    purpose: "Case-specific declaration filing and status",
    state: "login_required",
    allowedDomains: ["singlewindow.cn", "customs.gov.cn"],
  },
  {
    id: "china-dual-use-licensing",
    jurisdiction: "China",
    authority: "MOFCOM Export Control Bureau",
    purpose: "Case-specific dual-use licence application and status",
    state: "login_required",
    allowedDomains: ["mofcom.gov.cn", "egov.mofcom.gov.cn"],
  },
  {
    id: "china-structured-records",
    jurisdiction: "China",
    authority: "China government structured records",
    purpose: "Record-specific verification that is not automated in this local phase",
    state: "manual",
    allowedDomains: ["customs.gov.cn", "samr.gov.cn", "cnca.gov.cn"],
  },
] as const;

export function getOfficialConnector(id: string): OfficialConnector | undefined {
  return OFFICIAL_CONNECTORS.find((connector) => connector.id === id);
}

export function officialSearchDomains(
  jurisdictions: readonly Jurisdiction[] = JurisdictionSchema.options,
): string[] {
  return [
    ...new Set(
      OFFICIAL_CONNECTORS.filter(
        (connector) => connector.state === "available" && jurisdictions.includes(connector.jurisdiction),
      ).flatMap((connector) => connector.allowedDomains),
    ),
  ].sort();
}

export function hostMatchesAllowedDomain(hostname: string, allowedDomains: readonly string[]) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return allowedDomains.some((domain) => {
    const allowed = domain.toLowerCase().replace(/\.$/, "");
    return normalized === allowed || normalized.endsWith(`.${allowed}`);
  });
}
