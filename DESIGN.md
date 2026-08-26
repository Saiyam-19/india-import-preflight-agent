---
name: India-China Trade Guidance
description: An evidence-led bilateral Research Guidance chat for India-China trade in both directions.
colors:
  ink: "#142129"
  ink-soft: "#4b5d68"
  cloud-canvas: "#f5f7f6"
  paper: "#ffffff"
  ledger-line: "#cbd5d7"
  ledger-line-strong: "#8fa1a7"
  trust-blue: "#1e526d"
  trust-blue-dark: "#153d52"
  trust-blue-soft: "#dceaf0"
  ready: "#17643b"
  ready-soft: "#e3f3e8"
  blocked: "#a33a2b"
  blocked-soft: "#f8e6e2"
  verify: "#8a5b0d"
  verify-soft: "#fbf0d4"
typography:
  display:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.6rem, 6.2vw, 6.7rem)"
    fontWeight: 650
    lineHeight: 0.96
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  body:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 760
    lineHeight: 1.55
    letterSpacing: "0.12em"
rounded:
  square: "0"
spacing:
  xs: "0.35rem"
  sm: "0.65rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.25rem"
components:
  button-primary:
    backgroundColor: "{colors.trust-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
    padding: "0.7rem 1rem"
    height: "46px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.trust-blue-dark}"
    rounded: "{rounded.square}"
    padding: "0.65rem 1rem"
    height: "46px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.65rem 0.75rem"
    height: "46px"
  result-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
  chat-history-selected:
    backgroundColor: "{colors.trust-blue-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.9rem 1rem"
    height: "76px"
---

# Design System: India-China Trade Guidance

## Overview

**Creative North Star: "The Evidence Ledger"**

India-China Trade Guidance is an evidence-ledger chat that makes bilateral research uncertainty observable. It deliberately refuses the generic marketing page and dashboard arrangement: conversation history, official-source activity, exact citations, evidence gaps, and the optional internal case detail remain inspectable in one persistent operational record.

The world is quiet, exact, and non-governmental. A cloud canvas and white paper surfaces carry dark ink, one restrained trust-blue accent, square marks, sharp borders, native controls, and official-source audit rows. Decoration never competes with the guidance state or with the evidence that produced it.

The story is fixed: ask any India-China import or export question immediately, let the assistant clarify direction and the next relevant fact group in chat, optionally attach documents beside the composer, confirm or correct extracted facts naturally, observe searching/checking/admission activity, then receive cited Research Guidance or an explicit incomplete result. An isolated Trade Case is created and scoped automatically behind each conversation. Direction-specific classification, regulator, document, calculation, and assessment tools retain their deterministic evidence gates while their long input forms stay out of the primary path. Protected portal transactions remain visibly not checked, uploads never imply authority status, and missing or ambiguous evidence fails closed. UAE and United States coverage is deferred and is not presented as runtime support.

**Mode:** Operate  
**Direction seed:** `operate-evidence-ledger`

**Finish review:** Existing evidence-led visual behavior is approved for the current bilateral chat; this document does not claim a compliance or shipment outcome.

**Key Characteristics:**

- Evidence-led operational density rather than dashboard ornament.
- Cloud, ink, trust blue, square marks, and rule-based audit structure.
- Native, keyboard-complete controls with visible focus and 44px minimum targets.
- Conversation scope, activity, source, locator, and incomplete state remain visually traceable without requiring domain-object knowledge.
- Attachment state, visible-fact provenance, confirmation/correction history, retention, deletion, and case isolation remain visually traceable.
- Assessment direction, agency coverage, separate bilateral classifications, formula order and currency, Chinese source-language provenance, and every exclusion remain visually traceable.
- Responsive composition collapses cleanly to a single 360px journey.

## Colors

The palette reads like a calm working paper: cool near-whites, legible blue-black ink, restrained trust blue, and status colors used only where their meaning is explicit.

### Primary

- **Trust Blue:** The sole interaction and evidence accent for links, labels, selection, marks, and primary action.
- **Deep Trust Blue:** Hover and high-emphasis text treatment for trust-blue controls.
- **Pale Trust Blue:** Selected, rerun, and supporting information surfaces.

### Secondary

- **Ready Green:** Completed evidence-check activity; always accompanied by words or a mark.
- **Blocked Red:** Error signal; never used as the only carrier of meaning.
- **Verification Amber:** Incomplete, unresolved, or withheld-evidence signal.

### Neutral

