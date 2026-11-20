# Desk research: users, customers, workflow and problems behind an SBL origination console

*Desk research prepared in November 2026 for the design team's first review round, directed by Sarthak "Rocky" Sahoo. Desk research only, from public sources, for a portfolio case study that uses fictional data. No real users were interviewed. Nothing here describes PNC's data, systems, volumes or policy. The personas are **proto-personas derived from desk research**. They are hypotheses to test, not findings.*

**How to read this.** Each claim carries a source tag [S#], listed in full under Sources. **Evidence** means a regulator, a statute, a lender's own disclosure, a job posting or a named survey says it. **Inference** means it is our reading, and it is marked *(inference)*. Some sources could only be checked through search-result excerpts because the page refused automated fetches; those carry *(excerpt)* in the Sources list. Regulatory notes are design input, not legal advice. This follows the team's rule that "complexity should be understood before it is simplified": for every stage we separate **essential complexity** (what regulation, credit risk or the client's protection requires) from **unnecessary friction** (what tools and process add).

---

## 1. Summary

- **SBL is a fast, light-documentation credit product whose real risk is in the collateral, not the borrower.** It is a revolving line secured by an investment account. It is typically non-purpose (proceeds cannot buy securities) [S1]. Advance rates vary by asset class; the SEC/FINRA alert cites roughly 50–65% for equities, 65–80% for corporate bonds and 95% for Treasuries [S2]. The lender can change eligibility, raise requirements, issue a maintenance call due in about two to three days, and sell collateral without notice [S1][S2][S15].
- **Most of the friction is essential.** CIP, beneficial ownership for legal entities, Reg U purpose statements above $100,000, Reg B rules on joint applicants, and separation between banker and credit decisions are legal or supervisory requirements [S5][S7][S8][S11][S12][S21]. A good console makes these quick and legible. It must not hide or skip them.
- **The unnecessary friction is well documented in adjacent lending.** Bankers re-key the same data across systems; nearly two-thirds of respondents in one survey re-enter a data point up to five times [S17]. Incomplete packages cause back-and-forth with credit [S19]. Chasing missing items is the most-cited "tickler" headache [S17]. These are commercial-lending figures, not SBL figures; that they transfer to SBL is *(inference)*.
- **SBL-specific failure points** are time-sensitive collateral values, concentration and eligibility rules, dual pledging, misuse of proceeds (purpose credit), and maintenance calls. FINRA named several of these as exam focus areas [S4].
- **The prototype already addresses many of these**: read-only client record, readiness checklist, manual concentration review by a separate credit role, expired-ID blocking, BO/trust ownership, a Reg U step, LTV alerts and an audit trail. Its main gaps are **time** (when values were priced, how long a request has waited, when a call must be cured) and **client-protection disclosures**.

---

## 2. Users (internal), as proto-personas derived from desk research

The names are role labels. The details combine job postings and lender descriptions; none is a real person.

### P1. Relationship banker / private banker (primary user of the console; “Loan Officer” in the prototype)
- **Job:** Acts as the high-net-worth client's main point of contact and coordinates specialists [S12][S22]. Private banker postings ask the banker to structure, negotiate and close loans, often with a deposit component, and to bring in new lending business [S22]. Some postings expect credit fluency, such as recommending credit grades and working with private-wealth underwriting [S22].
- **Incentives:** Production goals for funded loans and deposits appear in postings [S22]. FINRA notes that advisors may be paid on loan size and benefit when clients borrow rather than sell [S1]. *(Inference)* There is a structural pull toward speed and higher amounts. The console should make the risky options visible without slowing the safe path.
- **Context:** Client-facing and often interrupted. Handles a book of relationships rather than a queue of tickets *(inference from the role descriptions)*. Lending is one of several products [S13].
- **Expertise:** Ranges widely. Some bankers originate SBL often; others only occasionally *(inference)*. NN/g notes that users of complex applications tend to plateau at mediocre performance unless the tool teaches as they work [S20].
- **Needs:** A defensible number to tell the client; knowing what blocks submission; not having to re-type data the bank already holds; seeing who has the request now.

### P2. Client service associate (CSA) / banker's assistant
- **Job:** Prepares and submits forms, checks paperwork for completeness and accuracy, keeps CRM records current, and helps clients complete loan documents [S23].
- **Needs:** A checklist of what is missing, for whom and where to fix it; documents they can track; a way to work on a request the banker owns. *(Inference)* This is often the person who actually fills in the application.

### P3. Credit officer / SBL underwriter
- **Job:** Analyses client financials, structures, prices, risk-grades and documents SBL facilities [S24]. Evaluates the value and suitability of the securities pledged, including hard cases such as control or restricted stock [S24]. Reviews brokerage statements and system feeds to value private-bank collateral [S25]. Works with bankers, closing and portfolio managers [S24].
- **Experience:** Postings ask for about 3 to 8+ years of credit experience depending on seniority [S24].
- **Needs:** Complete packages [S19]; the exception and its rationale stated in one place; a clear record of which advance rate was applied and why; independence from the banker's view *(inference: separation of duties is a sound-credit-administration norm reflected in OCC exception tracking [S21])*.

### P4. Loan operations / closing and documentation
- **Job:** Prepares and tracks the credit agreement and the pledge and control agreement, books the line and confirms collateral control. Postings name "closing" and "processing" as distinct partner teams [S24]. *(Inference: the exact split differs by bank.)*
- **Needs:** Standard documents, consistent legal names and account numbers, and a list of documentation exceptions. Examiners expect banks to track documentation exceptions and report them in aggregate [S21].

### P5. BSA/AML and KYC reviewer
- **Job:** Applies CIP: collects name, DOB, address and ID number, verifies identity within a reasonable time, and screens against government lists [S7]. Identifies beneficial owners of legal-entity customers (each owner of 25% or more, plus one control person) [S8]. Private banking and trusts, including private investment companies, are higher-risk areas that examiners highlight [S12].
- **Needs:** Verified, dated identity data; an ownership structure that is not ambiguous; screening results with a date; no default answers on risk questions.

### P6. Servicing / collateral monitoring
- **Job:** Monitors loan-to-value, issues maintenance calls, follows up on cures, and handles changes to eligibility [S1][S2]. FINRA has also flagged controls against unintended **dual pledging** and AML surveillance across linked accounts [S4].
- **Needs:** Alerts ranked by urgency, with a cure deadline and the amount needed; a record of client outreach.

**Handoffs (inference, consistent with [S19][S24]):** banker or CSA builds the request → credit decides, possibly with conditions → banker obtains the conditions from the client → closing and operations document and book the line → servicing monitors it. Each arrow is a point where context can be lost.

---

## 3. Customers (end clients)

- **Who borrows:** High-net-worth individuals and families with investment portfolios [S13][S12]. Lenders often set minimums, such as portfolios of about $100,000 or more or a minimum facility size [S1][S14]. Account types include individual, joint and trust accounts; business entities (LLCs, partnerships, corporations) often go through a separate, assisted path [S14].
- **Why they borrow:** To raise cash without selling, which can avoid realising capital gains and keeps the portfolio invested [S1][S13]. Common uses include real-estate bridge financing, tax bills, business working capital, education and large purchases [S13]. Funds may be available within about a week of signing [S1].
- **What they expect *(inference from how lenders market it [S1][S13][S15])*:** speed, discretion, little paperwork compared with a mortgage, and one relationship contact.
- **Risks to them (evidence):**
  - **Maintenance calls:** if collateral value falls, the client must add collateral or repay, typically within two to three days [S1][S2].
  - **Liquidation:** the lender can sell securities, possibly without notice, which can trigger taxes [S1][S2][S15].
  - **Lender discretion:** the lender can change eligible collateral, raise requirements or call the loan [S1][S15].
  - **Concentration:** a concentrated portfolio is more exposed to a single market event [S2].
  - **Rates:** most lines are variable-rate, so costs rise when rates rise [S1][S13].
  - **Portability:** moving pledged assets usually requires paying off the line first [S1].
- **Purpose versus non-purpose:** SBL lines are generally non-purpose: "you can't use the proceeds to purchase or trade securities" [S1]. Under Reg U, a bank lending more than $100,000 secured by margin stock must have the client execute Form FR U-1, accepted in good faith by an officer. For revolving lines, the form is executed when the line is established [S5]. FINRA told firms to watch for red flags that SBL proceeds are being used to buy or carry margin stock [S4].
- **Joint applicants:** Reg B bars a creditor from requiring a spouse's signature when the applicant qualifies alone. It also says jointly held assets or a joint financial statement do not by themselves count as an application for joint credit [S11]. A secured-credit exception (§1002.7(d)(4)) can allow a signature needed to make the collateral available [S11].
- **Trusts and entities:** For legal-entity customers, banks identify 25% owners and a control person and obtain a certification [S8]. Only statutory trusts are legal-entity customers. Where a trust owns 25% or more of an entity, the trustee is treated as the beneficial owner [S8][S9]. In February 2026, FinCEN granted exceptive relief: banks no longer need to re-identify beneficial owners at each new account for an existing customer, and may rely on the customer confirming that prior information is still accurate [S10].

---

## 4. Workflow map

| # | Stage | Owner(s) | Artefacts | Essential complexity | Unnecessary friction / typical delays |
|---|---|---|---|---|---|
| 1 | Opportunity | Relationship banker | CRM opportunity, client goal, rough amount | Suitability and a risk conversation; FINRA expects disclosures on downturns, rising rates and tax on liquidation [S4] | Re-typing CRM data into origination [S17][S18] |
| 2 | Collateral evaluation | Banker; credit for exceptions | Account list, holdings, eligibility, advance rate by class, concentration test, indicative borrowing power | Advance rates differ by class [S2]; ineligible and restricted securities; concentration haircuts (one filed disclosure cuts the rate by at least 10 points when a single security exceeds 25% [S16]); price floors; held-away accounts | **Values change with the market between evaluation and approval** *(inference from [S2])*; manual valuation of non-standard positions [S24][S25]; unclear exception path |
| 3 | Application | Banker, CSA, client | Client record, CIP data, co-borrowers, entity or trust ownership, disclosures, consents, purpose statement (FR U-1 if over $100,000) | CIP [S7], CDD/BO [S8], Reg B [S11], Reg U [S5], OFAC screening | Re-keying; expired IDs found late; BO gaps; assisted-only routes for entities [S14]; **incomplete submissions** [S19] |
| 4 | Underwriting | Credit officer | Credit memo, risk grade, pricing, conditions, decision | Independent judgement; pricing; exception approval [S21][S24] | Missing information leads to back-and-forth [S19]; manual credit memos (7% of institutions fully automated, in a commercial-lending survey) [S17] |
| 5 | Conditions | Banker, CSA, client | List of conditions and responses | Conditions protect credit quality | Chasing missing items is the top "tickler" problem (65%) [S17]; unclear who holds the request |
| 6 | Documentation & pledge | Closing / loan ops, client | Credit agreement, pledge and control agreement, FR U-1, e-sign consent | Perfecting the security interest; control over the pledged account; Reg U records kept 3 years after the credit ends [S6] | Name and account mismatches; signature chasing *(inference)* |
| 7 | Funding | Loan ops | Booked line, disbursement | Disbursement must match the declared purpose [S4] | — |
| 8 | Monitoring | Servicing, banker | LTV, maintenance calls, eligibility changes, outreach log | Calls typically due in 2–3 days; may lead to liquidation [S1][S2]; dual-pledge controls [S4] | Alerts without a deadline or cure amount; outreach tracked outside the system *(inference)* |

**Turnaround.** FINRA says funds may be available within about a week of signing [S1]. No reputable public source gives an SBL-specific turnaround distribution. For commercial lending, 46% of survey respondents took at least five weeks to close, and underwriting itself usually took one to three days [S17]. *(Inference)* SBL is shorter because collateral replaces most financial analysis. The delays that remain come from stages 3 and 5: identity, ownership, conditions and signatures.

---

## 5. Problems

Severity reflects the **design** stakes for this console (harm to client, compliance or throughput). It is our judgement *(inference)*, not a measured rate.

| ID | Problem | Who it affects | Evidence | Severity |
|---|---|---|---|---|
| PR-01 | Re-keying the same data across disconnected systems | P1, P2, P3 | Re-keying named as the top commercial lending obstacle by 35%; nearly two-thirds re-enter a data point up to five times [S17]; 34% re-key from sales tools into onboarding [S18]; "one typo could derail the entire loan package" [S19] | High |
| PR-02 | Incomplete or "not in good order" submissions and rework loops with credit | P1, P2, P3 | Lenders submit requests missing what underwriters need [S19]; NIGO defined as paperwork rejected as incomplete or incorrect [S26]. *(No reputable SBL-specific rate found; vendor figures not used.)* | High |
| PR-03 | Chasing missing items and conditions; unclear who holds the request | P1, P2, client | 65% name tracking and following up on missing items as their biggest tickler headache; only 17% automate it [S17] | Medium–High |
| PR-04 | Collateral value moves between evaluation, approval and funding | P1, P3, client | Values can fall sharply and trigger calls; concentrated portfolios are most exposed [S2]; the lender can change eligibility [S1] | High *(inference: the client is told a figure that is no longer true)* |
| PR-05 | Concentration and eligibility rules that are hard to apply by hand | P1, P3 | Advance rates by class [S2]; concentration haircut example [S16]; price floors and exclusions vary by lender [S2][S14] | High |
| PR-06 | Manual valuation of non-standard collateral (restricted or control stock, held-away accounts) | P3 | Underwriters review brokerage statements and feeds to value collateral [S25] and analyse control and restricted stock [S24] | Medium |
| PR-07 | Expired ID or stale KYC found late | P1, P5 | CIP needs verification with unexpired government photo ID for documentary methods [S7] | Medium |
| PR-08 | Beneficial-ownership and trust gaps | P1, P5 | 25% owners plus control person, with certification [S8]; trusts and PICs are higher-risk [S12]; the 2026 relief changes when re-verification is needed [S10] | Medium–High |
| PR-09 | Purpose misuse and dual pledging | P1, P5, P6 | FINRA red flags for proceeds used on margin stock; dual-pledge controls [S4]; Reg U U-1 above $100,000 [S5] | High (regulatory) |
| PR-10 | Client not adequately warned of maintenance and liquidation risk | Client, P1 | FINRA focus on disclosure of downturn, rate and tax risk [S4]; incentives to lend [S1] | High (client harm) |
| PR-11 | Maintenance calls with short cure windows | P6, P1, client | Typically 2–3 days; sale possibly without notice [S1][S2][S15] | High |
| PR-12 | Audit and exception-tracking pressure | P3, P4, P5 | OCC expects documentation and policy exceptions to be tracked and reported in aggregate [S21] | Medium |
| PR-13 | New or occasional staff stuck at mediocre performance in a complex tool | P1, P2 | NN/g: complex-application users plateau; tools should teach by doing, support notes and resumption, and show secondary information in place [S20] | Medium |

---

## 6. Design implications

The prototype responses are what we read in the repo: `src/demo/after/*`, `docs/regulatory-and-security-notes.md` and `docs/content-standards.md`. **Small fix** means a copy or local UI change that fits Before-aligned IA. **Future** means a larger feature or back-end work. Each item names the human need it serves.

| Problem | Human need | Prototype response (observed) | Gap | Small fix now | Future work |
|---|---|---|---|---|---|
| PR-01 Re-keying | "Don't make me type what the bank already knows" (efficiency, accuracy) | Customer Information is read-only, "From the client record of 11/18/2025"; co-borrower search by MDM ID, Power ID or SSN (`Workspace.tsx:266`, `:407`) | None significant. **Protect this.** | Make sure the case study names this as a deliberate fix | Pre-fill from CRM opportunity; push data to the credit memo |
| PR-02 Incomplete submissions | "Tell me what's missing before credit does" (confidence) | Readiness checklist with links; `guidance.ts` next action; blocking items stop Submit | Covered | Keep the wording of blocking items identical between status panel, Console row and readiness list (content check) | Underwriter-defined submission rules |
| PR-03 Chasing conditions | "Who has it and how long has it been waiting?" (control, trust) | `waitingOn` (Credit Underwriting, Loan officer, Credit officer); conditions with "Condition provided"; document reminders (`PostUnderwriting.tsx:450`) | No elapsed time, owner per condition or due date | Add "Waiting since MM/DD/YYYY" to the status panel and each condition's requested date | SLA timers; CSA delegation |
| PR-04 Values move | "Can I stand behind the number I tell the client?" (honesty, trust) | Estimates labelled "Indicative estimate. Not a credit decision"; estimate history | **No "priced as of" time on market values or borrowing power** (no "as of" string found in `src/demo/after`) | Add "Market values as of MM/DD/YYYY, h:mm AM/PM" beside Total Maximum Borrowing Power and in the Collaterals table | Re-price at submit, with a delta if values moved |
| PR-05 Eligibility/concentration | "Show me why this account counts less" (understanding) | Advance-rate table in Evaluation; 40% single-issuer rule triggers manual review; ineligible accounts disabled with an explanation (`Evaluation.tsx:140`, `:168`) | Covered. Rates are fictional and labelled as such in docs | State the concentration rule in plain words next to the affected row (if not already visible on all states) | Rules from a policy service |
| PR-06 Manual valuation | "Exception decided by the right person, with a reason" (integrity) | Credit-officer-only review within a 35–60% range with rationale; banker cannot set the rate | Covered. **Protect.** | — | Attach the evidence (statement, restriction letter) to the review |
| PR-07 Expired ID | "Catch it early, not at submission" (efficiency) | Expired co-borrower ID flagged on the Console row and blocks submission until a current ID is recorded | Covered | Show expiry within, say, 60 days as a warning *(policy assumed)* | KYC refresh tasks |
| PR-08 BO/trust | "Ownership I can certify honestly" (compliance confidence) | Owners ≥25% and control person for the LLC; trust ownership labelled as internal policy, not BO | 2026 FinCEN relief [S10] is not reflected; docs say CTA reporting narrowed in 2025 | Update `docs/regulatory-and-security-notes.md` §2 to mention FIN-2026 exceptive relief (for existing entity customers, confirming prior BO information may be enough). Copy change: flag for Compliance | "Confirm ownership on file is current" path |
| PR-09 Purpose/dual pledge | "Don't let me lend into a violation" (protection) | Use of Proceeds step: purpose credit "Not available for this product"; FR U-1 checkbox; docs say the threshold needs confirming | Threshold is now confirmed by the regulation text: **over $100,000** for banks [S5]. No dual-pledge check | Helper text under the FR U-1 checkbox: "Required when credit secured by margin stock exceeds $100,000 (12 CFR 221.3(c))". Add a "Pledged to another facility" ineligibility reason in one reference record | Proceeds-destination check at funding |
| PR-10 Client risk disclosure | "My client understood the risk" (care, trust) | Acknowledgment Required dialog (Before wording); attestations | No explicit item recording that the **SBL risk disclosure** (maintenance calls, liquidation, tax, variable rate) was delivered | Add "SBL risk disclosure delivered" to the documents list or as one attestation line, flagged for Legal approval | Client-facing disclosure tracking |
| PR-11 Maintenance calls | "Act before the deadline" (urgency without panic) | Active Credit LTV alerts; "Acknowledge and schedule outreach"; maintenance threshold term | No cure deadline or cure amount | Add "Cure by MM/DD/YYYY" and "Deposit $X or repay $Y to return within threshold" to the alert, with fictional values and wording flagged for policy | Liquidation workflow; client notice templates |
| PR-12 Audit/exceptions | "Prove what happened" (accountability) | Audit trail with time, user, role and event; exceptions listed per request | Exceptions are per request, not aggregated | — (the queue already shows exception tags) | Portfolio exception report |
| PR-13 Learning | "Learn the rules while doing the work" (competence) | Next-action guidance, inline explanations, calculation details, RM Memo field | No resume note for interrupted work *(judgement)* | — | Pinned notes and a handoff note to a CSA |

**What this means for the case study (inference).** The redesign's strongest story is not "fewer steps". It is **the same essential steps, made legible**: the regulatory checks stay in place, while re-keying, late surprises and unclear exceptions are removed. The README says this plainly, and avoid implying that compliance steps were removed for speed.

---

## 7. Sources

Accessed November 2026. *(excerpt)* means the claim was checked through search-result excerpts because the page refused automated fetches.

- [S1] FINRA, "Securities-Backed Lines of Credit Explained," 3 Jan 2024. https://www.finra.org/investors/insights/securities-backed-lines-credit
- [S2] SEC Office of Investor Education & FINRA, Investor Alert "Securities-Backed Lines of Credit," Dec 2015 *(excerpt)*. https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/investor-28 ; FINRA release: https://www.finra.org/media-center/news-releases/2015/finra-sec-10-questions-investors-should-ask-about-securities-backed
- [S4] FINRA 2018 Regulatory and Examination Priorities Letter (SBLOC disclosures, margin-stock red flags, AML aggregation, dual pledging), as summarised by Sidley Austin, Jan 2018 *(secondary)*. https://sidley.com/en/insights/newsupdates/2018/01/finra-issues-its-2018-examination-priorities
- [S5] 12 CFR 221.3 (Regulation U), Cornell LII. https://www.law.cornell.edu/cfr/text/12/221.3
- [S6] Federal Reserve, Form FR U-1 information page (record retention) *(excerpt)*. https://www.federalreserve.gov/apps/reportingforms/Report/Index/FR_U-1
- [S7] 31 CFR 1020.220 (CIP for banks), Cornell LII. https://www.law.cornell.edu/cfr/text/31/1020.220
- [S8] 31 CFR 1010.230 (Beneficial ownership of legal entity customers), Cornell LII. https://www.law.cornell.edu/cfr/text/31/1010.230
- [S9] FinCEN, CDD Rule FAQs (statutory trusts; trustee as beneficial owner) *(excerpt via law-firm summaries)*. https://www.fincen.gov/resources/statutes-and-regulations/cdd-rule-faqs
- [S10] DLA Piper, "FinCEN issues exceptive relief from CDD Rule requirements," 2 Mar 2026 (order dated 13 Feb 2026). https://www.dlapiper.com/insights/publications/2026/03/fincen-issues-exceptive-relief-from-cdd-rule-requirements
- [S11] 12 CFR 1002.7 (Regulation B, rules concerning extensions of credit), Cornell LII. https://www.law.cornell.edu/cfr/text/12/1002.7
- [S12] FFIEC BSA/AML Examination Manual, private banking and trust/asset management risk sections *(excerpt)*. https://bsaaml.ffiec.gov/manual/RisksAssociatedWithMoneyLaunderingAndTerroristFinancing/18
- [S13] Regions Bank, "SBLOC 101: Guide to securities-based lines of credit." https://www.regions.com/insights/wealth/article/securities-based-line-of-credit-guide
- [S14] Charles Schwab, Pledged Asset Line advisor page (account types, $100,000 minimum facility) *(excerpt)*. https://advisorservices.schwab.com/serving-your-clients/invest-solutions/bank-lending-trust/pledged-asset-lines
- [S15] Morgan Stanley, Liquidity Access Line product page and disclosures *(excerpt)*. https://www.morganstanley.com/what-we-do/wealth-management/liquidity-access-line
- [S16] Pledged-asset loan agreement filed as an exhibit to Marchex Inc. Form 10-Q, 2015, SEC EDGAR (concentration rule example) *(excerpt)*. https://www.sec.gov/Archives/edgar/data/0001224133/000119312515284947/d936063dex1046.htm
- [S17] Abrigo, "Lending obstacles: manual processes despite digital pushes" (2021 Business Lending Process Survey, ~250 respondents, Feb–Mar 2021), 14 May 2021. https://www.abrigo.com/blog/lending-obstacles-manual-processes-despite-digital-pushes/ (vendor survey; commercial lending, not SBL)
- [S18] American Banker, "One-Third of Commercial Bankers Re-Key Data Into Onboarding Tools: Survey," 29 Oct 2012 (TechValidate for Pegasystems). https://www.americanbanker.com/news/one-third-of-commercial-bankers-re-key-data-into-onboarding-tools-survey
- [S19] Baker Hill, "Fostering Collaboration Between Lending & Credit Teams," 23 May 2023 (vendor). https://bakerhill.com/blog/fostering-collaboration-between-lending-credit-teams/
- [S20] Kate Kaplan, "8 Design Guidelines for Complex Applications" / "What Is a Complex Application?", Nielsen Norman Group, 8 Nov 2020. https://www.nngroup.com/articles/complex-application-design/
- [S21] OCC, Comptroller's Handbook, "Loan Portfolio Management" (sections on documentation exceptions, policy and underwriting exceptions, aggregate exception tracking) *(table of contents only)*. https://occ.gov/publications-and-resources/publications/comptrollers-handbook/files/loan-portfolio-management/pub-ch-loan-portfolio-mgmt.pdf
- [S22] Private banker job postings: City National Bank of Florida, Private Banking Officer *(excerpt)* https://careers-citynational.icims.com/jobs/5547/private-banking-officer/job ; BOK Financial, Private Wealth Banker *(excerpt)* https://www.theladders.com/job/private-wealth-banker-bok-financial-austin-tx_83356946
- [S23] Client service associate postings *(excerpt)*: https://recruiting.paylocity.com/recruiting/jobs/details/4338402 ; https://jobs.investmentsandwealth.org/job/registered-client-service-associate/81223531
- [S24] SBL underwriter postings *(excerpt)*: JPMorgan Wealth Management SBL Underwriter https://themuse.com/jobs/jpmorganchase/jp-morgan-wealth-management-securities-based-lending-underwriter-2dfac9 ; Lead SBL Underwriter https://jobs.hiringourheroes.org/jobs/168108018-lead-securities-based-lending-underwriter ; Goldman Sachs Private Bank Credit Underwriter https://higher.gs.com/roles/154123
- [S25] TriState Capital Bank, Credit Production Manager posting *(excerpt)*. https://tscbank.com/job-positions/credit-production-manager/
- [S26] Nasdaq, "What Is NIGO and What Does It Mean for You?" (definition only). https://www.nasdaq.com/articles/what-is-nigo-and-what-does-it-mean-for-you

*Deliberately excluded:* vendor NIGO-rate and rework-cost figures (unverifiable and promotional); an unattributed Schwab "1.4 days" cycle-time footnote whose scope was unclear; FINRA Regulatory Notice 14-52, which could not be verified.
