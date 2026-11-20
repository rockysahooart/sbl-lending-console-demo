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

### After — the redesigned workspace

Built with the **IBM Carbon Design System** (v11), adapted to a PNC-style
blue theme:

- **Pipeline** grouped by who needs to act next (you, ready to submit,
  another team), led by the highest-priority request and a specific next
  action for every row. **New request** starts from the client directory and
  sends you to any request already in progress instead of duplicating it.
- **Request workspace** in three views — Client and parties, Collateral and
  terms, Review and submit — with a status panel that always shows the next
  step, the financial summary and readiness.
- **Conversation view** for the client step: verify who you're speaking
  with, then ask only what isn't already on file, with talking points to
  hand. The full record is one switch away.
- **Collateral and terms** keeps pledging, evaluation, exceptions and the
  requested amount on one view, so the amount is set next to the borrowing
  power it depends on.
- **Live collateral evaluation.** Pledging an account updates estimated
  borrowing power immediately; restricted stock is not eligible and
  concentrated single-issuer positions are flagged for credit officer
  review. Calculation details and an estimate history explain every number.
- **Underwriting** returns conditions to the banker's queue ("Respond to
  condition"); the decision follows once they are provided.
- **Active credit** leads with lines that need attention; LTV alerts and
  document follow-up are handled inline.

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

1. Enter the prototype in **After** with **Complex collateral**, and open
   Northbridge Holdings LLC from the pipeline.
2. The pipeline's **Review collateral** opens **Collateral and terms**. The concentrated position is flagged
   *Review required* and estimated borrowing power falls short of the
   requested amount.
3. Select **Request credit officer review**.
4. Open the user menu (avatar, top right) and change **Role (demo)** to
   **Credit Officer**.
5. Select **Complete review**, enter an advance rate between 35 and 60% and a
   rationale of at least 20 characters, then **Record review**. Borrowing
   power updates and the change appears in the estimate history.
6. Switch back to **Relationship Banker**, complete the remaining readiness
   items, and **Submit to underwriting**.
7. In **Underwriting**, try **Simulate a condition**: the request returns to
   your pipeline as **Respond to condition**. Mark it as provided, then use
   **Simulate approval** and see the line in **Active credit**.

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
    Shell.tsx              Preface, prototype top bar, Before host, session metrics
    DemoContext.tsx        Mode, scenario, stage mapping, metrics instrumentation
    data.ts                Fictional clients, accounts, scenarios, disclaimer
    beforeData.ts          Data adapters for the original console
    engine.ts              Collateral evaluation, eligibility and readiness rules
    after/                 AFTER — the redesigned workspace
      AfterApp.tsx         Carbon UI shell, navigation, roles, session timeout
      Pipeline.tsx         Pipeline and New request
      guidance.ts          Next action, exceptions and warnings per request
      Workspace.tsx        Request workspace (three views + status panel)
      PostUnderwriting.tsx Underwriting and Active credit
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
- **Equivalent steps.** Toggling Before/After maps the current step to its
  closest counterpart (for example, Before's evaluation maps to After's
  collateral section).
- **Calculations.** `engine.ts` computes eligible collateral value as
  market value × advance rate for pledged, eligible holdings, applies
  concentration limits and credit officer reviews, and produces the
  readiness checklist. Advance rates and thresholds are fictional.
- **In-memory state.** Nothing is stored on a server or in browser storage;
  a reload resets everything.

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
