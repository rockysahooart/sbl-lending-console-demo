# Claude Code Handoff: PNC Securities Lending Console

## Objective

Rebuild the existing desktop banker-facing **PNC Securities Lending Console** as production-quality semantic HTML and CSS, with minimal vanilla JavaScript where interaction and state are required.

This is not a static mockup. Preserve the current workflows, calculations, conditional rendering, state continuity, and compliance interactions.

## Source of Truth

Before coding, inspect these files:

- `guidelines/Guidelines.md` — authoritative product and interaction rules
- `src/app/App.tsx` — top-level navigation
- `src/app/components/LoanTable.tsx` — dashboard and expandable loan table
- `src/app/components/Evaluation.tsx` — evaluation workflow and calculations
- `src/app/components/AcknowledgmentModal.tsx` — compliance acknowledgment
- `src/app/components/LoanApplication.tsx` — application state and step flow
- `src/app/components/CustomerInformation.tsx` — step 1 and primary borrower card
- `src/app/components/CoBorrower.tsx` — step 2
- `src/app/components/LoanInformation.tsx` — step 3
- `src/app/components/Collaterals.tsx` — step 4
- `src/app/components/LoanSubmissionConfirmation.tsx` — confirmation
- `src/app/components/Header.tsx` — shared application header
- `src/styles/` — existing global styles and tokens

The current visible content, labels, sample data, order, and calculations in these files should be preserved unless this handoff explicitly says otherwise.

## Technical Deliverable

Build the console with:

- Semantic HTML5
- Maintainable CSS using custom properties and reusable component classes
- Minimal vanilla JavaScript for behavior and state
- No framework dependency unless one is already required by the target repository
- No inline styles
- No inaccessible `div`-only buttons
- No horizontal scrolling at the target viewport

Suggested organization:

```text
index.html
styles/
  tokens.css
  base.css
  layout.css
  components.css
scripts/
  app.js
  evaluation.js
  application.js
```

If implementing inside the current Vite/React repository instead of producing a standalone version, keep the current component architecture and translate the visual requirements into reusable classes rather than replacing working state logic.

## Target Canvas and Layout

- Desktop only, optimized for **1680 × 1050** (16:10)
- Use the full viewport height
- Fixed or sticky header where shown
- Fixed footer where shown
- Main content scrolls vertically between header and footer
- Maximum main content width: **1584px**
- Main horizontal padding: **32px**
- No forced scaling, clipped content, hidden controls, or horizontal scrolling
- Do not compress content to fit; use vertical scrolling

## Visual Direction

Clean, restrained enterprise banking UI with high information density.

### Core colors

```css
:root {
  --pnc-orange: #f5a742;
  --action-blue: #0066cc;
  --action-blue-hover: #0052a3;
  --surface: #ffffff;
  --page-bg: #f9fafb;
  --border: #e5e7eb;
  --border-strong: #9ca3af;
  --text: #111827;
  --text-muted: #4b5563;
  --text-subtle: #6b7280;
  --info-bg: #eff6ff;
  --info-border: #dbeafe;
}
```

### Typography and density

- Use the project’s existing sans-serif font stack
- Default body size: 14px
- Labels and metadata: 10–12px
- Section headings: 16px, semibold
- Page headings: 24px, semibold where applicable
- Use restrained borders, subtle shadows, and 4–8px corner radii
- Blue is reserved for actions, selection, focus, and calculated highlights
- Orange is a restrained brand accent, not a large background treatment
- Do not introduce gradients, oversized marketing typography, glass effects, or decorative animation

## Shared Header

Create a 64px white header with a bottom border:

- Left: menu button, divider, “Securities Lending Console”
- Center: current page title
- Right: banker identity:
  - Sarah Mitchell
  - Loan Officer • Branch 4472
  - compact user avatar

The menu button must open the navigation menu; it must not be decorative.

## Required Screens and Flows

### 1. Dashboard

Recreate the loan application dashboard from `LoanTable.tsx`:

- Dense, readable data table
- Expandable rows
- Existing filters and actions must work
- Every link/button must change state or navigate
- Opening an evaluation must retain the selected application context

### 2. Evaluation

Use four bordered white collapsible sections:

1. Customer Details
2. Auto Evaluation
3. Manual Evaluation
4. Total Evaluation

Each header is a real button with a chevron, title, and total where applicable.

#### Customer Details

Show customer name, opportunity date, customer Power ID, loan purpose, and requested amount in a dense horizontal grid.

#### Auto Evaluation

- Render the eight account cards defined in `Evaluation.tsx`
- Four cards per row at the target viewport
- Each card has:
  - checkbox
  - bank name
  - masked account number
  - maximum borrowing power
  - Override action
- Selected cards use blue border and pale blue background
- Support individual selection and Select All
- Auto total is the sum of selected account borrowing power
- Override expands and scrolls to Manual Evaluation without clearing selection

#### Manual Evaluation

This section must remain fully dynamic:

- Render only accounts selected in Auto Evaluation
- Never hard-code separate manual account cards
- Preserve entered manual data while an account remains selected
- Show a pale-blue information banner:
  - `Showing N account(s) selected from Auto Evaluation`
- If no accounts are selected, show:
  - `No accounts available for manual evaluation`
  - `Select accounts in Auto Evaluation above to enable manual override and detailed asset evaluation`
- Support Select All Accounts and individual manual-account inclusion
- Account names are editable inline
- Each account has tabs:
  - Highly Liquid
  - Fixed Income
  - Equities
  - Other Assets
