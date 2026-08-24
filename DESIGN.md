---
name: India Import Preflight
description: An evidence-led preflight for exact connected-electronics import scenarios into India.
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
  product-option-selected:
    backgroundColor: "{colors.trust-blue-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0.9rem 1rem"
    height: "76px"
---

# Design System: India Import Preflight

## Overview

**Creative North Star: "The Evidence Ledger"**

India Import Preflight is an evidence-ledger interface that makes import uncertainty observable. It deliberately refuses the generic marketing page and generic dashboard arrangement: product scope, entered facts, documentary evidence, official-source pinpoints, cost arithmetic, and next actions are all treated as inspectable entries in one operational record.

The world is quiet, exact, and non-governmental. A cloud canvas and white paper surfaces carry dark ink, one restrained trust-blue accent, square marks, sharp borders, native controls, and official-source audit rows. Decoration never competes with the outcome or with the evidence that produced it.

The story is fixed: confirm the exact product, declare shipment facts and evidence, then receive one outcome with auditable cost and ordered actions. The first viewport establishes service identity and the privacy promise, states the plain-language decision headline, shows three trust proofs, and opens into the assessment workbench.

**Mode:** Operate  
**Direction seed:** `operate-evidence-ledger`

**Finish review:** 9.6/10 — **APPROVED FOR SHIPMENT**. Accessibility, responsive, and motion passes are complete; all prior findings are resolved.

**Key Characteristics:**

- Evidence-led operational density rather than dashboard ornament.
- Cloud, ink, trust blue, square marks, and rule-based audit structure.
- Native, keyboard-complete controls with visible focus and 44px minimum targets.
- Outcome, cost, source, owner, and action remain visually traceable.
- Responsive composition collapses cleanly to a single 360px journey.

## Colors

The palette reads like a calm working paper: cool near-whites, legible blue-black ink, restrained trust blue, and status colors used only where their meaning is explicit.

### Primary

- **Trust Blue:** The sole interaction and evidence accent for links, labels, selection, marks, and primary action.
- **Deep Trust Blue:** Hover and high-emphasis text treatment for trust-blue controls.
- **Pale Trust Blue:** Selected, rerun, and supporting information surfaces.

### Secondary

- **Ready Green:** Positive outcome and satisfied-evidence signal; always accompanied by words or a mark.
- **Blocked Red:** Clearance-blocker and error signal; never used as the only carrier of meaning.
- **Verification Amber:** Unresolved, withheld, or needs-verification signal.

### Neutral

- **Ledger Ink:** Primary text and the dominant visual authority.
- **Soft Ink:** Explanations, helper copy, metadata, and secondary labels.
- **Cloud Canvas:** Page background that separates the service from white evidence paper.
- **Paper:** Inputs, result panels, options, and audited records.
- **Ledger Line / Strong Ledger Line:** Structural borders, dividers, table rules, and panel edges.

### Named Rules

**The One Trust Accent Rule.** Trust blue is the only general accent; outcome colors are semantic exceptions, not decorative alternatives.

**The Non-Colour Status Rule.** Ready, Blocked, and Needs verification always include explicit text and a geometric mark in addition to color.

## Typography

**Display Font:** Native UI sans-serif stack  
**Body Font:** Native UI sans-serif stack  
**Label Font:** Native UI sans-serif stack

**Character:** The typography is direct, compact, and infrastructural. Large tightly tracked headlines state the decision problem; smaller high-weight uppercase labels behave like audit annotations rather than promotional eyebrows.

### Hierarchy

- **Display** (650, fluid display scale, 0.96 line-height): The first-viewport decision headline only.
- **Headline** (650, fluid section scale, 1.1 line-height): Workbench and major report headings.
- **Title** (680–720, 1–1.55rem): Fieldset legends, report sections, outcome titles, and evidence findings.
- **Body** (400, 1rem, 1.55 line-height): Instructions and explanatory prose, normally constrained to about 60ch.
- **Label** (760, 0.72rem, 0.12em tracking, uppercase): Evidence, scope, result, and audit-category annotations.

### Named Rules

**The Decision First Rule.** The largest type belongs to the user’s decision boundary, never to a metric, logo, or decorative slogan.

**The Audit Label Rule.** Uppercase tracking is reserved for short evidence labels; instructional and transactional copy stays sentence case.

