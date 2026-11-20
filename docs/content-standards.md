# Content standards — SBL Workspace (After experience)

Internal governance for the redesigned experience. Not shown in the product.
All data in the prototype is fictional. This document is a design artifact,
not legal or compliance advice.

## 0. Labels kept from Before (owner direction)

After modernizes the original console without reinventing it: the same
screens, sections, labels and actions, so experienced loan officers recognize
every screen. **Labels that come from Before are kept verbatim**, including
their Title Case and their wording, even where a rule below would phrase them
differently. Examples: “Start Request”, “Generate PDF”, “Return to Console”,
“Customer Details”, “Confirm Requested Loan Amount”, “Total Evaluations”,
“Collateral Value” and “Lendable Value” (Manual Evaluation table), “Estimated
Collateral Value” (Collaterals table), “RM Officer”, “Is the Relationship
Manager for this request correct?”, “Post-Underwriting Review Queue”, “Final
Decision”, “Loan Officer” (header role).

The rules in sections 1–3 apply to **strings that are new in After**, and to
corrections made for compliance (see the regulatory notes).

## 1. Financial terminology (use exactly these terms)

| Term | Definition | Where it appears | Never say |
|---|---|---|---|
| **Requested Loan Amount** | The credit amount the client asked for. Before's label, kept. “Loan Amount” in Loan Details is the same value. | Console row, Evaluation, steps 1 and 3, status panel, confirmation | "approved amount" |
| **Market value** | Current market value of a holding or account. | Evaluation account details, review dialog, monitoring | "collateral value" in new strings (ambiguous). Before's column labels “Collateral Value” and “Estimated Collateral Value” are kept (§0). |
| **Advance rate** | Percentage of market value that counts toward borrowing power. | Collateral table, calculation details, review | "LTV" (different measure), "haircut" in UI copy |
| **Maximum Borrowing Power** (per account) | Market value × advance rate, for a selected eligible account. Before's label, kept. | Evaluation, Collaterals | "loan value". Before's “Lendable Value” column (Manual Evaluation) is kept (§0). |
| **Total Maximum Borrowing Power** | Sum of Maximum Borrowing Power of selected accounts. Before's label, kept; always paired with the indicative-estimate statement. | Evaluation (Total Evaluation), step 1, status panel, Console expanded row, Pending Review detail, reference record | "estimated borrowing power", "pre-approved", "available to borrow", "you qualify for", "$X available" |
| **Coverage** | Total Maximum Borrowing Power ÷ Requested Loan Amount. | Status panel, Console expanded row, reference record | "approval likelihood" |
| **Approved credit limit** | Limit set by underwriting after a credit decision. | Pending Review (after a decision), Active Credit | Any use before an underwriting decision |
| **Outstanding balance** | Amount currently drawn. | Active Credit | "loan balance" (inconsistent) |
| **Available credit** | Approved credit limit − outstanding balance. | Active Credit | "borrowing power" (post-approval) |
| **Loan-to-value (LTV)** | Outstanding balance ÷ collateral market value. | Active Credit | "advance rate" |
| **Maintenance threshold** | LTV at which a maintenance call may be issued. | Active Credit | "margin call" (unless confirmed by policy) |

Rule: a figure before underwriting is always an *estimate*. Pair the first
mention on a screen with the statement “Indicative estimate. Not a credit
decision or an offer of credit.” or equivalent approved text.

## 2. Voice and style

