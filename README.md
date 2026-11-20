# Securities-Based Lending Console — Before & After

An interactive UX case study by **Sarthak "Rocky" Sahoo**. It shows a
securities-based lending (SBL) console, used by loan officers to originate
lines of credit backed by a client's investment portfolio, in two versions:
the **original console (Before)** and Rocky's **redesign in IBM Carbon
(After)**, with the same fictional clients in both.

Rocky designed and directed the prototype. Its earlier versions were
implemented with Claude Code under his direction. Its latest round of review,
correction and verification was carried out by an **AI design team that he
conceived, created and directs**: seven specialized Claude subagents (design
mentor, visual design, interaction, mobile, motion, content integrity, QA and
accessibility). Each works from a persona charter Rocky wrote. Rocky set the
team's structure, roles, creative influences, philosophy and workflow, and
he keeps final authority over every design decision and deliverable.

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

1. [The design team](#the-design-team)
2. [Roles](#roles)
3. [Shared philosophy](#shared-philosophy)
4. [Collaborative workflow](#collaborative-workflow)
5. [Decision-making structure](#decision-making-structure)
6. [Project outcomes](#project-outcomes)
7. [Research: users, customers and the SBL workflow](#research-users-customers-and-the-sbl-workflow)
8. [What's in the demo](#whats-in-the-demo)
9. [Using the demo](#using-the-demo)
10. [Running it locally](#running-it-locally)
11. [Building and deploying](#building-and-deploying)
12. [Project structure](#project-structure)
13. [How it works](#how-it-works)
14. [Documentation](#documentation)
15. [Accessibility](#accessibility)
16. [Limitations](#limitations)
17. [Credits](#credits)

---

## The design team

This section describes who made the prototype and how the work is organized.

**Sarthak "Rocky" Sahoo** is the founder, creator, owner, lead designer and
creative director of this design team. In the original lending project he
was the sole UX designer (about three months). For this portfolio prototype
he designed a team to work alongside him. He:

- conceived the team and defined how it is organized;
- wrote a persona charter for each specialist: its responsibilities, the
  creative influences it draws on, and how it critiques work;
- wrote the shared design philosophy the team works from;
- designed the workflow, the rules for escalation and the file ownership
  that let specialists work in parallel;
- sets direction, priorities and standards, and approves or rejects every
  substantive change.

The specialists are **AI subagents**: Claude models prompted with Rocky's
charters. They are not people and they do not operate on their own. Each
runs only when Rocky's direction calls for it, inside the scope he
authorizes, and returns its work to him. They explore, critique, implement
and verify. Rocky decides.

The point of the team is the system itself. Rocky designed it so that
different specialist perspectives (visual, interaction, mobile, motion,
content, QA) would look at the same product separately and disagree where
they should. He then uses his own judgement to turn their findings into one
coherent direction.

## Roles

Each specialist covers one discipline. Rocky defined these roles and
assigns their work.

| Specialist | Specialization | What it does in a round |
|---|---|---|
| **Paul** | Design mentor and judge | Reviews the whole experience for coherence and design judgement, consolidates the other specialists' logs, and gives the final design review before Rocky decides. |
| **Iris** | Visual design lead | Colour use, type, spacing, composition and density; guards the neutral surface hierarchy and the rule that IBM Blue is used only for selection, focus and actions. |
| **Theo** | Interaction design | Navigation, state, focus and landing, recovery paths, and the context-aware Before/After toggle. |
| **Kenji** | Mobile UX | Reflow, touch targets and small screens (320–1440 px). |
| **Mara** | Motion | Transitions, landing cues and reduced-motion behaviour. |
| **Ada** | Content integrity | Copy, terminology, names, claims, provenance, fictional data, and the documentation (including this README). |
| **Felix** | QA and accessibility | Test suites, axe-core, keyboard and screen-reader paths; fixes the technical and accessibility defects he finds, then verifies everyone else's changes. |

The specialists have no authority over each other or over the product. Where
two of them disagree, Rocky decides.

## Shared philosophy

Rocky wrote the philosophy that every specialist reviews and works against.
In short:

- Design should make complexity understandable, useful and human. **Every
  decision needs a purpose**: functionality, information, emotion or
  experience.
- Understand complexity before simplifying it. In a lending tool much of the
  complexity is essential (regulation, credit risk, client protection), and
  the job is to make it legible, not to remove it.
- Beauty and usability work together. Reject novelty without purpose,
  decoration without meaning, and technology that ignores human needs.
- Protect what works and question what doesn't, with curiosity, honesty and
  generosity.
- Value evidence over assumptions, and mark judgement calls as judgement.
- Design succeeds when its **original intention survives implementation and
  earns the user's trust**. Human judgement gives design its meaning, systems
  give it integrity, and intentionality connects the two.

In practice, every finding and every fix in a round states its purpose and
its evidence: a screenshot, a test result, a code reference or a cited
source.

## Collaborative workflow

The team works in three stages that Rocky defined: **Review → Direct
Implementation → Verification**. There is no intermediary between a
specialist and the work.

1. **Review.** Each specialist reviews the running prototype through its own
   lens. It walks the After experience headlessly in a browser, reads the
   code, and writes a report with a verdict, what to protect, and numbered
   findings (for example `IRIS-01`, `ADA-03`). Each finding has a severity,
   evidence and the smallest effective correction. A **desk-research** pass
   on users, clients and the SBL workflow ran alongside the reviews (see
   [Research](#research-users-customers-and-the-sbl-workflow)).
2. **Direct implementation.** Following Rocky's charter, the findings are
   consolidated into one list and each is assigned to an owner. Each
   specialist implements corrections in its own discipline, directly:
   - **File lanes.** In each wave every specialist may edit only the files
     assigned to it, so parallel work never collides. Visual, interaction,
     mobile, motion and QA styles live in per-specialist partials
     (`src/demo/after/team/*.scss`). A fix that needs another lane's file is
     written up as a handoff, not made.
   - **Waves.** The work runs in waves, so a file changes hands only between
     waves.
   - **Escalation.** Routine corrections go ahead. Anything that changes
     creative direction, substantive copy (the Preface and its claims,
     compliance wording, metadata), major flows, scope or the production
     environment is logged as *escalated*, with the exact proposed change,
     for Rocky to decide.
   - **Boundaries.** The Before experience's behaviour is never changed;
     its presentation was re-skinned only at Rocky's direction (see "Before —
     the original console"). Nothing is committed, pushed or deployed without
     Rocky.
3. **Verification.** Felix checks every logged change, runs the suites
   (end-to-end, state, toggle sync, keyboard, axe-core) at several widths and
   fixes regressions. Paul does a final design review across the whole
   experience, makes small routine consistency fixes, and escalates anything
   substantive. Each specialist keeps a change log, and Paul consolidates them
   into [`docs/design-team-change-log.md`](docs/design-team-change-log.md)
   for Rocky's decision.

## Decision-making structure

- **Rocky decides.** He owns direction, priorities, standards and the final
  deliverables, and approves every substantive change: copy and claims,
  compliance wording, creative direction, user flows, scope, and anything
  that reaches production.
- **Specialists recommend and carry out.** Within their discipline and their
  assigned files, they may make routine corrections without asking. They
  cannot approve their own escalations, overrule each other or change the
  project's scope.
- **Paul advises on the whole.** He judges consistency across disciplines,
  may make small routine consistency fixes, and summarizes the round for
  Rocky. He does not decide for him.
- **Evidence settles disputes before taste does.** Findings that can't show
  evidence are marked as judgement, and Rocky weighs them as such.

## Project outcomes

This section separates results from the original project from the work done
on this prototype.

- **Original project (reported).** The original redesign reported a **55%
  increase in submission volume** and a **30% reduction in completion time**.
  These are historical results reported by that project. The prototype does
  not reproduce or measure them.
- **Earlier prototype iterations.** Before (a rebuild of the original
  console's screens with fictional data) and After (the Carbon redesign,
  through several versions) were produced under Rocky's direction, with
  Claude Code doing the implementation.
- **The design team's first review round (November 2026).** This was the
  first round run by the AI design team, under Rocky's direction and rules.
  Nothing from it has been committed or deployed; that is Rocky's decision.
  - **Review:** six specialist reviews (Paul, Iris, Theo with Mara, Kenji,
    Ada, Felix) and the desk research. Every reviewer returned *conditional
    pass*, except Mara, who returned *pass* with two small corrections.
  - **Direct implementation:** three waves. 89 logged corrections were
    completed (code, documentation, Figma spec frames and test updates)
    across visual design, interaction, mobile, motion, content, QA and the
    final review. Examples:
    - the selected scenario is tagged in the console;
    - the credit officer review can be completed in place with **Switch to
      Credit Officer** / **Switch to Loan Officer**;
    - the shortfall is shown in the Total Evaluation header;
    - one severity per open item before and after Submit;
    - Back returns to the row you came from;
    - focus lands on each new screen's heading;
    - the action column stays reachable on phones;
    - reduced motion is honoured throughout.
  - **Verification (Felix, re-run by Paul after his final fixes):**
    - end-to-end 61/61, state 34/34, toggle sync 34/34 and 10/10, keyboard
      20/20 and narrow-width 8/8 checks pass;
    - axe-core reports 0 violations on 20 tested states;
    - no horizontal overflow on 9 screens at 7 widths (320–1920 px);
    - a keyboard-only walk completes a request from Console to Submit;
    - the Before experience was pixel-identical to its baseline on 8
      screens at that point (it has since been re-skinned as legacy; see
      "Before — the original console").
  - **Final design review (Paul):** *pass*. Paul made four small consistency
    fixes during the review, and one of them (**Switch to Loan Officer**)
    is listed for Rocky to confirm. Two escalations should be decided before
    the next publish: the LTV alert wording and the page title.
  - **Open for Rocky:** 19 proposals were escalated rather than implemented,
    because they change approved copy, compliance wording, metadata, flows or
    scope. Examples:
    - the page title;
    - the LTV alert wording;
    - the Preface scenario helper;
    - several research-driven additions.

  The full record (each change, its owner, purpose and verification, the
  unresolved items, and the exact text of each escalation) is
  [`docs/design-team-change-log.md`](docs/design-team-change-log.md).

## Research: users, customers and the SBL workflow

This section summarizes desk research that grounds the design in how SBL
really works. It was carried out in the design team's review round, under
Rocky's direction. It uses public sources only; no real users were interviewed,
and nothing here describes PNC's data, systems or policy. The full report,
with proto-personas, a stage-by-stage workflow map, a problem list and the
complete source list, is in
[`docs/research-users-and-workflows.md`](docs/research-users-and-workflows.md).
Source numbers below match that report.

**The product.**
- An SBL line is a revolving line of credit secured by an investment account.
- It is usually *non-purpose*: the proceeds cannot buy or carry securities
  [[S1]][S1].
- Advance rates vary by asset class, roughly 50–65% for equities, 65–80% for
  corporate bonds and about 95% for Treasuries [[S2]][S2].
- The lender can change which collateral is eligible, issue a maintenance call
  that is typically due in two to three days, and sell collateral without
  notice [[S1]][S1] [[S2]][S2].

**Who uses the console.** These are proto-personas: hypotheses drawn from the
research, not findings.
- **Loan officer or private banker (primary user).** The client's main
  contact, often interrupted, handling a book of relationships.
- **Client service associate.** Often the person who actually fills in the
  application.
- **Credit officer or underwriter.** Values non-standard collateral and
  needs complete packages.
- **Supporting roles.** Closing and loan operations, BSA/AML and KYC
  reviewers, and collateral monitoring.

**Who borrows.** High-net-worth individuals, families, trusts and entities
who want cash without selling investments. Their main risks are maintenance
calls, forced liquidation, variable rates and concentration [[S1]][S1]
[[S2]][S2].

**Most of the complexity is essential.** Several steps are legal or
supervisory requirements, and a good console makes them quick and legible
rather than skipping them:
- customer identification [[S7]][S7];
- beneficial ownership for legal entities [[S8]][S8];
- Regulation U purpose statements for credit over $100,000 secured by margin
  stock [[S5]][S5];
- Regulation B limits on joint applicants [[S11]][S11];
- separating the banker's work from credit decisions and exception tracking
  [[S21]][S21].

**The unnecessary friction is real.**
- **Re-keying data across systems.** In one commercial-lending survey,
  nearly two-thirds re-enter a data point up to five times [[S17]][S17].
- **Incomplete packages** cause back-and-forth with credit [[S19]][S19].
- **Chasing missing items** is the most-cited follow-up problem (65%)
  [[S17]][S17].

These figures come from commercial lending, not SBL; applying them to SBL is
the team's inference.

**What this means for the design.** The redesign's story is not "fewer
steps". It is *the same essential steps, made legible*. Several things are
already in the prototype:
- a read-only client record;
- a readiness checklist with links to where each item is fixed;
- a credit-officer-only concentration review;
- blocking on an expired ID;
- ownership certification;
- a Regulation U step;
- LTV alerts;
- an audit trail.

The research also found gaps: when values were priced, how long a request has
waited, cure deadlines on maintenance calls, and recording that the SBL risk
disclosure was delivered. These are proposed changes awaiting Rocky's
decision.

[S1]: https://www.finra.org/investors/insights/securities-backed-lines-credit
[S2]: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/investor-28
[S5]: https://www.law.cornell.edu/cfr/text/12/221.3
[S7]: https://www.law.cornell.edu/cfr/text/31/1020.220
[S8]: https://www.law.cornell.edu/cfr/text/31/1010.230
[S11]: https://www.law.cornell.edu/cfr/text/12/1002.7
[S17]: https://www.abrigo.com/blog/lending-obstacles-manual-processes-despite-digital-pushes/
[S19]: https://bakerhill.com/blog/fostering-collaboration-between-lending-credit-teams/
[S21]: https://occ.gov/publications-and-resources/publications/comptrollers-handbook/files/loan-portfolio-management/pub-ch-loan-portfolio-mgmt.pdf

---

## What's in the demo

The prototype is Rocky's case study: Before is the baseline he redesigned,
and After is his redesign. The app has two stages, each with its own purpose:

1. **Preface & Context.** A short introduction: the business problems behind
   the redesign (scalability, workflow fragmentation, submission quality),
   Rocky's role, the reported outcomes (+55% submission volume, −30%
   completion time), and the controls for entering the prototype.
2. **Interactive prototype.** The full application, with a slim top bar for
   switching between Before and After, changing scenarios, and returning to
   the Preface.

### Before — the original console

The legacy experience, kept as the historical baseline. At Rocky's direction it
is presented as the dated enterprise system it was: compact system type,
equal-weight beveled buttons, gray grid tables, plain step tabs with no
completion state, an application header repeated on every step, and an
underwriter memo whose conditions are answered in free-text comments, separate
from the decision. Its workflow, data and behaviour are unchanged, so every task
still completes and the Before/After toggle opens the equivalent screen. The
skin lives in `src/app/legacy.css`, scoped to Before. It covers:
- a loan dashboard;
- an evaluation screen with auto and manual borrowing-power evaluation;
- a multi-step application (customer, co-borrower, loan information,
  collateral);
- submission;
- a pending-review list.

### After — the same console, modernized

The business asked for modernization, not a new way of working. After keeps
Before's information architecture: the same screens, in the same order, with
the same sections, labels and actions where you'd expect them. It is rebuilt
with the **IBM Carbon Design System** (v11) in a PNC-style blue theme, which
handles typography, spacing, colour, form controls, tables, feedback,
accessibility and interaction states.

| Before | After |
|---|---|
| Header: Securities Lending Console, page title, user (Loan Officer) | Same, as a Carbon UI shell |
| Menu: Evaluations, Pending Review | Same, plus **Active Credit** (servicing has no Before screen) |
| Console tabs: Pending Evaluations · Evaluations · Submitted Applications | Same tabs, toolbar (search by Application ID / Business Name / Primary Applicant, Filter, Last Updated sort), columns and expandable rows. Statuses reflect the request's real state. The scenario you chose is tagged **Selected scenario**; reference records open read-only with **Open**. |
| Evaluation: Customer Details · Auto Evaluation · Manual Evaluation · Total Evaluation; Back · Generate PDF · Start Request | Same sections and footer. Selecting an account updates Maximum Borrowing Power immediately; concentrated positions appear in Manual Evaluation for credit officer review. |
| Acknowledgment Required (five acknowledgements, then the full acknowledgement) | Same dialog and the same five acknowledgements, in Carbon |
| Steps 1–4: Customer Information · Co-borrowers · Loan Information · Collaterals; Back / Next, Submit on Collaterals | Same steps, sections and footer, in a three-column layout: step progress on the left, the step in the middle, **Application status** on the right. Below 1024 px the progress folds into a **Step n of 4** control and a link to the Application status. |
| Loan Request Submitted | Same content (Download PDF, What happens next, Return to Console) |
| Pending Review: Post-Underwriting Review Queue | Same title, toolbar and columns; **Evaluate** opens the underwriting detail, including conditions |

What changed is presentation and behaviour, not the workflow:

- **White canvas, purposeful neutrals.** White is the canvas for pages,
  rows, toolbars, pagination, section headings and side panels (separated by
  hairline rules, not grey slabs). Gray is used only where it organises:
  table column headers (Gray 10 with a strong rule), the expanded record
  detail and the selected row. Colour carries meaning only: status,
  selection, focus and action.
- **Application status panel.** Shows Requested Loan Amount against Total
  Maximum Borrowing Power, and every open item grouped by step, each linked
  to the field where it is completed.
- **Prerequisites with explanations.** Next stays disabled until the current
  step's required items are complete; later steps show "Complete <step>
  first"; Submit stays disabled until every check is complete; Start Request
  needs at least one eligible account. The reason always sits beside the
  disabled control, with links to each missing item. Back and draft saving are
  never blocked. See [Application lifecycle and guidance](#application-lifecycle-and-guidance).
- **Corrections kept from compliance review:**
  - no preselected answers;
  - no spouse name, and Regulation B marital-status values;
  - Regulation U use of proceeds;
  - beneficial and trust ownership;
  - corrected product values (Before shows "Texas" as the loan purpose and
    "Real Estate" as the security).
- **Underwriting outcomes.** Conditions appear as *Action Required ·
  Additional information requested* with **Respond to condition**; a request
  can also be returned for correction, declined or approved, and keeps its
  submission history throughout.

### Application lifecycle and guidance

*This section stands on its own: every After screen uses one lifecycle model
(`src/demo/after/lifecycle.ts`), so a status, a count, a queue and a next
action can never disagree.*

| Status | What it means | Where it appears |
|---|---|---|
| Not Started | Opportunity created; nothing evaluated yet | Pending Evaluations |
| In Progress | Being evaluated or completed; nothing blocking | Pending Evaluations (evaluation stage) or Evaluations |
| Action Required | A specific correction or response is needed (for example an expired co-borrower ID, a collateral shortfall, incomplete beneficial ownership, a collateral review, a return for correction, an underwriting condition) | Evaluations, or Submitted Applications when underwriting asked |
| Ready to Submit | Every readiness check is complete | Evaluations |
| Submitted | With Credit Underwriting, awaiting pickup | Submitted Applications · Pending Review |
| Under Review | Underwriting or the credit committee is reviewing it | Submitted Applications · Pending Review |
| Approved | Approved; documents being signed | Submitted Applications · Active Credit |
| Declined | Declined by Credit Underwriting | Submitted Applications · Pending Review |
| Completed | Booked; the line is active | Submitted Applications · Active Credit |

- **Colour is never the only signal.** Each status is a Carbon tag with its
  own colour, an icon and its words, plus a one-line reason ("Expired
  co-borrower ID").
- **Specific next actions.** Rows say what to do ("Start Application",
  "Update co-borrower ID", "Resolve the shortfall", "Submit Application",
  "Respond to condition"), not "Review application". The action opens the
  exact field, marks it, and explains the correction; once it is resolved,
  the callout confirms it and offers the next item.
- **Everything updates together.** Completing a requirement updates the
  status, the queue the application sits in, the tab counts, the progress
  navigation, the Application status panel and button availability.
- **Returned for correction.** A returned request goes back to Evaluations
  as Action Required. The corrections are editable, the previously submitted
  values are shown read-only, the submission history is kept, and
  **Resubmit** unlocks once every correction is made.
- **One emphasised action per view.** Row actions are quiet links; the
  expanded record's next action and the step's Next or Submit are the primary
  buttons.

This lifecycle round was specified by Sarthak "Rocky" Sahoo and implemented
by Claude Code; Felix (QA and accessibility) verifies it against WCAG 2.2 AA.

### Additional fictional records (After only)

Beyond the three interactive scenarios, After lists additional **fictional
reference records** (`src/demo/after/records.ts`), so search, filters,
sorting, pagination and expandable rows can be tried at realistic volume:

- **Pending Evaluations / Evaluations:** 10 more requests (13 in all). They
  cover:
  - a coverage shortfall;
  - an expired co-borrower ID;
  - missing beneficial-owner verification;
  - a concentration limit awaiting manual evaluation;
  - a pending credit officer approval;
  - restricted stock;
  - an uncertified trust;
  - a pricing exception;
  - a thin margin;
  - one request ready to submit.

  **Open** shows a read-only application record, labelled as a fictional
  reference record.
- **Submitted Applications / Pending Review:** 10 more (13 in all): in
  underwriting, condition requested, pending credit committee, approved and
  declined.
- **Active Credit:** 10 more lines (12 in all), including lines near the
  maintenance threshold and outstanding documents.

The Before experience does not read this file; its data is unchanged.

### Simulated safeguards (After only)

These show how the redesign would handle security and oversight. They are
simulated in the browser:

- Role-based access: **Loan Officer** and **Credit Officer** roles with
  different permissions (segregation of duties for collateral reviews).
- Masked identifiers. Revealing an SSN requires a reason, is logged, and
  re-masks after 30 seconds. Credit Officers cannot reveal it.
- An audit trail of consequential events, with time, user and role.
  Simulated underwriting conditions and decisions are recorded as Credit
  Underwriting, not as the loan officer.
- A session timeout warning and sign-out.
- Validation before submission, plus confirmation dialogs for consequential
  actions.

---

## Using the demo

This section explains how to move around the prototype and what each
scenario exercises.

### Getting started

1. Open the [live demo](https://rockysahooart.github.io/sbl-lending-console-demo/)
   (or run it locally — see below).
2. On the Preface, choose **Start in: Before (original)** or **After
   (redesign)**, pick a **Scenario**, and select **Enter the prototype**.
3. Use the dark top bar at any time:
   - **← Preface** returns to the introduction.
   - The **scenario menu** switches between the three fictional cases.
   - **Before / After** switches experience. The same scenario opens at the
     equivalent step, and your progress in each experience is kept. With a
     keyboard it is one Tab stop; the arrow keys move between Before and
     After.

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
4. Change to the **Credit Officer** role: select **Switch to Credit Officer**
   next to the review request, or open the user menu (avatar, top right)
   and change **Role (demo)**.
5. Select **Complete review**, enter an advance rate between 35 and 60% and a
   rationale of at least 20 characters, then **Record review**. Maximum
   Borrowing Power updates and the change appears in the evaluation history.
6. Select **Switch to Loan Officer** next to the recorded review (or use the
   user menu), then **Start Request**, complete the acknowledgment, and work
   through the four steps. The Application status panel links to anything
   still open. **Submit** on Collaterals. (If you reach Collaterals as the
   Credit Officer, the same **Switch to Loan Officer** appears there.)
7. In **Pending Review**, try **Simulate a condition**: the request shows
   *Condition Requested* with **Respond** in Submitted Applications. Mark it
   as provided, then use **Simulate approval** and see the line in
   **Active Credit**.

### Session metrics

After you've used the prototype, the Preface shows **View session
metrics**. It lists, for each experience and scenario:
- task time;
- screens visited;
- interactions;
- fields entered;
- validation errors;
- missing items at submission.

These are measured from your own session only. They are not production data
and are separate from the reported historical outcomes.

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

This section is for running the prototype on your own machine.

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

This section covers the production build and the GitHub Pages deployment.

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

Because a push to `main` deploys the public portfolio, the design team does
not commit, push or deploy. Only Rocky does.

---

## Project structure

Where each part of the prototype lives:

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
      state.ts             Request model, audit trail, roles and role display names
      ui.tsx               Carbon component wrappers
      carbon.scss          Carbon styles scoped to the After experience
      team/*.scss          Per-specialist style partials (visual, interaction, mobile, motion, QA)
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

This section explains the main technical decisions.

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
- **Page titles and focus (After).** Each After screen sets its own browser
  tab title (for example "Pending Review — Securities Lending Console
  (After)"), and focus moves to the new page's heading after navigation.
- **Calculations.** `engine.ts` computes eligible collateral value as
  market value × advance rate for pledged, eligible holdings. It also applies
  concentration limits and credit officer reviews, and produces the readiness
  checklist. Advance rates and thresholds are fictional.
- **In-memory state.** Nothing is stored on a server or in browser storage;
  a reload resets everything. The URL hash records the current screen for
  browser history within a session.

---

## Documentation

Internal design documentation is kept out of the user interface. Ada, the
team's content-integrity specialist, maintains it under Rocky's direction,
and Rocky approves any substantive change:

- [`docs/content-standards.md`](docs/content-standards.md) — financial
  terminology, the rule for labels kept from Before, voice and style, message
  patterns, status vocabulary, and the strings that would need legal or
  compliance approval before production.
- [`docs/regulatory-and-security-notes.md`](docs/regulatory-and-security-notes.md)
  — how each safeguard relates to regulation (BSA/AML CIP, beneficial
  ownership, OFAC, Regulation B, Regulation U, GLBA, FCRA, E-SIGN). Each item
  is classed as regulation, supervisory expectation, internal policy or UX
  practice. It is a design summary, not legal advice.
- [`docs/research-users-and-workflows.md`](docs/research-users-and-workflows.md)
  — desk research on internal users, clients, the SBL workflow, problems and
  design implications, with sources.
- [`docs/design-team-change-log.md`](docs/design-team-change-log.md) — the
  design team's consolidated record for the current round: who changed what
  and why, verification, unresolved items and escalations for Rocky.

---

## Accessibility

This section states the accessibility target and where it stands.

The After experience and the Preface target **WCAG 2.2 AA**:
- keyboard access throughout;
- visible focus;
- labelled form controls;
- status shown with icon and text (never colour alone);
- accessible dialogs;
- a skip link.

**Verified in the November 2026 design-team round.** Felix, the team's QA
and accessibility specialist, verified these results. Paul re-ran the suites
after his final fixes.
- **Automated:** axe-core reports 0 violations on 20 tested states of the
  Preface and After, and 0 computed contrast violations on 7 key screens.
- **Focus defects fixed:** the QA review found defects that automated tools
  can't detect, and all are now fixed and verified:
  - focus moves to the new page's heading after every navigation;
  - closed menus and panels no longer leave hidden tab stops;
  - the Console and Evaluation have page headings;
  - the signed-out screen receives focus;
  - the Before/After toggle is one Tab stop with arrow-key selection.
- **Keyboard:** a keyboard-only walk completes a request from Console to
  Submit.
- **Small screens and touch:** no horizontal overflow on 9 screens at 7
  widths (320–1920 px). Touch targets are 44 px on coarse pointers, and the
  demo bar is 40 px.
- **Reduced motion:** honoured. The only animation left is a short landing
  highlight, and it is off when reduced motion is requested.
- **Accepted exception:** the Step 4 collateral table scrolls sideways
  inside its container at 1024 px (a data table, which WCAG 1.4.10 allows).

Details and evidence are in
[`docs/design-team-change-log.md`](docs/design-team-change-log.md). These are
automated and expert checks, not testing with assistive-technology users.

The Before experience is kept as the historical baseline and received only
minimal accessibility fixes.

---

## Limitations

What the prototype does not do:

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
- The research is desk research from public sources. Its personas are
  hypotheses, not findings from user interviews.

---

## Credits

Design, direction and prototype: **Sarthak "Rocky" Sahoo**, with the AI
design team he created and directs (Claude subagents working from his
persona charters). Earlier implementation was done by Claude Code under his
direction.

- [IBM Carbon Design System](https://carbondesignsystem.com/) (Apache 2.0)
- Component source from [shadcn/ui](https://ui.shadcn.com/) in
  `src/app/components/ui`, under the
  [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)

No license has been chosen for this repository's own code, so all rights are
reserved by default.
