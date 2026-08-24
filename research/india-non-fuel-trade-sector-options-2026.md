# India non-fuel trade sector options for the EXIM pre-flight prototype

Research date: 23 August 2026  
Decision horizon: five days to the 28 August 2026 hackathon deadline

## Recommendation

Build an **electronics-import pre-flight agent for Indian MSMEs**, but describe its promise as **attribute-based regulatory triage**, not complete legal coverage of every electronic product.

This is a sector scope rather than a single-product checker. It is the strongest five-day choice because:

- **Electronic goods are India's largest non-petroleum import category** in both the latest completed-year DGCIS summary and the latest current-period Quick Estimates: US$116.147 billion in FY 2025-26 and US$52.824 billion in April-July 2026-27.
- Electronics also have large exports: US$47.961 billion in FY 2025-26 and US$21.112 billion in April-July 2026-27. The product can therefore grow into export readiness later without pretending both journeys are implemented now.
- Electronics produce visible, understandable regulatory branches around product safety, wireless capability, batteries, e-waste, retail packaging, telecom connectivity, new versus refurbished condition, HS classification and customs duty.
- Official rule lists and service portals exist, so a deterministic rule fixture can be sourced and cited. The hackathon requires government integrations to be mocked unless organizers supply an approved sandbox.

Do **not** promise "all electronics compliance." In five days, support a bounded matrix of representative product attributes and golden paths, plus an explicit `needs specialist / unsupported` outcome. A defensible demo set would cover four varied archetypes, for example a laptop, Bluetooth speaker, power bank and LED luminaire, rather than four near-identical audio products.

The next product decision should be **direction**: import-only, export-only, or both. Recommendation: **import-only for the submitted journey**. Import and export are different workflows, and the official data gives an unusually strong reason to choose imports.

## What India imports and exports most, excluding fuels

Within the Department of Commerce's official **Quick Estimates (QE) selected major commodity groups**:

- **Largest non-fuel merchandise export group:** Engineering Goods — US$122.141 billion in FY 2025-26; US$46.384 billion in April-July 2026-27.
- **Largest non-fuel merchandise import group:** Electronic Goods — US$116.147 billion in FY 2025-26; US$52.824 billion in April-July 2026-27.

These are not symmetrical industry taxonomies. For example, "Engineering Goods" is an export umbrella, while the import table separately reports "Machinery, electrical & non-electrical," transport equipment, iron and steel, non-ferrous metals and other groups. "Largest sector" here therefore means **largest named QE commodity group**, not a national-accounts industry classification.

### Exact trade values

All values below are **US$ billion**, converted from the source tables' million-US-dollar figures. FY values are April 2025-March 2026. Current-period values are April-July 2026-27.

| Official QE commodity group | FY25-26 exports | FY25-26 imports | Apr-Jul 2026-27 exports | Apr-Jul 2026-27 imports | Interpretation |
|---|---:|---:|---:|---:|---|
| Engineering Goods | 122.141 | — | 46.384 | — | Largest non-fuel export group; 27.67% of all merchandise exports in FY25-26 and 26.69% in the current period (calculated from official totals). |
| Machinery, electrical & non-electrical | — | 61.714 | — | 22.768 | Import comparator, but not equivalent to the broader Engineering Goods export group. |
| Electronic Goods | 47.961 | 116.147 | 21.112 | 52.824 | Largest non-fuel import group; 14.97% of all imports in FY25-26 and 18.07% in the current period. |
| Drugs & Pharmaceuticals / Medicinal & Pharmaceutical Products | 31.116 | 9.596 | 10.786 | 3.285 | Strong export sector, but import compliance is safety-critical. Labels differ between export and import tables. |
| Organic & Inorganic Chemicals | 28.673 | 27.913 | 10.688 | 10.834 | Does not include every resin, dye, chemical material, fertilizer or controlled chemical line. |
| Gems & Jewellery / Gold / Pearls and stones | 28.208 | Gold 71.977; stones 18.445 | 9.588 | Gold 15.174; stones 5.535 | High-value trade, but import and export categories are not directly comparable and specialized controls dominate. |
| Textiles, selected disjoint groups | RMG 15.772; cotton 11.587; man-made 4.831 | Yarn/fabric/made-ups 2.602 | RMG 4.949; cotton 4.072; man-made 1.603 | Yarn/fabric/made-ups 0.845 | Important export family; there is no single textiles total in the QE table. |
| Food/agri, selected examples | Rice 11.537; marine 8.431; meat/dairy/poultry 6.215 | Vegetable oil 19.488; fruit/veg 3.824 | Rice 3.894; marine 2.890; meat/dairy/poultry 2.439 | Vegetable oil 7.153; fruit/veg 1.398 | Broad public-facing opportunity, but not one QE category and product rules vary sharply. |