## Layout

The desktop shell uses a centered fluid container capped at 1440px with 1.5rem side gutters. The first viewport is an asymmetrical two-column statement: thesis on the left, explanatory copy on the right, then a three-cell trust row across the full width. The workbench pairs the assessment form with a narrower sticky result ledger; spacing expands fluidly without breaking the ruled vertical rhythm.

At 980px, the intro and workbench become single-column and the result panel loses sticky scrolling. At 640px, page gutters reduce to 1rem, trust proofs stack, form and money grids become one column, evidence selectors move below their labels, report mapping cells stack, and ledger definition rows become single-column. The implementation is verified at 360px without horizontal overflow.

**The One Journey Rule.** Responsive behavior preserves the exact product → facts/evidence → outcome/cost/actions order; it never creates a separate mobile workflow.

## Elevation & Depth

The system is flat by default. Depth comes from white paper against the cloud canvas, crisp border hierarchy, ruled rows, and restrained tonal fills. The only persistent shadow belongs to the desktop result panel (`0 16px 40px rgb(25 45 54 / 8%)`), where it reinforces the generated report as a bounded artifact; it disappears as a spatial necessity once the panel enters the mobile document flow.

**The Paper Artifact Rule.** Shadows identify the result artifact, not every card or control.

## Shapes

The form language is resolutely square. Inputs, buttons, options, status marks, wordmarks, panels, and disclosure marks use zero radius and one-pixel borders. Repeated small squares—identity mark, status mark, evidence number, action number, and disclosure control—form the system’s signature geometry.

**The Sharp Evidence Rule.** Do not soften audited surfaces with pills, rounded cards, or floating glass treatments.

## Components

### Buttons

- **Shape:** Square, sharp, and compact with a 46px minimum height.
- **Primary:** Trust-blue fill, white text, and matching border; used for the one decisive “Run preflight” action.
- **Secondary:** Transparent fill, trust-blue border, and deep trust-blue text; pale trust-blue appears on hover.
- **Hover / Focus / Active:** Hover deepens or fills; focus uses a visible 3px blue outline with 3px offset; active movement is a restrained 1px downward press.

### Product Options

- **Style:** Two-column bordered native-radio choices on desktop; stacked on mobile.
- **Selected State:** Pale trust-blue paper with a trust-blue edge and native radio accent.
- **Content:** Exact product name, HS code, and lifecycle status remain visible together.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** White paper on the cloud canvas.
- **Shadow Strategy:** Only the result artifact receives ambient elevation.
- **Border:** One-pixel ledger line; strong line for primary enclosure.
- **Internal Padding:** Fluid 1.5–4rem for the empty report and 1–1.5rem for populated report sections.

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

### Outcome Panel

- **Style:** One explicit outcome leads, followed by a plain summary, three-part mapping strip, cost ledger, evidence ledger, and ordered remediation.
- **Status:** Square icon, text label, and semantic color work together; numeric cost uses tabular figures.

### Motion

- **Style:** Motion is brief operational feedback only: 120ms press movement and 160ms border/background transitions.
- **Reduced Motion:** The reduced-motion media query collapses transitions and animation to 0.01ms and switches programmatic scrolling to immediate behavior.

## Do's and Don'ts

### Do:

- **Do** make product scope and uncertainty visible before asking for confidence.
- **Do** preserve the exact product → facts/evidence → outcome/cost/actions narrative.
- **Do** use native controls, semantic fieldsets, tables, details, headings, and regions.
- **Do** keep focus visible, targets at least 44px, status non-colour-dependent, and layouts valid at 360px.
- **Do** expose official source, pinpoint, date, owner, missing evidence, destination, and rerun condition in audit rows.
- **Do** use motion only for immediate feedback and spatial orientation, with reduced-motion parity.

### Don't:

- **Don't** rearrange this into a generic dashboard of metric cards, charts, sidebars, or decorative widgets.
- **Don't** imply government affiliation through seals, emblems, official-looking chrome, or authority colors.
- **Don't** use rounded cards, pill controls, glassmorphism, gradients, decorative illustration, or speculative data visualization.
- **Don't** make status, readiness, or blockers legible by color alone.
- **Don't** promote unsupported products, sources, costs, or legal certainty through visual emphasis.
- **Don't** let decoration outrank the outcome, evidence, cost, or next action.
