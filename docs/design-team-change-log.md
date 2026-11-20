# Design team change log: review round 1 (November 2026)

This is the consolidated record of the first review-and-correction round run by the AI design team that **Sarthak "Rocky" Sahoo** conceived, created and directs. It records:
- what each specialist changed, and why;
- how it was verified;
- what is still open;
- the escalations that wait for Rocky's decision.

Paul consolidated it from the specialists' own logs at the final design review. The specialists are Claude subagents working from Rocky's persona charters, inside the scope he authorized. Nothing in this round was committed, pushed or deployed. That is Rocky's decision.

## 1. Purpose and workflow of the round

**Purpose.** The round's purpose was to correct the After experience, the demo bar and the documentation where the review found problems, within Rocky's approved direction:
- **Modernize, don't reinvent:** After keeps Before's information architecture.
- **One accent:** IBM Blue only for selection, focus and actions.
- **Realistic, fictional data.**
- **A context-aware Before/After toggle.**

Every change states its purpose in the terms of Rocky's philosophy: functionality, information, emotion or experience.

**Workflow: Review → Direct Implementation → Verification.** Rocky defined these three stages.

1. **Review.** Six specialist reviews and a desk-research pass:
   - Paul: overall judgement;
   - Iris: visual design;
   - Theo with Mara: interaction and motion;
   - Kenji: mobile;
   - Ada: content integrity;
   - Felix: QA and accessibility.

   All returned *conditional pass*, except Mara, who returned *pass*. The findings were consolidated into one assignment list, with an owner for each.
2. **Direct implementation.** Each specialist corrected its own discipline directly, in three waves:
   - **File lanes.** Each owner edited only the files assigned to it for that wave, plus a personal stylesheet partial in `src/demo/after/team/*.scss`.
   - **Handoffs.** A fix that needed another lane's file was written up as a HANDOFF.
   - **Routine corrections** went ahead.
   - **Escalations.** Anything that changed approved copy or claims, compliance wording, metadata, major flows, creative direction or scope was **ESCALATED** with the exact proposed change, and not implemented.
3. **Verification.** Felix:
   - verified every logged change;
   - applied open handoffs;
   - fixed the regressions he found;
   - updated test expectations for intended changes;
   - ran every suite.

   Paul then did the final design review across the whole experience. He made four small consistency fixes and re-ran the suites.

**Authority.** Rocky owns direction, priorities, standards and every final deliverable. The specialists explore, critique, implement routine corrections and verify. They do not approve their own escalations or overrule one another. Where they disagree, the disagreement is recorded below for Rocky.

**Boundaries kept.**
- The Before experience (`src/app/components/**`) was not changed. Felix's pixel comparison confirms it.
- The Preface copy and claims were not changed.
- No git, build or deploy.
- Figma edits were limited to the After V6 page (`592:10`) of file `kP5wUF63gtzu8ZQA72JJyc`.

## 2. Changes by owner

**Status key**
- **DONE:** implemented by the owner.
- **FIXED:** a defect corrected during verification.
- **HANDOFF → X:** applied by owner X; the row says where.
- **ESCALATED:** not implemented; see section 4.
- **DEFERRED:** moved to a later wave.

**Verification key**
- **VERIFIED:** Felix's checks (`scratchpad/review/felix/verify/`).
- **Suites:** the regression suites listed in section 3.

Each specialist's full log, with line numbers, is in the round's working folder: `scratchpad/review/log/<name>.md`.

### Iris (visual design lead)