Sources: [Department of Commerce/PIB July 2026 release, posted 13 August 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298878&lang=1&reg=48), [DGCIS/DGFT Exim Summary based on July 2026 Quick Estimates](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/aug/doc2026813954801.pdf), and [April-July 2026-27 Quick Estimates commodity tables](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/aug/doc2026813954301.pdf). The August DGCIS/DGFT summary provides the latest revised FY25-26 values used above; the [preliminary FY25-26 release from 15 April 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2252272&lang=2&reg=48) is retained only as a revision trail.

The macro totals used for the share calculations are the revised US$441.452 billion exports and US$775.713 billion imports in FY 2025-26, and US$173.780 billion exports and US$292.378 billion imports in April-July 2026-27.

## Candidate-sector comparison

Scores are 1-5. For **breadth** and **fragmentation**, 5 means broader/more fragmented and therefore harder; for the other columns, 5 is better. The scores are product judgments informed by the official systems cited below, not government ratings.

| Candidate | Trade significance | Breadth | Regulatory fragmentation | Official data / portal availability | Complete demo journey | Five-day feasibility | Assessment |
|---|---:|---:|---:|---:|---:|---:|---|
| **Electronics imports** | 5 | 5 | 4 | 4 | 5 | 3 | Best balance if the output is triage with bounded product fixtures. BIS, WPC/DoT, environmental EPR and Customs/DGFT branches make the agent visibly useful. |
| Engineering-goods exports | 5 | 5 | 5 | 3 | 3 | 1 | The export leader, but "engineering goods" spans machinery, steel, vehicles, electrical equipment and many QCOs. Too broad to make dependable in five days. |
| Chemicals import/export | 4 | 5 | 5 | 3 | 3 | 1 | Strong two-way trade, but QCOs, hazardous-chemical rules, controlled uses and safety consequences create an expert system, not a quick prototype. |
| Pharma / medical products | 4 | 4 | 5 | 3 | 4 | 1 | A compelling journey through CDSCO/SUGAM, but drug, device, diagnostic and biological routes differ; false guidance is high-stakes. |
| Food and agri trade | 4 | 5 | 5 | 4 | 5 | 2 | FSSAI FICS and APEDA make a strong citizen journey, but plant, animal, processed-food and destination-specific export rules quickly diverge. Feasible only after narrowing to one corridor/product family. |
| Textiles and apparel exports | 4 | 4 | 3 | 3 | 4 | 4 | Best runner-up for an export-first build. Lower regulatory drama than electronics, but easier to demonstrate HS classification, origin, inspection/certification and export-document readiness. |

### Why the export leader is not the best prototype scope