- **Ledger Ink:** Primary text and the dominant visual authority.
- **Soft Ink:** Explanations, helper copy, metadata, and secondary labels.
- **Cloud Canvas:** Page background that separates the service from white evidence paper.
- **Paper:** Inputs, result panels, options, and audited records.
- **Ledger Line / Strong Ledger Line:** Structural borders, dividers, table rules, and panel edges.

### Named Rules

**The One Trust Accent Rule.** Trust blue is the only general accent; activity, gap, and error colors are semantic exceptions, not decorative alternatives.

**The Non-Colour Status Rule.** Research Guidance, incomplete evidence, and errors always include explicit text in addition to color.

## Typography

**Display Font:** Native UI sans-serif stack  
**Body Font:** Native UI sans-serif stack  
**Label Font:** Native UI sans-serif stack

**Character:** The typography is direct, compact, and infrastructural. Large tightly tracked headlines state the decision problem; smaller high-weight uppercase labels behave like audit annotations rather than promotional eyebrows.

### Hierarchy

- **Display** (650, fluid display scale, 0.96 line-height): The first-viewport decision headline only.
- **Headline** (650, fluid section scale, 1.1 line-height): Workspace and major conversation headings.
- **Title** (680–720, 1–1.55rem): Trade Case, source, activity, and evidence-gap sections.
- **Body** (400, 1rem, 1.55 line-height): Instructions and explanatory prose, normally constrained to about 60ch.
- **Label** (760, 0.72rem, 0.12em tracking, uppercase): Evidence, scope, result, and audit-category annotations.

### Named Rules

**The Decision First Rule.** The largest type belongs to the user’s decision boundary, never to a metric, logo, or decorative slogan.

**The Audit Label Rule.** Uppercase tracking is reserved for short evidence labels; instructional and transactional copy stays sentence case.

## Layout

The desktop shell uses a restrained optional chat-history rail and one dominant persistent conversation with a sticky composer. Evidence activity, citations, gaps, calculations, documents, and internal case details expand inline only when useful. Spacing expands fluidly without breaking the ruled vertical rhythm.

At narrow widths, chat history becomes a native details switcher while the conversation and composer remain primary and keyboard reachable. The no-key journey is verified at 360px without horizontal overflow; the configured live-agent black-box browser journey remains pending.

The bilateral assessment retains the same single-column order on narrow screens. Wide calculation tables scroll inside a named keyboard-focusable region rather than widening the document.

Attachment review uses the same responsive document flow: upload consent and limits precede results; saved document metadata precedes fact state and editable value; page, region, method, and extraction confidence remain a compact ruled ledger. At 360px, those two-column audit rows become a single column and destructive confirmations expand to full-width controls.

**The One Journey Rule.** Responsive behavior preserves question → focused clarification → evidence activity → cited guidance or incomplete gap; it never creates a separate mobile workflow.

## Elevation & Depth

The system is flat by default. Depth comes from white paper against the cloud canvas, crisp border hierarchy, ruled rows, and restrained tonal fills. Any retained desktop panel shadow identifies a bounded evidence surface and disappears once that surface enters the mobile document flow.

**The Paper Artifact Rule.** Shadows identify the result artifact, not every card or control.

## Shapes

The form language is resolutely square. Inputs, buttons, options, status marks, wordmarks, panels, and disclosure marks use zero radius and one-pixel borders. Repeated small squares—identity mark, status mark, evidence number, action number, and disclosure control—form the system’s signature geometry.

**The Sharp Evidence Rule.** Do not soften audited surfaces with pills, rounded cards, or floating glass treatments.

## Components

### Buttons

- **Shape:** Square, sharp, and compact with a 46px minimum height.
- **Primary:** Trust-blue fill, white text, and matching border; used for sending a question and consequential evidence actions.
- **Secondary:** Transparent fill, trust-blue border, and deep trust-blue text; pale trust-blue appears on hover.
- **Hover / Focus / Active:** Hover deepens or fills; focus uses a visible 3px blue outline with 3px offset; active movement is a restrained 1px downward press.

### Chat History and Internal Trade Cases

- **Style:** Familiar conversation titles in an optional desktop rail and a native chat-history details switcher on mobile.
- **Selected State:** Pale trust-blue paper with a trust-blue edge.
- **Content:** Human-readable conversation title and known direction remain visible. The Trade Case ID and workflow never become a prerequisite.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** White paper on the cloud canvas.
- **Shadow Strategy:** Only the result artifact receives ambient elevation.
- **Border:** One-pixel ledger line; strong line for primary enclosure.
- **Internal Padding:** Fluid spacing for empty-case guidance, conversation messages, activity, and source sections.

### Inputs / Fields

