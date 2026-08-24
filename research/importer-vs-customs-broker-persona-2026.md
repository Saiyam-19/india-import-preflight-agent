# Primary persona: importer or customs broker

Research date: 23 August 2026

## Recommendation

Use an **Indian MSME importer or procurement decision-maker as the primary user** and a **licensed Customs Broker as the expert reviewer and handoff destination**.

The product promise is explicitly pre-purchase: “Before I place this order, can this shipment clear Indian customs, what is missing, what will it cost, and what must I do next?” The importer owns that decision and bears the commercial consequences of a bad order. A Customs Broker normally becomes most valuable when advising on or executing the regulated clearance process. The broker should therefore be designed into the workflow without becoming the main hackathon persona.

This choice is also stronger for the hackathon: the brief asks for one obvious user problem and a complete citizen journey that reviewers can test. An importer-facing flow from supplier quotation to a pre-flight decision is easier to understand and demonstrate than a professional broker workstation.

## Comparison

| Criterion | Importer / procurement user | Licensed Customs Broker |
|---|---|---|
| Moment of pain | Before purchase order, payment, dispatch or shipment | Advisory and clearance preparation, often after commercial intent already exists |
| Consequence | Avoids ordering goods that are prohibited, non-compliant or uneconomic | Avoids filing errors, queries, delays and client liability |
| Domain expertise | Usually fragmented or low for occasional importers | High; a shallow checklist adds little value |
| Frequency | Lower per business | High across many clients and shipments |
| Product expectations | Guided explanation, missing evidence, cost and next action | Multi-client cases, audit trail, exact rule versions, bulk handling and professional overrides |
| Data and portal access | Own commercial documents and IEC identity | Client authorisation, broker credentials and clearance systems |
| Legal/accountability risk | Agent supports an internal go/no-go decision | Broker has express statutory obligations and cannot delegate professional due diligence to software |
| Hackathon legibility | Strong: a reviewer can play the importer | Weaker: reviewer must understand a licensed professional workflow |
| Commercial potential | Broad acquisition surface, especially first-time/occasional importers | Strong willingness to pay and repeat use once professional-grade reliability exists |

## Official role evidence

The Customs Brokers Licensing Regulations, 2018 impose substantive obligations on a broker. Regulation 10 requires client authorisation, advising the client to comply with Customs and allied laws, reporting non-compliance to Customs, and exercising due diligence over information given to a client about cargo clearance. The regulations also require client identity and business verification. These duties make brokers excellent reviewers and eventual paying professional users, but they raise the reliability and liability bar for a broker-first prototype.

Source: [Customs Brokers Licensing Regulations, 2018 on India Code](https://upload.indiacode.nic.in/showfile?actid=AC_CEN_2_2_00042_196252_1534829466423&filename=41+of+2018+Customs-Brokers-Licensing-Regulations-english.pdf&type=regulation).

ICEGATE supports both **Importer/Exporter** and **Customs Broker** as distinct registered roles. Registration is a prerequisite for filing Customs documents such as Bills of Entry, and both roles can use relevant enquiry and document services. eSANCHIT guidance likewise identifies importers, exporters and Customs Brokers as possible submitters of supporting documents.

Sources: [ICEGATE Registration FAQ](https://www.icegate.gov.in/themes/contrib/bfd/pdf.js/web/viewer.html?file=%2Fsites%2Fdefault%2Ffiles%2F2023-12%2FRegistration-FAQ%2520%25281%2529.pdf), [ICEGATE eSANCHIT guide](https://www.icegate.gov.in/sites/default/files/2022-04/eSANCHIT_Step_by_Step_Procedure_updated.pdf), and [ICEGATE Enquiries manual](https://www.icegate.gov.in/sites/default/files/2025-05/User%20Manual-Enquiries%20Module_1.3.pdf).

The official ICEGATE FAQ lists the core import documents as Bill of Lading/Airway Bill, commercial invoice, packing list and Bill of Entry, with additional commodity- and Participating Government Agency-specific documents. That variation is the main opportunity for the pre-flight agent.

Source: [ICEGATE FAQ](https://www.icegate.gov.in/help/faq).

## Product model

The first version should have one main actor and one handoff:

1. **Importer starts the case** using a quotation/proforma invoice, specifications, origin, destination, quantity, price, Incoterm and available certificates.
2. **Agent produces a pre-flight assessment**: ready, blocked or uncertain; missing evidence; estimated landed cost; reasons and next actions.
3. **Importer shares an evidence packet with a broker** when specialist validation is required or when the order proceeds.
4. **Broker reviews or overrides with reasons** in a later professional tier. The prototype can show a labelled mock broker review without building a full broker operations suite.

The product should not file a Bill of Entry, impersonate a broker, or claim clearance. It should preserve source citations, assumptions, confidence and an immutable assessment snapshot so the professional handoff is auditable.

## Alternative approaches

### Broker-first

This can become the better commercial product after the rules engine is trusted. Brokers process more shipments, have repeat usage and can distribute the tool to clients. However, broker-first changes the MVP into a professional case-management and compliance platform. It would need client authorisations, multi-tenant confidentiality, precise tariff and notification versioning, professional overrides, document audit trails and deeper ICEGATE integration.

### Dual-primary marketplace

Treating importer and broker as equal primary users creates two workflows and is not advisable for a five-day hackathon. It weakens the single-user story and doubles authentication, permissions, state transitions and acceptance criteria.

## Hackathon fit

The builder brief requires a clearly defined problem, a complete testable citizen journey, honest mocks, and a consumer experience rather than an admin panel. The importer-first journey satisfies that directly. The broker handoff demonstrates end-to-end thinking without making the professional back office the submitted experience.

Sources: [Build What Moves India brief](https://buildwhatmovesindia.com/brief) and [FAQ](https://buildwhatmovesindia.com/faq).