Engineering Goods are clearly the largest non-fuel export QE group, but that is exactly the problem: the label aggregates too many unlike products. A five-day agent would either be shallow or silently wrong across standards, Quality Control Orders, restricted goods and destination requirements. The official [DGFT ITC(HS) import policy notes](https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf), [BIS compulsory-certification listings](https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en), and [ICEGATE I4C trade guide](https://www.icegate.gov.in/Webappl/home) demonstrate how product-code-specific the route is.

### Why electronics are demo-rich but still controllable

- BIS maintains a current list of Electronics and IT Goods under its Compulsory Registration Scheme, including laptops, power banks, wireless headphones, smart speakers, Bluetooth speakers and many other product classes: [BIS Scheme II list](https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-ii-registration-scheme/?lang=en).
- Wireless devices may need WPC Equipment Type Approval; the DoT service states ETA is needed for importing, selling or using wireless devices in de-licensed bands: [DoT ETA service](https://www.eservices.dot.gov.in/index.php/equipment-type-approval-eta).
- CPCB states that producers and other covered entities register on the E-Waste EPR portal, with covered electrical/electronic equipment determined by Schedule I: [CPCB E-Waste EPR FAQ](https://cpcb.nic.in/uploads/Projects/E-Waste/FAQ_ewaste_23012024.pdf).
- DGFT's general import notes expressly state that notified Electronics and IT Goods cannot be imported unless BIS-registered/compliant or specifically exempted: [DGFT ITC(HS) general import notes](https://content.dgft.gov.in/Website/General_Notes_regarding_Import_Policy_20225_updated.pdf).
- ICEGATE's I4C trade guide exposes duties, import/export policy and compulsory compliance requirements by tariff code, which is a natural target shape for a pre-flight explanation: [ICEGATE I4C](https://www.icegate.gov.in/Webappl/home).

This supports a believable end-to-end prototype: upload invoice/specification -> extract product attributes -> propose HS candidates with uncertainty -> map applicable regulator gates -> run clearly labelled mock verifications -> estimate duties/ranges -> identify blockers and evidence mismatches -> generate a prioritized action packet.

## Official data and API reality

- The Department of Commerce [TradeStat system](https://tradestat.commerce.gov.in/meidb/country_wise_principal_commoditywiseall_hscode_export) reported data available through June 2026, revised-final through March 2026 and final through June 2026, last updated 13 August 2026. It is a query interface; this review did not find a documented public API that should be assumed available for the build.
- ICEGATE offers an official [Custom Duty Calculator](https://www.icegate.gov.in/cdc) and I4C tariff/compliance enquiry. The current calculator is login-gated. Treat it as a reference/validation source, not an undocumented integration.
- [API Setu](https://apisetu.gov.in/) is an official NeGD/MeitY discovery and access platform, and its [directory](https://directory.apisetu.gov.in/) is dynamically searched. This review did **not** confirm a public, documented DGFT/BIS/WPC/ICEGATE compliance endpoint from the publicly crawlable catalogue. That is an unresolved availability question, not proof that no such API exists. Do not make a specific API Setu integration part of the core demo until credentials, terms, schema and sandbox behavior are verified.
- Most relevant regulator systems are official web portals rather than verified public developer APIs. Examples include BIS, DoT ETA, CPCB EPR, [FSSAI FICS](https://www.fssai.gov.in/fics), [CDSCO SUGAM processes](https://www.cdsco.gov.in/opencms/opencms/en/Departments/Headquarters/imports/), [APEDA e-RCMC](https://apeda.gov.in/RCMC), and [Textiles Committee export-quality services](https://www.textilescommittee.nic.in/export-promotion-quality-assurance).

The hackathon itself settles the implementation posture: the [builder brief](https://buildwhatmovesindia.com/brief) asks for a complete citizen journey using mocks when production access is unsafe/unavailable, and the [FAQ](https://buildwhatmovesindia.com/faq) says not to connect to live government systems unless organizers provide an approved public sandbox. Therefore the five-day build should use versioned deterministic rule fixtures and labelled synthetic responses, with API Setu represented only by a mock adapter unless a relevant approved sandbox is confirmed.

## Other-sector evidence and caveats

- **Chemicals:** the Department of Chemicals and Petrochemicals lists 33 notified chemical Quality Control Orders and separate petrochemical QCOs, while its 2025 sector report points to hazardous-chemical, waste, ozone-depleting-substance and drug rules under different authorities. See [chemical QCOs](https://chemicals.gov.in/chemicals-quality-control-orders) and [Chemicals & Petrochemicals at a Glance 2025](https://www.chemicals.gov.in/sites/default/files/inline-files/Glance-2025_1.pdf). This fragmentation is useful evidence but poor five-day scope.
- **Pharma/medical:** CDSCO states that drugs, sites and import licences/registration are handled through SUGAM, while medical devices follow separate risk- and form-based routes. See [CDSCO Imports & Registration](https://www.cdsco.gov.in/opencms/opencms/en/Departments/Headquarters/imports/) and [Medical Device & Diagnostics](https://www.cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/Medical-Device-Diagnostics/).
- **Food/agri:** FSSAI says FICS is an online single-window integrated with Customs for scrutiny, inspection, sampling, testing and NOC/non-conformance decisions; APEDA separately requires/handles exporter registration and product-specific traceability/certification. See [FSSAI FICS](https://www.fssai.gov.in/fics), [APEDA functions and product scope](https://apeda.gov.in/functions), and [APEDA e-RCMC](https://apeda.gov.in/RCMC).
- **Textiles:** the Textiles Committee offers HS classification, inspection and several origin/preference certifications, giving a coherent export-document demo with fewer safety-critical branches: [Export Promotion & Quality Assurance](https://www.textilescommittee.nic.in/export-promotion-quality-assurance).

## Data caveats

1. The July 2026 Quick Estimates explicitly mark July figures provisional. The FY25-26 values above use the revised figures in the August DGCIS/DGFT Exim Summary, not the higher preliminary figures issued in April (for example, US$122.431 billion engineering exports, US$116.175 billion electronics imports and total trade of US$441.784 billion exports/US$774.975 billion imports).
2. Quick Estimates cover selected major commodity groups and include re-exports/re-imports. They are suitable for sector selection, not for deriving product-level legal rules.
3. Categories are not always symmetrical between export and import tables, so values should not be combined into a claimed sector total unless the underlying HS coverage is reconciled.
4. Regulatory lists and effective dates change. The prototype should display a `rules last verified` date and avoid presenting its output as legal clearance.
5. The five-day recommendation assumes a working, testable main journey with four representative fixtures and refusal/escalation behavior. Full product coverage, live filings, payment and authoritative licence validation remain explicitly out of scope.