- **Style:** Native text fields and selects with white background, strong ledger border, no radius, and 46px minimum height.
- **Focus:** The shared 3px blue focus outline remains visible outside the control edge.
- **Error / Disabled:** Errors use blocked-soft paper with blocked text and border; disabled submission lowers opacity while retaining its label.

### Navigation

- **Style:** A minimal 72px ruled header pairs the square IP mark and service name with the explicit privacy promise. Mobile reduces the header height and wraps the privacy line without hiding it.

### Evidence Audit Rows

- **Style:** Official-source evidence is a ruled ledger row: ordinal, obligation/evidence description, and a native status select.
- **Report State:** Findings disclose source authority, pinpoint, review window, required and missing evidence, owner, destination, and rerun condition.
- **Behavior:** Native `details` / `summary` keeps disclosure keyboard-operable and semantically inspectable.

### Guidance and Evidence Panels

- **Style:** The conversation presents the saved summary, exact citations, typed research activity, and incomplete-evidence gaps; the source panel exposes authority, locator, dates, and hash.
- **Status:** Research Guidance and incomplete results remain explicit in text, with semantic color used only as support.

### China-to-India Assessment

- **Input:** Ruled native fields gather exact model and technical parameters, manufacturing/origin facts, parties, end user/end use, route/ports, decimal INR valuation, evidence and screening status, and explicit confirmations. Fixed reference-product facts remain inspectable in a native disclosure.
- **State:** The artifact names exactly one closed assessment state in text; semantic green, amber, or red only supports that label. User-selected confirmations cannot visually or logically hide a manual Coverage Manifest blocker.
- **Audit:** Checked and not-checked scope appears before the combined agency checklist. Login-required China filing and licensing transactions remain under Not checked.
- **Classification and calculation:** Working Classification or candidates, GRI reasoning, exclusions, component order, formula, rounding, rate provenance, and withholding reasons remain in ruled native disclosures.
- **Claims:** Each released factual claim shows its admitted source/version identity and exact locator as an external official-source link.
- **Persistence:** Saved immutable snapshots stack in case order and keep their stable snapshot identity visible.

### Attachment Review and Case Memory

- **Intake:** A native multi-file control, explicit processing-authorisation checkbox, and plain-language limits precede extraction. Every rejected state is written in text rather than encoded by color.
- **Review:** Saved document metadata, pending/confirmed/corrected status, editable visible value, page, region, method, extraction confidence, and version history form one ruled evidence record.
- **Trust boundary:** Amber working-paper copy states that extraction confidence is not truth, authenticity, validity, authority acceptance, filing, payment, release, or clearance.
- **Isolation:** Persistent internal case creation follows the conversation automatically; chat history resumes it, while the attachment region names its saved count and explicitly says no facts are borrowed.
- **Retention and deletion:** Underlined document deletion and bordered Trade Case deletion actions require a second explicit confirmation and explain the derived-data consequence before mutation.

### Motion

- **Style:** Motion is brief operational feedback only: 120ms press movement and 160ms border/background transitions.
- **Reduced Motion:** The reduced-motion media query collapses transitions and animation to 0.01ms and switches programmatic scrolling to immediate behavior.

## Do's and Don'ts

### Do:

- **Do** make the composer immediately usable and clarify direction or product facts conversationally only when relevant.
- **Do** preserve the question → focused clarification → evidence activity → cited guidance or incomplete-gap narrative.
- **Do** use native controls, semantic fieldsets, tables, details, headings, and regions.
- **Do** keep focus visible, targets at least 44px, status non-colour-dependent, and layouts valid at 360px.
- **Do** expose official source, pinpoint, date, owner, missing evidence, destination, and rerun condition in audit rows.
- **Do** keep document provenance, confirmation state, retention consequence, and current conversation visible at the point of review.
- **Do** use motion only for immediate feedback and spatial orientation, with reduced-motion parity.

### Don't:

- **Don't** rearrange this into a generic dashboard of metric cards, charts, sidebars, or decorative widgets.
- **Don't** imply government affiliation through seals, emblems, official-looking chrome, or authority colors.
- **Don't** use rounded cards, pill controls, glassmorphism, gradients, decorative illustration, or speculative data visualization.
- **Don't** make status, readiness, or blockers legible by color alone.
- **Don't** promote unsupported jurisdictions, sources, products, or legal certainty through visual emphasis.
- **Don't** make an extracted value look confirmed, authentic, valid, filed, paid, released, or cleared before the explicit case-scoped review action.
- **Don't** let decoration outrank Trade Case scope, evidence, citations, or the incomplete state.
- **Don't** require a case picker, case name, direction selector, or long assessment form before chat can proceed.