| ID | Change | Files / Figma nodes | Purpose | Status | Verification |
|---|---|---|---|---|---|
| I1 | Co-borrower ID grid reflowed. Screening moved to its own row, and tags wrap inside their column. | `Workspace.tsx`, `team/iris.scss` | Information/trust: the sanctions result is readable and no longer slides under the status panel | DONE | VERIFIED: tags end at x 1030, before the aside at 1068 |
| I2 | Step 1 Total Maximum Borrowing Power figure changed from blue to primary text. | `Workspace.tsx`; Figma V6-04 `594:53` | Information: blue keeps one meaning (you can act) | DONE | VERIFIED: #161616 |
| I3 | "View Evaluation" link sized to its sentence. | `Workspace.tsx` | Hierarchy | DONE | VERIFIED (visual) |
| I4 | Record grids from 6 to 4 columns; identity block reflow. | `Workspace.tsx`, `team/iris.scss` | Legibility: no 4-line "towers" | DONE | VERIFIED (visual) |
| I5 | Loan Details, Booking and ACH controls share one baseline per row. | `Workspace.tsx`, `team/iris.scss` | Experience: the form reads in rows | DONE | VERIFIED: field tops equal per row |
| I6 | Owner line under each collateral shown only when owners differ. | `Workspace.tsx` | Legibility: five accounts fit on one screen | DONE | VERIFIED (visual) |
| I7 | One severity per state (with PAUL-05). Before Submit, open items are a neutral grey "!". After Submit, they are red, listed once in the main column, and the panel summarizes "N open: listed in the main column". | `Workspace.tsx`, `team/iris.scss` | Information/trust: one item, one severity, one list | DONE | VERIFIED; screen-reader wording aligned in V-6 |
| I8 | Customer avatar changed from solid blue to white with a Gray 30 edge. | `team/iris.scss` | Meaning: blue only for actions | DONE | VERIFIED |
| I9 / W2-8 | One account mask, `••••NNNN`, in Active Credit and the Evaluation tiles. | `PostUnderwriting.tsx` | Consistency and trust | DONE (wave 2) | VERIFIED |
| I10 | Collateral table header renames. | — | Legibility | ESCALATED (E-11) | — |
| W2-1 | Total Evaluation figures changed from blue to primary text; the total is semibold. | `Evaluation.tsx`; Figma V6-03 `593:223/227/231` | Information | DONE | VERIFIED |
| W2-2 | PAUL-04: "$96,000 short of $2,100,000" under the Total Evaluation header amount. The duplicate concentration rationale is removed while under review. | `Evaluation.tsx` | Information: the outcome is visible where the decision is made | DONE | VERIFIED; seen in the final review |
| W2-3 | FELIX-10: the ineligible tile label is readable (#525252, 7.8:1). | `Evaluation.tsx`, `team/iris.scss` | Information/accessibility | DONE | VERIFIED |
| W2-4 | PAUL-01: **Selected scenario** outline tag on the chosen row. Read-only reference records always say **Open**. | `Console.tsx` | Functionality: the first click finds the chosen scenario | DONE | VERIFIED: one tag; 10960 shows "Open" |
| W2-5 | IRIS-03: Respond, the Pending Review Evaluate and outreach buttons are tertiary (no wall of blue). | `Console.tsx`, `PostUnderwriting.tsx` | Hierarchy | DONE | VERIFIED, with the V-5 contrast fix |
| W2-6 | Active Credit detail rule changed from blue to Gray 50. The in-limit coverage bar is green. | `PostUnderwriting.tsx` | Meaning | DONE | VERIFIED |
| W2-7 | Needs attention explanations aligned on one edge. | `PostUnderwriting.tsx` | Scanning | DONE | VERIFIED (visual) |
| W2-9 | No focus box after a mouse click on a tab. | `team/iris.scss` | Experience | DONE | VERIFIED |
| W2-10 | Repeated "decision due" line removed. | (Theo, PAUL-08) | — | DONE (Theo) | VERIFIED |
| W2-11 | Product name shown twice in the Console header. | `AfterApp.tsx` | Experience | HANDOFF → Felix (V-2) | VERIFIED |
| W2-12 | Expanded-row open items use the neutral icon, matching I7. | `Console.tsx` | Information: one severity across screens | DONE | VERIFIED |
| W2-13 | Fixed "Last Updated:Newest First" spacing (a regression from K1-4). | `Console.tsx` | Experience | DONE | VERIFIED |

### Theo (interaction design)

| ID | Change | Files / Figma nodes | Purpose | Status | Verification |
|---|---|---|---|---|---|
| THEO-01 | The user menu panel opens at full height (it was 0 px). | `team/theo.scss` | Functionality: the role switch and Sign out are reachable | DONE | VERIFIED: 228 px |
| PAUL-02 | **Switch to Credit Officer** next to "Awaiting credit officer review". It uses the same role change and audit entry as the user menu, and focus moves to Complete review. | `Evaluation.tsx` | Functionality and experience: the segregation-of-duties loop is completable in the demo | DONE (button); helper sentence ESCALATED (E-9) | VERIFIED |
| THEO-03 | Evaluation Back returns to the Console with the row expanded. | `Evaluation.tsx` | Experience: keep the officer's place | DONE | VERIFIED |
| THEO-04 | Selecting an Active Credit line brings its detail into view and focuses it. | `PostUnderwriting.tsx` | Information | DONE | VERIFIED: top 139 px |
| THEO-05 | Shared `landOn()`: scrolls only the app, focuses the target and marks it for the landing cue. Pending Review Evaluate lands on the detail. | `Evaluation.tsx`, `PostUnderwriting.tsx`, `team/theo.scss` | Information: "you are here" after every jump | DONE | VERIFIED |
| PAUL-08 | Reference detail says **Back to Pending Review** and returns to the row. The repeated note is removed. | `PostUnderwriting.tsx` | Experience | DONE | VERIFIED |
| THEO-08 | "Simulate a condition" is shown only while no condition is open. | `PostUnderwriting.tsx` | Storytelling: the demo loop can't drift into nonsense states | DONE | VERIFIED (e2e3) |
| FELIX-08 | Active Credit heading outline fixed: h2 "All credit lines". | `PostUnderwriting.tsx` | Information/accessibility | DONE | VERIFIED: no heading skips |
| Figma | New frame **V6-09 · Interaction & motion rules**; updated in wave 3. | Figma `600:97` (text nodes `600:99/114/132/134`) | Information: an implementation-ready spec | DONE | Node check |
| W3-1 | THEO-02: step anchors and blocked Submit use `landOn`. The app header never scrolls away, and the landing is outlined. | `Workspace.tsx` | Experience/trust | DONE | VERIFIED |
| W3-2 | Record has one Back, to the row. Confirmation "Return to Console" opens Submitted Applications with the request expanded. | `Record.tsx`, `Workspace.tsx` | Experience | DONE | VERIFIED (e2e3 updated) |
| W3-3 | ADA-08: an expired co-borrower ID reads "Identity on file {date} · ID expired", not "verified". | `Workspace.tsx` | Information/trust | DONE | VERIFIED |
| W3-4 | Trust ownership intro and "Share" column for trusts. | `Workspace.tsx` | Information/compliance | DONE | VERIFIED |
| W3-5 | The compact-step chevron honours reduced motion. | `Workspace.tsx` | Accessibility | DONE | tsc |
| W3-6 | THEO-06: a completed acknowledgment never reappears on Back. | — | Experience | HANDOFF → Felix (V-1) | VERIFIED |

### Mara (motion)

| ID | Change | Files | Purpose | Status | Verification |
|---|---|---|---|---|---|
| MARA-01 | A 700 ms landing highlight on programmatic jump targets. It runs only when motion is allowed, and scrolling stays instant. | `team/mara.scss` | Information: the eye finds the target | DONE | VERIFIED; none under reduced motion |
| MARA-02 | Reduced motion is honoured for the modal, side nav, overlay, header panel, accordion and table chevrons. | `team/mara.scss` | Accessibility | DONE | VERIFIED |
| MARA-03 | Status bars ease over 110 ms when collateral changes. | `team/mara.scss` | Information: cause and effect | DONE | VERIFIED by code |
| MARA-04 | The Evaluation chevron snaps with its section. | `Evaluation.tsx` | Integrity: one signal, one timing | DONE | VERIFIED |

Mara deliberately added no smooth scrolling and no page transitions: there is no human need for them, and they slow repeat use.

### Kenji (mobile UX)

| ID | Change | Files / Figma nodes | Purpose | Status | Verification |
|---|---|---|---|---|---|
| K1-1 | Below 1280 px the queue Actions column is pinned, so the action that advances work stays visible. | `team/kenji.scss` | Functionality | DONE | VERIFIED at 375 |
| K1-2 | An expanded row's detail fits the visible table width. | `team/kenji.scss` | Information | DONE | VERIFIED |
| K1-3 | 44 px touch targets on coarse pointers. | `team/kenji.scss` | Functionality | DONE | VERIFIED |
| K1-4 | Filter and Sort share one row on phones. The visible sort label is shortened, and its accessible name is unchanged. | `Console.tsx` | Experience | DONE | VERIFIED; spacing regression fixed by Iris (W2-13) |
| K1-5 | Pagination and demo bar fit at 320 px. | `team/kenji.scss`, `Shell.tsx` (demo bar) | Functionality/trust | DONE | VERIFIED: 320/320 |
| K1-6 | Figma frame **V6-08 · Responsive rules**. | Figma `600:2` | Information | DONE | Node check |
| K2-1 | 1024–1279 px: the status panel sits under the step content, with no overlap. | `Workspace.tsx`, `Record.tsx` | Functionality | DONE | VERIFIED |
| K2-2 | The identity card reflows on phones. | `Workspace.tsx` | Information/trust | DONE | VERIFIED |
| K2-3 | Below 1024 px: a **Step n of 4** control and an "Application status · N open" link. | `Workspace.tsx` | Experience | DONE | VERIFIED |
| K2-4 | Compact Collaterals footer ("3 of 3 selected") on phones. | `Workspace.tsx` | Experience | DONE | VERIFIED |
| K2-5 | At 1280 px and wider, the headline amounts in the status panel stay fixed and the readiness list scrolls inside the panel. | `team/kenji.scss` | Information | DONE | VERIFIED; scope narrowed by Paul (P-2) |
| K2-6 | The reference record no longer shifts sideways at 375 px. | `Record.tsx` | Functionality | DONE | VERIFIED |
| K2-7 | V6-08 updated with five rows. | Figma `604:2/11/20/29/38` | Information | DONE | Node check |

### Ada (content integrity)

| ID | Change | Files | Purpose | Status | Verification |
|---|---|---|---|---|---|
| ADA-W1-01 | `ROLE_LABEL`: the role is shown as "Loan Officer" everywhere, including the audit trail. The internal role value is unchanged. | `state.ts` | Information: one name per role | DONE | VERIFIED |
| ADA-W1-02 | Role select shows display labels. | `AfterApp.tsx` | Information | HANDOFF → Felix (F-W1-8) | VERIFIED |
| ADA-W1-03 / 04 | Guidance strings use "Loan officer" and "Total Maximum Borrowing Power". | `guidance.ts` | Information: one name for one figure | DONE | VERIFIED |
| ADA-W1-06 / 07 | Fictional data fixes: "Skerry Marine Supply LLC" (no clash with the Halvorsen Robotics collateral); Wren Abernathy's figures made consistent. | `records.ts` | Trust | DONE | VERIFIED; Before still shows neither name |
| ADA-W1-08 / 09 | Trust wording; role-name consistency in Workspace. | — | Information | HANDOFF → Theo (W3-4) / Felix | VERIFIED |
| ADA-W1-10 | `content-standards.md`: §0 labels kept from Before; casing; roles; statuses in use; current screen names. | `docs/content-standards.md` | Information | DONE | Paul review |
| ADA-W1-11 | `regulatory-and-security-notes.md`: matches the app; FR U-1 threshold; role names. | `docs/regulatory-and-security-notes.md` | Accuracy | DONE | Paul review |
| ADA-W1-12 | README rewritten per Rocky's requirements. | `README.md` | Information/trust | DONE | Paul review; outcomes and accessibility updated by Paul (P-5) |
| ADA-W1-13 | `research-users-and-workflows.md`, with sources. | `docs/` | Information: evidence behind the design | DONE | Paul review |
| ADA-W3-01–03 | One name for one figure: "Total Maximum Borrowing Power" in the Pending Review detail, the approval dialog and the declined note. | `PostUnderwriting.tsx`, `records.ts` | Information | DONE | VERIFIED |
| ADA-W3-04 / 05 | Joint request shows "(Joint)". Pending Review borrower names use one format. | `Console.tsx`, `PostUnderwriting.tsx` | Information/trust | DONE | VERIFIED |
| ADA-W3-06 | Simulated underwriting events are logged as "Credit Underwriting (simulated)", not the loan officer. | `PostUnderwriting.tsx` | Trust | DONE | VERIFIED |
| ADA-W3-07 | KENJI-08: the Evaluation footer stays one row on phones (icon-only Generate PDF, same accessible name). | `Evaluation.tsx` | Experience | DONE | VERIFIED: 73 px at 375 |
| ADA-W3-09 | README describes wave 2 behaviour. | `README.md` | Information | DONE | Paul review |

### Felix (QA and accessibility)

| ID | Change | Files | Purpose | Status | Verification |
|---|---|---|---|---|---|
| F-W1-1 | Focus lands on the new page's h1 after every route change. | `AfterApp.tsx`, `team/felix.scss` | Function/trust | DONE | VERIFIED (`walk.out`) |
| F-W1-2 | Closed side nav and header panel are `inert`, so there are no hidden tab stops. | `AfterApp.tsx` | Function | DONE | VERIFIED |
| F-W1-3 | Screen-reader-only h1 on the Console and Evaluation. | `AfterApp.tsx` | Information | DONE | VERIFIED |
| F-W1-4 | `document.title` per After screen. | `AfterApp.tsx` | Information/trust | DONE | VERIFIED |
| F-W1-5 | Site title, description and favicon. | `.figma/make/site.json` | Trust | ESCALATED (E-1) | — |
| F-W1-6 | Visible Carbon focus colour; expand chevrons get a 2 px ring. | `team/felix.scss` | Function | DONE | VERIFIED |
| F-W1-7 | The signed-out screen is a main landmark and its heading receives focus. | `AfterApp.tsx` | Function/trust | DONE | VERIFIED |
| F-W1-8 | Role select uses Carbon Select with display labels. | `AfterApp.tsx` | Information | DONE | VERIFIED |
| F-W2-1 / 2 | Visible focus on the Preface radios and the demo bar (no copy change). | `Shell.tsx` | Function | DONE | VERIFIED |
| F-W2-3 | The Before/After toggle is one Tab stop with arrow keys, Home and End. | `Shell.tsx` | Function/trust | DONE | VERIFIED |
| V-1 | THEO-06: the evaluation and acknowledgment of one app are a single history entry. A started app never reopens the dialog on Back. | `Shell.tsx`, `AfterApp.tsx` | Experience/trust | FIXED | VERIFIED (`theo06.out`) |
| V-2 | IRIS-12: the Console header no longer repeats the product name. | `AfterApp.tsx` | Experience | FIXED | VERIFIED |
| V-3 | FELIX-11: a single live region for the total; no dangling `aria-controls`. | `Workspace.tsx`, `Evaluation.tsx` | Information | FIXED | VERIFIED |
| V-4 | Test expectations updated for intended changes. | scratchpad test scripts | Keep the regression net aligned | DONE | Suites |
| V-5 | Contrast regression from W2-5: a white surface for the tertiary button in a selected row (4.21:1 → 6.0:1). | `team/felix.scss` | Accessibility (WCAG 1.4.3) | FIXED | axe3: 1 → 0 |
| V-6 | Screen readers hear "Incomplete" before a Submit attempt and "Invalid" after it, matching I7. | `Workspace.tsx` | Information/trust | FIXED | VERIFIED |

### Paul (final design review)

| ID | Change | Files | Purpose | Status | Verification |
|---|---|---|---|---|---|
| P-1 | **Switch to Loan Officer**, the mirror of PAUL-02's Switch to Credit Officer. It appears beside **Revise review** once a review is recorded, and in the Collaterals footer when the Credit Officer reaches it ("The loan officer submits this request."). It uses the same role change and audit entry as the user menu. Focus lands on Start/Continue Request or Submit. Theo had escalated this as a flow addition. Paul judged it routine: it is the mirror of an approved routine button, and the cold Complex collateral walkthrough otherwise still ended at step 4 with no Submit. **Confirmed by Rocky (E-10).** | `Evaluation.tsx`, `Workspace.tsx` | Functionality and experience: no role path ends without a next action | DONE — confirmed by Rocky | Walk: switch → header "Loan Officer", focus on Start Request → submit → Pending Review → condition (`scratchpad/review/paul/final/f2.mjs`) |
| P-2 | **Regression fix.** K2-5's status-panel height cap also matched the Pending Review detail and the Active Credit line detail, which reuse `.status-panel` for its surface. At 1440×900 the Conditions section became an 80 px inner scroller, which hid **Mark as provided**. The cap is now scoped to `aside.status-panel`, the request asides only. | `team/kenji.scss` | Functionality: the condition response is visible | FIXED | "Mark as provided" visible with no inner scroller (`b12b-cond-settled.png`); request asides unchanged |
| P-3 | Active Credit line detail: the LTV notification's text was crushed to one word per line beside its action. The action now wraps under the message in that narrow column. | new `team/paul.scss` (imported in `AfterApp.tsx`) | Information: the alert is readable | FIXED | `d01-line-1440.png`; narrow PASS |
| P-4 | Screen-name casing: "Active credit" → "Active Credit" (page h1 and one sentence), matching the menu, the header and content-standards §2. | `PostUnderwriting.tsx` | Information: one name per screen | DONE | `sync`/`sync2` assertions now check the h1 exactly |
| P-5 | README: Project outcomes and Accessibility updated with the verified results. Intro made precise about which work the team did. Walkthrough step 6 uses the new button. Short contextual intros added. | `README.md` | Information/trust | DONE | — |
| P-6 | This change log. | `docs/design-team-change-log.md` | Information | DONE | — |

## 3. Verification summary (Felix, re-run by Paul)

Felix's verdict was **PASS**. He verified every logged change and fixed two regressions (V-5 contrast, V-6 screen-reader severity). He also applied two handoffs (V-1, V-2) and one defect from his own review (V-3).

Paul re-ran the suites after P-1 to P-4:

| Check | Result |
|---|---|
| End-to-end (`e2e3`) | **61/61** |
| State and surface hierarchy (`states2`) | **34/34** |
| Before/After toggle sync (`sync`, `sync2`) | **34/34**, **10/10** |
| Keyboard (`kb2`) | **20/20** |
| axe-core (`axe2`, 13 states; `axe3`, 7 states) | **0** violations |
| Narrow widths (`narrow`) | all PASS |
| Type check (`tsc`) | only the pre-existing `vite.figma.config.ts(86,51)` error |

Felix's own additional checks:
- **Overflow sweep:** 0 overflow on 9 screens × 7 widths (320–1920 px), 63 screen-widths in all.
- **Keyboard:** a keyboard-only request walk passes.
- **Contrast:** 0 violations on 7 screens.
- **Console:** no React warnings or page errors; the only error is a favicon 404 (see E-1).
- **Before unchanged:** pixel-identical to the pre-round baseline on 8 screens. The demo bar shows only a ≤1 px antialias shift of the "← Preface" glyphs.

**Paul's final review walks (1440×900, plus 375 for Complex):**
- Preface → After, Complex collateral: Evaluate → Request review → Switch to Credit Officer → Complete review → Switch to Loan Officer → Start Request → acknowledgment → steps 1–4 → Submit → Pending Review → Simulate a condition.
- Joint step 2, with a toggle to Before.
- Active Credit line detail, with a toggle to Before and back.
- Blocked Submit.

Evidence: `scratchpad/review/paul/final/`.

## 4. Escalations for Rocky

None of these is implemented. E-10 was implemented and has been confirmed by Rocky.

| # | Proposed by | Location | Current | Exact proposed change |
|---|---|---|---|---|
| E-1 | Felix (FELIX-04) **and** Ada (ADA-01): **conflict** | `.figma/make/site.json` | No `title` (the tab reads "Figma Make App"); description mentions "small business loan management"; no favicon (404) | **Felix:** `"title": "PNC SBL Lending Console — Before & After"`; description "A portfolio case study: the original securities-based lending console (Before) and its IBM Carbon redesign (After), with fictional data."; add `icons.icon`. **Ada:** `"title": "Securities-Based Lending Console — Before & After · UX case study"`; description "Interactive UX portfolio case study by Sarthak Sahoo: a securities-based lending console, original (Before) and redesign in IBM Carbon (After). All data is fictional." *Paul's judgement:* Ada's title, because the page is not a PNC product, with Felix's favicon addition. **Decide before the next publish.** |
| E-2 | Paul (PAUL-06) **and** Ada (ADA-10): **conflict** | `PostUnderwriting.tsx` Needs attention text | "LTV is 65.2%, 4.8 points below the 70% maintenance threshold." Banking readers read "below" as safe. The line detail already says "within 10 percentage points of the 70% threshold", and the table says "4.8 pts below 70% threshold": three phrasings for one rule. | **Paul:** "LTV is ${x}%, within ${d} points of the 70% maintenance threshold." **Ada:** "LTV is ${x}%, within 10 points of the 70% maintenance threshold (${d} points below)." Either way, use one phrasing in the list, the detail and the table. **Decide before the next publish** (credibility with domain readers). |
| E-3 | Ada (ADA-03) | `Workspace.tsx` step 1 and status panel; `Record.tsx` | "($114,000 available)" / "$114,000 available" | "($114,000 above the request)" / "$114,000 above it" (compliance wording: "available" can read as available credit) |
| E-4 | Ada (ADA-05) | `Shell.tsx` metrics dialog | "They are the business context and KPI targets for this demonstration." and "…in the original, such gaps would surface later in underwriting." | "They are historical results of the original project and are not measured by this prototype." and "…Before does not check them at submission." |
| E-5 | Ada (ADA-06) | Preface, Part 2 (owner-approved copy) | "**Before** is the original console; **After** is my redesign, including new proposals." | "**Before** recreates the original console's design with fictional data; **After** is my redesign, including new proposals." README would follow. |
| E-6 | Ada (ADA-07) | Pending Review description | "…awaiting final banker decisioning. Credit Underwriting owns the credit decision…" | "Applications reviewed by underwriting. Credit Underwriting makes the credit decision; conditions that need your response appear here." |
| E-7 | Paul (PAUL-03) | Preface, under the Scenario select | Scenario names only | One helper line that changes with the selection, from the README's "What it exercises" column. Example: "Complex collateral: concentrated position, credit officer review, coverage shortfall." Optional: "Suggested: Complex collateral in After, then toggle on Evaluation and step 2." |
| E-8 | Paul (PAUL-09) | Demo bar, when the toggle falls back to a parent screen | Silent fallback (e.g. Active Credit → Before Submitted Applications) | A transient inline note for about 4 s in the demo bar. Example: "Active Credit is new in After. Showing the closest Before screen." |
| E-9 | Theo (THEO-01 / PAUL-02) | `Evaluation.tsx`, under "Awaiting credit officer review" | Tag and **Switch to Credit Officer** button | "Demo: a credit officer completes this review. Switch roles here or in the user menu." *Paul's judgement:* not needed now that the button exists; recommend declining. |
| E-10 | Theo proposed; **Paul implemented as routine (P-1)** | `Evaluation.tsx`, `Workspace.tsx` | — | **Switch to Loan Officer** after a recorded review, and in the Collaterals footer for the Credit Officer. **Decided: confirmed by Rocky — keep.** |
| E-11 | Iris (I10) | Collaterals table headers (labels shared with Before) | Collateral Name / Collateral Account Number / Estimated Collateral Value / Maximum Borrowing Power, wrapping to 2–3 lines at 1440 | "Account" / "Account no." / "Market value" / "Borrowing power", with the full terms in the glossary or a tooltip. Figma V6-05 table `594:185` should be redrawn after the decision. |
| E-12 | Ada, from research PR-04 (R1) | Total Evaluation, status panel, Collaterals table | No pricing time | **New:** "Market values as of 11/19/2025, 9:30 AM." (fictional fixed time) |
| E-13 | Ada, from research PR-11 (R2) | Active Credit LTV alert / line detail | No cure deadline | **New:** "Cure by 11/21/2025. Deposit $X in eligible collateral or repay $Y to return within the threshold." (wording for policy approval) |
| E-14 | Ada, from research PR-10 (R3) | Active Credit documentation | No risk-disclosure record | **New** row: "SBL risk disclosure (maintenance calls, liquidation, taxes, variable rate) · Delivered 11/19/2025" (needs Legal approval) |
| E-15 | Ada, from research PR-03 (R4) | Pending Review "Waiting on"; conditions | "Waiting on Credit Underwriting · decision due in 2 business days" | "Waiting on Credit Underwriting since 11/19/2025 · decision due in 2 business days"; each condition: "Requested 11/19/2025" |
| E-16 | Ada, from research PR-09 (R5) | Step 3 Use of Proceeds, under the FR U-1 checkbox | No helper | **New** helper: "Required when credit secured by margin stock exceeds $100,000 (12 CFR 221.3(c))." |
| E-17 | Ada | `docs/regulatory-and-security-notes.md` §2 | No 2026 note | Add the FinCEN exceptive relief of 13 Feb 2026 on re-identifying beneficial owners (summarised by DLA Piper, 2 Mar 2026), marked "Compliance to confirm". Edit the CTA row "narrowed in 2025" to match. |
| E-18 | Ada | Repo root: `CLAUDE_CODE_HANDOFF.md`, `guidelines/Guidelines.md` | Titled "PNC Securities Lending Console", "production-quality" | **A:** remove them from the published repo, or **B:** add a first line "> Internal build notes for a fictional UX portfolio prototype. Not a PNC document; all data is fictional." |
| E-19 | Ada (ADA-13) | Request IDs "SBL-24-…" with 2025 dates | Shared with Before data and hash routes | Keep as is unless the IDs change for another reason. Any change touches `data.ts` (Before) and the sync map. |
| E-20 | **Paul (new, final review)** | Evaluation footer for the Credit Officer | The Credit Officer can select **Start Request** and accept the five acknowledgements, which attest as "the banking representative". This contradicts the segregation of duties the prototype demonstrates. | For the Credit Officer, hide **Start/Continue Request**. Show "The loan officer starts the request." with **Switch to Loan Officer** (the P-1 pattern). This is a permissions and flow change, so it is escalated. |

That is 19 proposals awaiting a decision (E-1 to E-9 and E-11 to E-20). E-10 is decided (kept).

## 5. Unresolved and accepted

| Item | Owner | Status / reason |
|---|---|---|
| The Step 4 collateral table scrolls sideways inside its container at 1024 px. | Kenji / Felix | **Accepted:** a data table, which WCAG 1.4.10 allows. |
| At 1280×800 the last 52 px of the status panel show only after scrolling. | Kenji | **Accepted:** the headline numbers stay fixed. |
| Active Credit "All credit lines" scrolls sideways at 1024 px. The key action (client name) is in the first column, so it is not pinned. | Kenji | **Accepted.** |
| The Pending Review "Loan Type" column is not wrapped (table `min-w-[1120px]`). The pinned action solves reachability. | Kenji | Open, low priority. |
| At 320 px the scenario select clips its text ("Single borr…"). The "Fictional" chip is kept for trust. | Kenji | Judgement; Rocky may prefer hiding the chip text below 360 px. |
| Demo bar touch targets are 40 px, not 44 (it meets WCAG 2.5.8 at 24 px). | Kenji | **Accepted:** 44 px would need a 52–56 px bar. |
| At 900 px height the Pending Review detail and its selected row can't both be visible. Back to Pending Review returns to the row. | Theo | Open; a layout change would be creative direction. |
| The Pending Review selected-row Evaluate shows Carbon's `aria-pressed` grey fill. | Iris | Open, low priority. |
| Figma V6-05 collateral table header overlap. | Iris | Waits on E-11. |
| Active Credit "Needs attention" lists a line once per issue (Halcyon Dental and Desmond Achterberg appear twice, which inflates the count to 9). | Paul (PAUL-06, low part) | Open. One row per line listing both issues; content/layout change for a later round. |
| Joint step 2: the suggested **Add Thomas Reyes as co-borrower** is tertiary while the fallback **Search** is primary blue, and the MDM ID field sits beside the Add button rather than with Search. | Paul (observed in final review) | Open: a visual hierarchy item for Iris next round. |
| README has no Before/After image (PAUL-10). | Ada / Paul | Partly addressed: the README was rewritten with a walkthrough, but no image was added. Images are Rocky's choice of portfolio assets. |
| `data.ts` `Scenario.challenge` strings (unused; the joint one says "beneficial-owner certification"). | Ada | Not changed: the file is read by Before. Harmless while unrendered. |
| Before and the Preface still show the site title "Figma Make App". | Felix | Waits on E-1. |

## 6. Final review outcome (Paul)

**PASS.** The three waves cohere into one voice and one hierarchy:
- blue means "you can act";
- each open item has one severity and one list;
- each figure has one name;
- each role has one name;
- Back returns to where you came from;
- each jump lands visibly and focuses its target.

A first-time viewer can now complete the Complex collateral story without the README: Selected scenario → review → switch roles → submit → condition → approval. Four small inconsistencies found in the final review were fixed (P-1 to P-4), and every suite passes after them.

What remains is Rocky's to decide (section 4). Two items should be decided before the next publish, because a domain reader or a browser tab will see them:
- E-2, the LTV wording;
- E-1, the page title.

E-20 matters for the integrity of the segregation-of-duties story.