- Professional, concise, neutral. No exclamation marks, no marketing language, no urgency or scarcity cues.
- Sentence case for labels, headings, buttons and tags that are **new in After** (for example “Application status”, “Submission readiness”, “Request credit officer review”, “Mark as provided”). Labels kept from Before keep their Title Case (§0). Screen and menu names are proper names and keep the menu's casing: “Pending Review”, “Active Credit”.
- Buttons start with a verb and name the outcome: “Submit to underwriting”, “Save identification”, “Record review”. Avoid “OK”, “Yes”, “Continue” on consequential actions.
- Mark optional fields “(optional)”; required is the default and is not marked with asterisks.
- Use “client” for the bank’s customer in new strings (Before's “Customer Information”, “Customer Name” and similar labels are kept), “co-borrower”, “authorized signer”, “credit officer”.
- Roles: the banker who builds the request is the **Loan Officer** (Before's header label; the demo user is Sarah Mitchell). The **Relationship Manager** / “RM Officer” (J. Whitfield in the scenarios) owns the opportunity and is a different person. The **Credit Officer** sets advance rates for manual evaluations. **Credit Underwriting** makes the credit decision. Do not use “relationship banker” in the UI; it is easily confused with the Relationship Manager.
- Currency: `$1,234,567` (no cents unless relevant); percentages without decimals except LTV (one decimal).
- Dates: `MM/DD/YYYY`; timestamps `MM/DD/YYYY, h:mm AM/PM`.

## 3. Messages

- **Errors** state what is wrong and how to fix it: “Enter a whole number from 35 to 60.”, “Enter a future date in MM/DD/YYYY format.” Never blame the user; never say “invalid input” alone.
- **Blocking issues** list each item with a link to where it is resolved (readiness checklist).
- **Confirmations** for consequential or irreversible actions name the object and the effect (“Remove Thomas Reyes as co-borrower?” — “Identification updates … will be cleared.”).
- **Success** states what happened and what happens next, without implying an outcome (“Underwriting makes the credit decision”).
- **Empty states** say what is missing and the next action.
- **Restricted access** states the role limitation and who can help; never “Access denied”.

## 4. Status vocabulary

Application lifecycle (Console, Pending Review, Active Credit, request header; one model in `src/demo/after/lifecycle.ts`): Not Started · In Progress · Action Required · Ready to Submit · Submitted · Under Review · Approved · Declined · Completed. Each is shown as a tag (colour + icon + words) with a short reason in sentence case, for example "Expired co-borrower ID", "Collateral shortfall", "Additional information requested", "Returned for correction", "Awaiting underwriting", "Pending credit committee", "Documents pending signature", "Line active".
Next actions name the task, never "Review application": Start Application · Continue the evaluation item by name · Update co-borrower ID · Resolve the shortfall · Complete manual evaluation · Certify beneficial ownership · Submit Application · Resubmit Application · Respond to condition · View underwriting status · View decision · View credit line.
Final Decision column (Pending Review): Pending · Approved · Declined · Booked.
Step progress: Not started · In progress · Completed, the number of open items, or "Complete <step> first" when a step is not yet available.
Collateral: Auto evaluated · Manual evaluation · Manually evaluated · Not eligible · Not selected.
Documents: Pending signature · Outstanding · Complete.
Monitoring: Within limits · LTV alert · Alert acknowledged.
Status is always shown with an icon and text, never colour alone.

## 5. Demo labelling

Actions that simulate events outside the banker’s control (underwriting
decision, signatures) are prefixed “Simulate …”, require confirmation, and say
“No real credit decision is made.” The role selector is labelled “Role (demo)”; its options are the display names “Loan Officer” and “Credit Officer”.

## 6. Prohibited phrasing

“Guaranteed”, “pre-approved”, “instant approval”, “you qualify”, “up to $X
available” (before approval), “risk-free”, “secure” as an absolute claim,
“compliant”/“certified” about the prototype.

## 7. Strings that require legal / compliance approval before production

Locations use the current screen names (Before-aligned IA).

| Location | String | Reason |
|---|---|---|
| Evaluation → Acknowledgment Required | The five acknowledgements (Before wording, kept for familiarity) | Banker attestations; legal effect |
| Evaluation → Acknowledgment Required → full acknowledgement | Full acknowledgement text (a short fictional summary, labelled “Fictional text for demonstration.”) | Binding language |
| Evaluation, step 1, Application status panel | “Indicative estimate. Not a credit decision or an offer of credit.” | Disclaimer wording |
| Step 1 Customer Information → Additional Information | Politically exposed person question and the three risk questions (Before wording; “co-borrower” corrected to “borrower(s)”); no preselected answers | AML due-diligence questions and policy source |
| Step 1 / step 2 → Marital Status | Options Married / Unmarried / Separated | Regulation B §1002.5(d)(1) |
| Step 2 Co-borrowers → Confirm Application Type | “How did the customer authorize this application?” options | Evidence standard for consent/authorization (FCRA permissible purpose, E-SIGN) |
| Step 2 Co-borrowers → Beneficial Ownership / Trust Ownership | Certification statements and the 25% / control-person description | CDD rule certification wording; trust ownership is internal policy (assumed) |
| Step 3 Loan Information → Use of Proceeds | Purpose / non-purpose definitions, Form FR U-1 checkbox, “Not available for this product” message | Regulation U wording and product policy |
| Step 3 Loan Information → pricing exception | “Approval is not guaranteed.” | Pricing policy wording |
| Masked identifier dialog (SSN “View”) | Reasons for access, 30-second re-mask | Internal data-access policy |
| Session timeout dialog | Timeout duration and wording | Internal security policy |
| Pending Review → conditions | Condition wording returned to the banker | Underwriting policy; may be shared with the client |
| Active Credit | “Maintenance threshold”, LTV alert text, outreach action | Collateral maintenance policy; may trigger client notices |
