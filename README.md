# Securities-Based Lending Console — Before & After

An interactive UX portfolio demonstration of a securities-based lending (SBL)
console used by relationship bankers to originate lines of credit backed by a
client's investment portfolio. The prototype puts the **original console
(Before)** and a **redesigned workspace (After)** side by side, so you can
explore and compare both with the same fictional clients.

**Live demo:** https://rockysahooart.github.io/sbl-lending-console-demo/

> **Disclaimer.** This is an independent UX portfolio demonstration. All
> names, customer information, account details, loan amounts, collateral
> values, calculations, and financial data are entirely fictional and do not
> represent actual PNC customers, transactions, lending decisions, or
> financial figures. This is not an official PNC application. Security and
> compliance behaviours are simulated in the browser and are not production
> controls.

---

## Contents

1. [What's in the demo](#whats-in-the-demo)
2. [Using the demo](#using-the-demo)
3. [Running it locally](#running-it-locally)
4. [Building and deploying](#building-and-deploying)
5. [Project structure](#project-structure)
6. [How it works](#how-it-works)
7. [Documentation](#documentation)
8. [Accessibility](#accessibility)
9. [Limitations](#limitations)
10. [Credits](#credits)

---

## What's in the demo

The app has two stages:

1. **Preface & Context.** A short introduction: the business problems behind
   the redesign (scalability, workflow fragmentation, submission quality), my
   role, the reported outcomes (+55% submission volume, −30% completion
   time), and the controls for entering the prototype.
2. **Interactive prototype.** The full application, with a slim top bar for
   switching between Before and After, changing scenarios, and returning to
   the Preface.

### Before — the original console

The legacy experience, kept as the historical baseline: a loan dashboard,
an evaluation screen with auto and manual borrowing-power evaluation, a
multi-step application (customer, co-borrower, loan information,
collateral), submission, and a pending-review list.

### After — the same console, modernized

The business asked for modernization, not a new way of working. After keeps
Before's information architecture: the same screens, in the same order, with
the same sections, labels and actions where you'd expect them. It is rebuilt
with the **IBM Carbon Design System** (v11) in a PNC-style blue theme for
typography, spacing, colour, form controls, tables, feedback, accessibility
and interaction states.

| Before | After |
|---|---|
| Header: Securities Lending Console, page title, user | Same, as a Carbon UI shell |
| Menu: Evaluations, Pending Review | Same, plus **Active Credit** (servicing has no Before screen) |
| Console tabs: Pending Evaluations · Evaluations · Submitted Applications | Same tabs, toolbar (search by Application ID / Business Name / Primary Applicant, Filter, Last Updated sort), columns and expandable rows. Statuses reflect the request's real state. |
| Evaluation: Customer Details · Auto Evaluation · Manual Evaluation · Total Evaluation; Back · Generate PDF · Start Request | Same sections and footer. Account selection updates Maximum Borrowing Power immediately; concentrated positions appear in Manual Evaluation for credit officer review. |
| Acknowledgment Required (five acknowledgements, then the full acknowledgement) | Same dialog and wording, in Carbon |
| Steps 1–4: Customer Information · Co-borrowers · Loan Information · Collaterals; Back / Next, Submit on Collaterals | Same steps, sections and footer, in a three-column layout: step progress on the left, the step in the middle, **Application status** on the right |
| Loan Request Submitted | Same content (Download PDF, What happens next, Return to Console) |
| Pending Review: Post-Underwriting Review Queue | Same title, toolbar and columns; **Evaluate** opens the underwriting detail, including conditions |

What changed is presentation and behaviour, not the workflow:

- **Neutral surface hierarchy.** Each Carbon neutral has one job: White for
  the page, rows and form content; Gray 10 for bands (toolbars, section
  headings, pagination, supporting panels, expanded record detail); Gray 20
  for table column headers and the current record row; Gray 30 for the edges
  of bands; Gray 50 for strong rules (totals); Gray 70 and Gray 100 for
  secondary and primary text. IBM Blue is reserved for selection, focus and
  actions. An expanded record shares its row's Gray 10 and one continuous
  blue indicator, so the two read as a unit.

- **Application status panel** shows Requested Loan Amount against Total
  Maximum Borrowing Power and every open item, grouped by step, each linked
  to the field where it is completed.
- **Submit explains itself.** If anything is open, Submit lists the items in
  step order with **Go to** links instead of submitting an incomplete request.
- **Progress shows real state:** Completed, In progress, Not started, or the
  number of open items.
- **Corrections kept from compliance review:** no preselected answers, no
  spouse name and Regulation B marital-status values, Regulation U use of
  proceeds, beneficial/trust ownership, and corrected product values (Before
  shows "Texas" as the loan purpose and "Real Estate" as the security).
- **Underwriting conditions** appear as *Condition Requested* in Submitted
  Applications and Pending Review, with **Respond**; approval follows once
  they are provided.

### Additional fictional records (After only)

Beyond the three interactive scenarios, After lists additional **fictional
reference records** (`src/demo/after/records.ts`) so search, filters, sorting,
pagination and expandable rows can be tried at realistic volume:

- **Pending Evaluations / Evaluations:** 10 more requests (13 in all) covering
  a coverage shortfall, an expired co-borrower ID, missing beneficial-owner
  verification, a concentration limit awaiting manual evaluation, a pending
  credit officer approval, restricted stock, an uncertified trust, a pricing
  exception, a thin margin, and one request ready to submit. **Open**
  shows a read-only application record.
- **Submitted Applications / Pending Review:** 10 more (13 in all): in
  underwriting, condition requested, pending credit committee, approved and
  declined.
- **Active Credit:** 10 more lines (12 in all), including lines near the
  maintenance threshold and outstanding documents.

The Before experience does not read this file; its data is unchanged.

### Simulated safeguards (After only)

- Role-based access: **Relationship Banker** and **Credit Officer** roles
  with different permissions (segregation of duties for collateral reviews).
- Masked identifiers. Revealing an SSN requires a reason, is logged, and
  re-masks after 30 seconds. Credit Officers cannot reveal it.
- An audit trail of consequential events.
- A session timeout warning and sign-out.
- Validation before submission, plus confirmation dialogs for consequential
  actions.

---

## Using the demo

### Getting started

1. Open the [live demo](https://rockysahooart.github.io/sbl-lending-console-demo/)
   (or run it locally — see below).
2. On the Preface, choose **Start in: Before (original)** or **After
   (redesign)**, pick a **Scenario**, and select **Enter the prototype**.
3. Use the dark top bar at any time:
   - **← Preface** returns to the introduction.
   - The **scenario menu** switches between the three fictional cases.
   - **Before / After** switches experience. The same scenario opens at the
     equivalent step, and your progress in each experience is kept.

### Scenarios

| Scenario | Client | Requested amount | What it exercises |
|---|---|---|---|
| Single borrower | Daniel Okafor | $400,000 | The straightforward path: pledge accounts, structure the loan, submit. |
| Joint application | Elena Marquez + Thomas Reyes | $750,000 | Adding a co-borrower, an **expired ID** that blocks submission until updated, trust ownership certification. |
| Complex collateral | Northbridge Holdings LLC (signer Margaret Lindqvist) | $2,100,000 | Entity borrower with beneficial owners, restricted stock, and a concentrated position that needs **credit officer review**. |

### Walkthrough: complex collateral with credit officer review (After)

1. Enter the prototype in **After** with **Complex collateral**. In
   **Pending Evaluations**, select **Evaluate** for SBL-24-10933.
2. **Manual Evaluation** lists the concentrated position, and **Total
   Evaluation** states the shortfall against the requested loan amount.
3. Select **Request credit officer review**.
4. Open the user menu (avatar, top right) and change **Role (demo)** to
   **Credit Officer**.
5. Select **Complete review**, enter an advance rate between 35 and 60% and a
   rationale of at least 20 characters, then **Record review**. Maximum
   Borrowing Power updates and the change appears in the evaluation history.
6. Switch back to **Relationship Banker**, select **Start Request**, complete
   the acknowledgment, and work through the four steps. The Application
   status panel links to anything still open. **Submit** on Collaterals.
7. In **Pending Review**, try **Simulate a condition**: the request shows
   *Condition Requested* with **Respond** in Submitted Applications. Mark it
   as provided, then use **Simulate approval** and see the line in
   **Active Credit**.

### Session metrics

After you've used the prototype, the Preface shows **View session
metrics**: task time, screens visited, interactions, fields entered,
validation errors, and missing items at submission, for each experience and
scenario. These are measured from your own session only. They are not
production data and are separate from the reported historical outcomes.

### Testing the session timeout

The timeout is 15 minutes (warning at 13). To see it quickly, add
`?sessionSeconds=N` to the URL, for example:

```
https://rockysahooart.github.io/sbl-lending-console-demo/?sessionSeconds=20
```

### Resetting

All state is held in memory. Reload the page to start over.

---

## Running it locally

### Requirements

- **Node.js 22** (see `.mise.toml`)
- **pnpm 9** — the lockfile is pnpm v9 format. If you don't have pnpm
  installed, prefix commands with `npx pnpm@9`.

### Steps

```bash
git clone https://github.com/rockysahooart/sbl-lending-console-demo.git
```

```bash
cd sbl-lending-console-demo
```

```bash
npx pnpm@9 install
```

```bash
npx pnpm@9 dev
```

Then open **http://localhost:8443**. The port can be changed with the `PORT`
environment variable (`PORT=3000 npx pnpm@9 dev`).

> The Carbon packages run an IBM telemetry script on install. To opt out, set
> `IBM_TELEMETRY_DISABLED=true` before installing.

### Available scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Starts the Vite dev server with hot reload (port 8443). |
| `pnpm build` | Builds a production bundle into `dist/`. |
| `pnpm preview` | Serves the built `dist/` locally. |
| `npx tsc --noEmit -p .` | Type-checks the project. |

---

## Building and deploying

### Production build

```bash
npx pnpm@9 build
```

The output goes to `dist/`. The base path defaults to `/`. To build for a
subpath, set `FIGMA_PUBLIC_URL`:

```bash
FIGMA_PUBLIC_URL=/sbl-lending-console-demo npx pnpm@9 build
```

### GitHub Pages

Deployment is automatic. `.github/workflows/pages.yml` runs on every push to
`main` (and can be started by hand from the **Actions** tab):

1. Installs dependencies with pnpm 9 on Node 22.
2. Builds with `FIGMA_PUBLIC_URL=/<repository name>`, so asset paths work
   under `https://<user>.github.io/<repository>/`.
3. Publishes `dist/` to GitHub Pages.

If you fork or rename the repository, enable Pages under **Settings → Pages
→ Source: GitHub Actions**; the base path follows the repository name
automatically. GitHub Pages requires a public repository on the free plan.

---

## Project structure

```
src/
  main.tsx                 Browser entry point
  app/
    App.tsx                Root: demo context, console store, shell
    components/            BEFORE — the original console screens
    state/ConsoleStore.tsx State that persists across screen changes and toggles
  demo/
    Shell.tsx              Preface, prototype top bar, Before host, toggle and history sync
    sync.ts                Before ↔ After location map (screens, applications, tabs, rows)
    DemoContext.tsx        Mode, scenario, stage mapping, metrics instrumentation
    data.ts                Fictional clients, accounts, scenarios, disclaimer
    beforeData.ts          Data adapters for the original console
    engine.ts              Collateral evaluation, eligibility and readiness rules
    after/                 AFTER — the redesigned workspace
      AfterApp.tsx         Carbon UI shell, menu, roles, session timeout
      Console.tsx          Securities Lending Console (three tabs) and queue toolbar
      Evaluation.tsx       Evaluation screen and Acknowledgment Required dialog
      Record.tsx           Read-only record for the additional fictional applications
      records.ts           Additional fictional applications and credit lines (After only)
      guidance.ts          Next action, exceptions and warnings per request
      Workspace.tsx        Loan Request steps 1–4, status panel, Loan Request Submitted
      PostUnderwriting.tsx Pending Review and Active Credit
      state.ts             Request model, audit trail, roles
      ui.tsx               Carbon component wrappers
      carbon.scss          Carbon styles scoped to the After experience
  styles/                  Global styles (Tailwind v4)
docs/                      Internal design documentation (not shown in the app)
guidelines/                Project design guidelines
.github/workflows/         GitHub Pages deployment
```

### Tech stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4 (Before experience and demo shell)
- IBM Carbon Design System — `@carbon/react`, `@carbon/icons-react`, IBM
  Plex fonts (After experience)

---

## How it works

- **One app, two experiences.** The Before screens live in
  `src/app/components`; the After experience lives in `src/demo/after`.
  `Shell.tsx` hosts whichever is selected below the demo top bar.
- **Carbon is scoped.** All Carbon styles and theme tokens apply only inside
  `.sbl-after`, so the Before experience keeps its original look.
- **Shared fictional data.** Both experiences read the same scenarios from
  `src/demo/data.ts`, so numbers can be compared directly.
- **Context-aware toggle.** Each experience reports where the user is
  (screen, application, queue tab, expanded row, step). The toggle converts
  that through an explicit map (`src/demo/sync.ts`) and opens the equivalent
  in the other experience:

  | Where you are | Where the toggle takes you |
  |---|---|
  | Console tab + expanded row | Same tab, same row expanded |
  | Evaluation / Acknowledgment Required | Same application's Evaluation / the dialog open |
  | Steps 1–4 (including After's Beneficial / Trust Ownership) | Same step, same borrower (ownership → Co-borrowers) |
  | Loan Request Submitted | Submitted, or step 4 if not yet submitted there |
  | Before "View" on a submitted application | After Pending Review (credit lines: Active Credit) |
  | Pending Review with an application open | Same application open, where it exists in both queues |
  | After Active Credit line | Before Submitted Applications with that line expanded |
  | After-only fictional record | Before Pending Evaluations (closest parent) |

  Where no exact equivalent exists, the toggle opens the closest parent and
  remembers where you came from, so toggling straight back returns to the
  exact screen. The toggle never resets to the dashboard. Every screen change
  is also a browser history entry (for example
  `#/after/step/SBL-24-10904?step=2`), so Back and Forward work across both
  experiences.
- **Calculations.** `engine.ts` computes eligible collateral value as
  market value × advance rate for pledged, eligible holdings, applies
  concentration limits and credit officer reviews, and produces the
  readiness checklist. Advance rates and thresholds are fictional.
- **In-memory state.** Nothing is stored on a server or in browser storage;
  a reload resets everything. The URL hash records the current screen for
  browser history within a session.

---

## Documentation

Internal design documentation is kept out of the user interface:

- [`docs/content-standards.md`](docs/content-standards.md) — financial
  terminology, voice and style, message patterns, status vocabulary, and the
  strings that would need legal or compliance approval before production.
- [`docs/regulatory-and-security-notes.md`](docs/regulatory-and-security-notes.md)
  — how each safeguard relates to regulation (BSA/AML CIP, beneficial
  ownership, OFAC, Regulation B, Regulation U, GLBA, FCRA, E-SIGN), separated
  into regulation, supervisory expectation, internal policy and UX practice.
  It is a design summary, not legal advice.

---

## Accessibility

The After experience and the Preface target **WCAG 2.2 AA**: keyboard access
throughout, visible focus, labelled form controls, status shown with icon and
text (never colour alone), accessible dialogs, and a skip link. Automated
checks with axe-core report no violations on the Preface and the main After
screens. The Before experience is kept as the historical baseline and
received only minimal accessibility fixes.

---

## Limitations

- Front-end only. There is no authentication, server-side authorization,
  encryption, real audit logging, sanctions screening, identity
  verification, or records retention.
- Role switching is a demo control; in production, roles would come from an
  identity provider and be enforced on the server.
- Advance rates, review ranges, thresholds, and timeouts are illustrative.
- The Before experience intentionally preserves the original design,
  including patterns the redesign corrects (for example, its marital-status
  options).
- Reported outcomes (+55% submission volume, −30% completion time) are
  historical project results; this prototype does not reproduce or measure
  them.

---

## Credits

Design and prototype by the repository owner, the project's sole UX designer.

- [IBM Carbon Design System](https://carbondesignsystem.com/) (Apache 2.0)
- Components from [shadcn/ui](https://ui.shadcn.com/) under the
  [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- Photos from [Unsplash](https://unsplash.com) under the
  [Unsplash license](https://unsplash.com/license)

No license has been chosen for this repository's own code, so all rights are
reserved by default.