- Each tab shows an asset table with Data, Collateral Value, and Lendable Value
- Collateral inputs accept numeric values
- Recalculate lendable value immediately:
  - Cash at PNC: 100%
  - Other highly liquid assets: 80%
  - Fixed income: 80%
  - Equities: 70%
  - Other assets: 60%
- Briefly highlight a recalculated lendable value in blue
- Manual total includes only selected manual accounts

#### Total Evaluation

Display:

- Auto Evaluation maximum borrowing power
- Manual Evaluation maximum borrowing power
- Combined total

All totals update immediately when selections or collateral values change.

#### Evaluation footer and acknowledgment

Use a fixed white footer with:

- Back
- Generate PDF
- Start Request

Start Request opens the acknowledgment modal. The modal must:

- Use a backdrop
- Close from the X button
- Close on backdrop click
- Scroll vertically if needed
- Confirm into application step 1
- Never clip content or trap the user

### 3. Multi-step Loan Application

Preserve the four-step flow:

1. Customer Information
2. Co-borrowers
3. Loan Information
4. Collaterals

Requirements:

- Start Request goes directly to Customer Information
- Tabs navigate to valid steps
- Back preserves entered data
- Next/Save and Continue advances the workflow
- Submission creates the confirmation state
- State persists across all steps
- No disabled or greyed-out fields; use explanation or validation feedback instead
- Every input, select, checkbox, and radio control is functional

## Primary Borrower Identity Card

The existing implementation is the block beginning around `src/app/components/CustomerInformation.tsx:138`. Recreate it faithfully and improve only where needed for robust HTML/CSS.

### Card dimensions and style

- Width: **400px**
- Height: **180px**
- Pale gray background
- 1px medium-gray border
- Small corner radius
- Subtle shadow
- 16px inner padding
- Two-column flex layout with a vertical divider

### Left identity zone

- Fixed width: approximately 120px
- 48 × 48 blue square avatar with a white user icon
- Uppercase eyebrow: `PRIMARY BORROWER`
- Legal name below in 12px semibold text
- Do not truncate or hide the legal name

### Right details zone

Use a dense two-column grid:

| Left | Right |
|---|---|
| DOB | MDM ID |
| SSN | Power ID |
| Phone, spanning both columns | |
| Email, spanning both columns | |

- Labels: 10px uppercase, muted gray, tracked
- Values: 12px medium weight, dark gray
- Preserve readable spacing without overflowing the fixed card
- Values must come from application state, not duplicated static markup

Use semantic markup such as a heading plus a `<dl>` for identity metadata where practical.

## Six-column Alignment Rule

All customer/co-borrower detail sections must use the same six-column grid.

The required alignment is:

- Address row:
  1. Address Line 1
  2. Address Line 2
  3. City
  4. State
  5. ZIP Code
  6. Customer Since
- Identity row:
  1. Proof of Identity
  2. ID Number
  3. Place of Issuance
  4. Date Issued
  5. Date of Expiration
  6. intentionally empty

Therefore:

- **Date of Expiration must align vertically with ZIP Code in column 5**
- **Customer Since must stand alone in column 6**

Do not redistribute these fields into five equal columns.

## Accessibility

- Use buttons for actions and links only for navigation
- Add visible `:focus-visible` states using action blue
- Associate every form label with its control
- Use fieldsets/legends for radio groups when practical
- Collapsible headers must expose `aria-expanded` and `aria-controls`
- Tabs must use appropriate tab semantics and keyboard behavior
- Modal uses `role="dialog"`, `aria-modal="true"`, a labelled title, Escape-to-close, and sensible focus return
- Color must not be the only selection indicator
- Keep body text and controls at readable contrast

## State Model

Maintain one application-level state object for:

- current screen and step
- selected loan/application
- Auto Evaluation account selection
- Manual Evaluation account data
- calculated totals
- customer and co-borrower information
- loan information
- collateral data
- acknowledgment and modal state

Do not duplicate the same entity into unrelated static structures. Manual Evaluation should be derived from Auto Evaluation selections while preserving edits keyed by account ID.

## Non-negotiable Product Rules

- No dead-end interactions
- No decorative-only controls
- No placeholder production states
- No hidden or truncated content
- No visual reset when moving between steps
- No re-entry of data already collected
- No static manual-account rendering
- No disabled flows without an explanation
- Every action produces visible feedback
- All screens have a reversible exit path

## Acceptance Checklist

Verify at **1680 × 1050**:

- [ ] Header and footer remain visible where intended
- [ ] Main content scrolls vertically without horizontal overflow
- [ ] Dashboard rows, filters, navigation, and actions work
- [ ] All four Evaluation sections collapse and expand
- [ ] Auto Evaluation supports individual and bulk selection
- [ ] Manual cards exactly follow selected Auto accounts
- [ ] Manual empty state appears when zero accounts are selected
- [ ] Carried-over account count banner is accurate
- [ ] Manual edits survive tab changes and normal navigation
- [ ] All borrowing-power totals recalculate correctly
- [ ] Start Request acknowledgment behaves as specified
- [ ] Application data persists across all four steps
- [ ] Primary borrower card matches the specified 400 × 180 layout
- [ ] DOB/MDM ID, SSN/Power ID, phone, and email are all present
- [ ] Date of Expiration is in grid column 5
- [ ] Customer Since is in grid column 6
- [ ] No clipped, hidden, disabled, or nonfunctional controls
- [ ] Keyboard focus and modal behavior are accessible

## Definition of Done

The result should feel like one cohesive, production-grade enterprise workflow, not a collection of static screens. Complete the implementation, test all state transitions and calculations, and report any unavoidable differences from the source behavior.
