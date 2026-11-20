# Regulatory, security and privacy notes — SBL Workspace (After experience)

Internal design documentation. Not shown in the product.

> **Status.** This is a UX portfolio demonstration with fictional data. The
> security and compliance behaviours below are *simulated* in front-end code
> and browser-only state. They do not provide production security, regulatory
> compliance, or certification. This document summarises publicly known
> requirements to inform design; it is not legal advice and must be validated
> by the institution’s Legal, Compliance and Information Security teams.

Each item is labelled:
- **Regulation** — an obligation in law or regulation.
- **Supervisory expectation** — guidance or risk-based expectations from regulators.
- **Internal policy (assumed)** — a control the institution would define; values in the demo are illustrative.
- **UX practice** — a recommended design pattern, not itself required.

## 1. Customer identification and verification

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Collect name, date of birth, address, identification number; verify identity through risk-based procedures; keep records | Regulation | BSA Customer Identification Program rule, 31 CFR 1020.220 | Client record shows verified identity data and verification date; expired co-borrower ID blocks submission until a current ID is recorded |
| Retain identifying information for 5 years after the account is closed | Regulation | 31 CFR 1020.220(a)(3) | Not implemented (back-end records retention) |
| Expired-ID handling rules | Internal policy (assumed) | — | Expired ID must be replaced before submission |

## 2. Beneficial ownership

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| For **legal entity customers**, identify and verify each individual owning ≥25% and one individual with significant control; obtain a certification | Regulation | FinCEN Customer Due Diligence rule, 31 CFR 1010.230 | Northbridge Holdings LLC: owners ≥25% and control person listed, certification checkbox required |
| Trusts | Note | Most trusts are **not** “legal entity customers” under 31 CFR 1010.230 (statutory trusts may be) | The joint scenario’s trust-ownership certification is an **internal policy (assumed)**, labelled “Trust ownership”, not “beneficial ownership” |
| Corporate Transparency Act reporting to FinCEN | Note | Separate regime; reporting obligations were narrowed in 2025 | Not represented; do not conflate with the CDD rule |

## 3. Sanctions screening (OFAC)

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Prohibition on dealings with blocked persons (SDN List) | Regulation | OFAC regulations, 31 CFR Chapter V | — |
| Screening customers and parties against sanctions lists | Supervisory expectation | OFAC “Framework for OFAC Compliance Commitments” (2019); FFIEC BSA/AML Manual | Simulated “Sanctions screening: no match” for borrower, co-borrower and owners with a date; a real system would show potential-match review states |

## 4. AML risk questions

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Politically exposed persons | Regulation (for private banking accounts of senior foreign political figures) / Supervisory expectation | 31 CFR 1010.620; FFIEC BSA/AML Manual | PEP question, no preselected answer |
| Third-party repayment, inconsistent source of funds, weapons-related activity | Internal policy (assumed) | Risk-based customer due diligence | Questions asked only if not on file; no default answers (the baseline defaulted to “Yes”) |

## 5. Equal Credit Opportunity Act (Regulation B)

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Marital status terms for other than individual unsecured credit: only married, unmarried, separated | Regulation | 12 CFR 1002.5(d)(1) | After uses Married / Unmarried / Separated. **The Before baseline uses Single/Married/Divorced/Widowed and requests a spouse name; it is preserved unchanged as the historical baseline.** |
| Limits on requesting spouse information | Regulation | 12 CFR 1002.5(c) | After does not request spouse information for individual applicants |
| Spousal signature restrictions | Regulation | 12 CFR 1002.7(d) | Joint application requires the co-applicant’s permission (explicit intent to apply jointly) |
| Application record retention (25 months) | Regulation | 12 CFR 1002.12(b) | Not implemented (back-end) |

## 6. Margin regulation (securities-based lending)

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Credit secured by margin stock; purpose credit limits | Regulation | Regulation U, 12 CFR 221 | “Use of proceeds”: purpose vs non-purpose |
| Purpose statement (Form FR U-1) for credit secured by margin stock above the regulatory threshold | Regulation | 12 CFR 221.3(c) | Checkbox confirming a completed FR U-1; **threshold applicability must be confirmed by Compliance** |
| Offering non-purpose credit only | Internal policy (assumed) | Product policy | Purpose credit shows “Not available for this product” |

## 7. Privacy and information security (GLBA)

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Privacy notices to consumers/customers | Regulation | GLBA Title V; Regulation P, 12 CFR 1016 | Not represented (notice delivery is outside origination UI) |
| Information security program, access controls, monitoring for banks | Regulation | Interagency Guidelines Establishing Information Security Standards (e.g., 12 CFR 30 App. B, 12 CFR 208 App. D-2, 12 CFR 364 App. B). The FTC Safeguards Rule applies to non-bank financial institutions | Role-based access (Relationship Banker / Credit Officer), least-privilege identifier visibility, audit events |
| Masking SSNs; reason-required reveal; automatic re-masking | Internal policy (assumed) / UX practice | Supports the access-control objective; some state laws restrict SSN display | SSN masked by default; reveal requires a reason, is logged, re-masks after 30 seconds; Credit Officer cannot reveal |
| Session timeout | Internal policy (assumed) | Risk-based authentication and session management (FFIEC guidance) | Warning at 13 minutes idle, sign-out at 15 (shortened with `?sessionSeconds=N` for testing) |

## 8. Credit inquiry, consent and electronic records

| Topic | Classification | Source | Demo implementation |
|---|---|---|---|
| Permissible purpose to obtain a consumer report | Regulation | FCRA, 15 U.S.C. 1681b | “How did the client authorize this application?” records the authorization method; wording requires Legal review |
| Consumer consent to electronic records | Regulation (consumer transactions) | E-SIGN Act, 15 U.S.C. 7001(c) | Attestation that the client consented to electronic records and signatures |
| Open-end consumer credit disclosures | Regulation (if consumer-purpose) | TILA / Regulation Z | Not represented; applicability depends on product structure — flag for Compliance |

## 9. Segregation of duties, traceability and human oversight

| Topic | Classification | Demo implementation |
|---|---|---|
| Manual collateral valuation exceptions approved by a separate credit function | Internal policy (assumed) / Supervisory expectation for sound credit risk management | Banker requests review; only the Credit Officer role records a rate (within a 35–60% range) with a rationale; banker submits |
| Audit trail of consequential events | Internal policy (assumed) / supports GLBA monitoring objectives | Events recorded with time, user, role, event and details (sensitive data viewed, co-borrower changes, ID updates, pledge changes, reviews, authorization, submission, simulated decisions, alert acknowledgment) |
| Transparent calculations | UX practice | Calculation details (rates and formula) and estimate history with before/after values |
| Estimates distinguished from decisions | UX practice; avoids misleading representations | “Estimated borrowing power … Not a credit decision or an offer of credit”; approved credit limit appears only after an underwriting decision |
| Confirmation of consequential actions | UX practice | Submit, remove co-borrower, record review, simulated decisions and signatures use confirmation dialogs |

## 10. What the demo does not do

- No authentication, encryption, server-side authorization, real audit logging, sanctions screening, identity verification or records retention.
- Role switching is a demo control; in production, roles come from the identity provider and are enforced server-side.
- Advance rates, thresholds, review ranges and timeouts are fictional.
