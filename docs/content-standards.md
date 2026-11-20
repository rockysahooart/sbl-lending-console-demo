# Content standards — SBL Workspace (After experience)

Internal governance for the redesigned experience. Not shown in the product.
All data in the prototype is fictional. This document is a design artifact,
not legal or compliance advice.

## 1. Financial terminology (use exactly these terms)

| Term | Definition | Where it appears | Never say |
|---|---|---|---|
| **Requested amount** | The credit amount the client asked for. | Pipeline, structure, summary, confirmation | "loan amount" (ambiguous), "approved amount" |
| **Market value** | Current market value of a holding or account. | Collateral table, monitoring | "collateral value" (ambiguous) |
| **Advance rate** | Percentage of market value that counts toward borrowing power. | Collateral table, calculation details, review | "LTV" (different measure), "haircut" in UI copy |
| **Eligible collateral value** | Market value × advance rate, for pledged eligible holdings. | Collateral table | "lendable value", "loan value" |
| **Estimated borrowing power** | Total eligible collateral value of pledged accounts. Indicative only. | Pipeline, summary, review, confirmation | "pre-approved", "available to borrow", "you qualify for", "maximum loan" |
| **Coverage ratio** | Estimated borrowing power ÷ requested amount. | Pipeline, summary | "approval likelihood" |
| **Approved credit limit** | Limit set by underwriting after a credit decision. | Underwriting, Active credit | Any use before an underwriting decision |
| **Outstanding balance** | Amount currently drawn. | Active credit | "loan balance" (inconsistent) |
| **Available credit** | Approved credit limit − outstanding balance. | Active credit | "borrowing power" (post-approval) |
| **Loan-to-value (LTV)** | Outstanding balance ÷ collateral market value. | Active credit | "advance rate" |
| **Maintenance threshold** | LTV at which a maintenance call may be issued. | Active credit | "margin call" (unless confirmed by policy) |

Rule: a figure before underwriting is always an *estimate*. Pair the first
mention on a screen with the statement “Indicative estimate. Not a credit
decision or an offer of credit.” or equivalent approved text.

## 2. Voice and style

- Professional, concise, neutral. No exclamation marks, no marketing language, no urgency or scarcity cues.
- Sentence case for all labels, headings, buttons and tags.
- Buttons start with a verb and name the outcome: “Submit to underwriting”, “Save identification”, “Record review”. Avoid “OK”, “Yes”, “Continue” on consequential actions.
- Mark optional fields “(optional)”; required is the default and is not marked with asterisks.
- Use “client” for the bank’s customer, “co-borrower”, “authorized signer”, “credit officer”, “relationship banker”.
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

Request: Not started · In progress · Collateral review required · Ready to submit · In underwriting · Approved.
Collateral: Valued · Review required · Reviewed · Not eligible · Not pledged.
Documents: Pending signature · Outstanding · Complete.
Monitoring: Within limits · LTV alert · Alert acknowledged.
Status is always shown with an icon and text, never colour alone.

## 5. Demo labelling

Actions that simulate events outside the banker’s control (underwriting
decision, signatures) are prefixed “Simulate …”, require confirmation, and say
“No real credit decision is made.” The role selector is labelled “Role (demo)”.

## 6. Prohibited phrasing

“Guaranteed”, “pre-approved”, “instant approval”, “you qualify”, “up to $X
available” (before approval), “risk-free”, “secure” as an absolute claim,
“compliant”/“certified” about the prototype.

## 7. Strings that require legal / compliance approval before production

| Location | String | Reason |
|---|---|---|
| Review → attestations | All five attestation statements | Legal attestations by bank staff |
| Review → acknowledgment | Acknowledgment text (currently fictional placeholder copy) | Binding language |
| Review → authorization | “How did the client authorize this application?” options | Evidence standard for consent/authorization (FCRA permissible purpose, E-SIGN) |
| Summary, confirmation | “Indicative estimate. Not a credit decision or an offer of credit.” | Disclaimer wording |
| Structure → use of proceeds | Purpose / non-purpose definitions, Form FR U-1 checkbox, “Not available for this product” message | Regulation U wording and product policy |
| Client → compliance | PEP, weapons, third-party-payment questions | AML questionnaire wording and policy source |
| Client → ownership | Beneficial-ownership certification statement and the 25% / control-person description | CDD rule certification wording |
| Client → marital status | Options Married / Unmarried / Separated | Regulation B §1002.5(d)(1) |
| Masked identifier modal | Reasons for access, 30-second re-mask | Internal data-access policy |
| Session timeout modal | Timeout duration and wording | Internal security policy |
| Active credit | “Maintenance threshold”, alert text, outreach action | Collateral maintenance policy; may trigger client notices |
| Pricing exception | “Approval is not guaranteed.” | Pricing policy wording |
| Client → conversation view | Talking points (indicative estimate, collateral maintenance, who decides) | Customer-facing statements about credit and collateral risk |
| Underwriting → conditions | Condition wording returned to the banker | Underwriting policy; may be shared with the client |
