/*
 * Additional FICTIONAL applications for the After experience only.
 * Every name, identifier, account number and amount here is invented for this
 * portfolio demonstration. The Before experience does not read this file, so its
 * data stays exactly as it was.
 */
import type { ActiveLine } from '../data';

export type AppType = 'Individual' | 'Joint' | 'Entity' | 'Trust';

export interface RefCollateral { name: string; number: string; value: number; rate: number; status: 'Auto evaluated' | 'Manual evaluation' | 'Manually evaluated' | 'Not eligible' | 'Not selected' }

export interface PendingRef {
  id: string;
  business: string;
  applicant: string;
  type: AppType;
  status: 'Pending Review' | 'Under Evaluation' | 'Application In Progress';
  lastUpdated: string;
  opportunityDate: string;
  purpose: string;
  powerId: string;
  officer: string;
  requested: number;
  collateral: RefCollateral[];
  /** Conditions outside the standard path that someone must decide on. */
  exceptions: string[];
  /** Readiness items still open, worded as in the Application status panel. */
  openItems: { step: string; label: string }[];
  history: { date: string; action: string; evaluator: string; notes: string }[];
}

const c = (name: string, number: string, value: number, rate: number, status: RefCollateral['status'] = 'Auto evaluated'): RefCollateral => ({ name, number, value, rate, status });

export const PENDING_REFS: PendingRef[] = [
  {
    id: 'SBL-24-10948', business: 'Corvin Ashby (Individual)', applicant: 'Corvin Ashby', type: 'Individual', status: 'Under Evaluation',
    lastUpdated: '11/19/2025', opportunityDate: '11/10/2025', purpose: 'Business expansion', powerId: '3100-51902', officer: 'J. Whitfield', requested: 900000,
    collateral: [c('Brokerage — Core', '••••6631', 820000, 0.7), c('Bond Ladder', '••••6640', 240000, 0.8)],
    exceptions: ['Coverage shortfall'],
    openItems: [{ step: 'Customer Information', label: 'Keep the requested amount within the total maximum borrowing power' }, { step: 'Loan Information', label: 'Select the primary source of repayment' }],
    history: [{ date: '11/10/2025', action: 'Opportunity created', evaluator: 'J. Whitfield', notes: 'Individual request from relationship review' }, { date: '11/19/2025', action: 'Auto evaluation run', evaluator: 'System', notes: 'Total Maximum Borrowing Power $766,000; $134,000 short of the request' }],
  },
  {
    id: 'SBL-24-10951', business: 'Rosalind Okeke (Joint)', applicant: 'Rosalind Okeke', type: 'Joint', status: 'Application In Progress',
    lastUpdated: '11/18/2025', opportunityDate: '11/03/2025', purpose: 'Tuition and education', powerId: '3100-52017', officer: 'R. Castellano', requested: 300000,
    collateral: [c('Joint Brokerage', '••••7105', 410000, 0.7), c('Money Market', '••••7112', 95000, 0.8)],
    exceptions: ['Co-borrower ID expired'],
    openItems: [{ step: 'Co-borrowers', label: 'Update Tobias Okeke’s identification (expired 08/31/2025)' }],
    history: [{ date: '11/03/2025', action: 'Opportunity created', evaluator: 'R. Castellano', notes: 'Joint request with spouse' }, { date: '11/18/2025', action: 'Application started', evaluator: 'S. Mitchell', notes: 'Acknowledgment completed' }],
  },
  {
    id: 'SBL-24-10955', business: 'Halvorsen Marine Supply LLC', applicant: 'Ingrid Halvorsen', type: 'Entity', status: 'Application In Progress',
    lastUpdated: '11/17/2025', opportunityDate: '10/30/2025', purpose: 'Working capital', powerId: '3100-52188', officer: 'J. Whitfield', requested: 1250000,
    collateral: [c('Corporate Brokerage', '••••8820', 1600000, 0.7), c('Treasury Account', '••••8836', 300000, 0.8)],
    exceptions: ['Beneficial-owner information missing'],
    openItems: [{ step: 'Co-borrowers', label: 'Certify beneficial ownership (one 25% owner has no verification on file)' }, { step: 'Loan Information', label: 'Answer the sustainability review question' }],
    history: [{ date: '10/30/2025', action: 'Opportunity created', evaluator: 'J. Whitfield', notes: 'Entity request; signer Ingrid Halvorsen' }],
  },
  {
    id: 'SBL-24-10957', business: 'Mateo Villanueva (Individual)', applicant: 'Mateo Villanueva', type: 'Individual', status: 'Under Evaluation',
    lastUpdated: '11/16/2025', opportunityDate: '11/06/2025', purpose: 'Real estate down payment', powerId: '3100-52240', officer: 'A. Brennan', requested: 650000,
    collateral: [c('Concentrated Position — single issuer', '••••9014', 980000, 0.35, 'Manual evaluation'), c('Brokerage — Balanced', '••••9021', 260000, 0.7)],
    exceptions: ['Concentration review needed'],
    openItems: [{ step: 'Evaluation', label: 'Complete the manual evaluation of flagged collateral' }, { step: 'Customer Information', label: 'Keep the requested amount within the total maximum borrowing power' }],
    history: [{ date: '11/06/2025', action: 'Opportunity created', evaluator: 'A. Brennan', notes: 'Single-issuer position is 79% of selected market value' }],
  },
  {
    id: 'SBL-24-10960', business: 'Delphine Moreau-Grant (Individual)', applicant: 'Delphine Moreau-Grant', type: 'Individual', status: 'Pending Review',
    lastUpdated: '11/15/2025', opportunityDate: '11/12/2025', purpose: 'Liquidity reserve', powerId: '3100-52301', officer: 'R. Castellano', requested: 200000,
    collateral: [c('Brokerage — Growth', '••••3307', 240000, 0.7), c('Restricted Stock (Rule 144)', '••••3315', 410000, 0, 'Not eligible')],
    exceptions: ['1 ineligible account', 'Coverage shortfall'],
    openItems: [{ step: 'Customer Information', label: 'Keep the requested amount within the total maximum borrowing power' }, { step: 'Customer Information', label: 'Answer the politically exposed person question' }, { step: 'Customer Information', label: 'Answer the three risk questions' }],
    history: [{ date: '11/12/2025', action: 'Opportunity created', evaluator: 'R. Castellano', notes: 'Restricted stock excluded from evaluation' }],
  },
  {
    id: 'SBL-24-10962', business: 'Anand Krishnaswamy (Individual)', applicant: 'Anand Krishnaswamy', type: 'Individual', status: 'Application In Progress',
    lastUpdated: '11/19/2025', opportunityDate: '10/27/2025', purpose: 'Home renovation', powerId: '3100-52355', officer: 'S. Mitchell', requested: 350000,
    collateral: [c('Brokerage — Dividend', '••••4410', 380000, 0.7), c('Certificates of Deposit', '••••4428', 150000, 1)],
    exceptions: [],
    openItems: [],
    history: [{ date: '10/27/2025', action: 'Opportunity created', evaluator: 'S. Mitchell', notes: 'Individual request' }, { date: '11/19/2025', action: 'All readiness checks complete', evaluator: 'S. Mitchell', notes: 'Ready to submit' }],
  },
  {
    id: 'SBL-24-10966', business: 'Whitcombe Family Trust', applicant: 'Eleanor Whitcombe', type: 'Trust', status: 'Under Evaluation',
    lastUpdated: '11/14/2025', opportunityDate: '11/01/2025', purpose: 'Estate liquidity', powerId: '3100-52412', officer: 'A. Brennan', requested: 800000,
    collateral: [c('Trust Brokerage', '••••5502', 1150000, 0.7), c('Municipal Bonds', '••••5519', 300000, 0.8)],
    exceptions: ['Trust ownership not certified'],
    openItems: [{ step: 'Co-borrowers', label: 'Certify trust ownership' }, { step: 'Loan Information', label: 'Confirm non-purpose use of proceeds and the purpose statement' }],
    history: [{ date: '11/01/2025', action: 'Opportunity created', evaluator: 'A. Brennan', notes: 'Trustee Eleanor Whitcombe' }],
  },
  {
    id: 'SBL-24-10969', business: 'Kestrel Orthodontics PC', applicant: 'Dr. Lionel Achebe', type: 'Entity', status: 'Application In Progress',
    lastUpdated: '11/13/2025', opportunityDate: '10/22/2025', purpose: 'Equipment purchase', powerId: '3100-52467', officer: 'J. Whitfield', requested: 450000,
    collateral: [c('Practice Brokerage', '••••6125', 700000, 0.7)],
    exceptions: ['Pricing exception'],
    openItems: [{ step: 'Loan Information', label: 'Enter the requested spread and justification' }],
    history: [{ date: '10/22/2025', action: 'Opportunity created', evaluator: 'J. Whitfield', notes: 'Pricing exception requested by the client' }],
  },
  {
    id: 'SBL-24-10972', business: 'Saoirse Brennan-Lowe (Individual)', applicant: 'Saoirse Brennan-Lowe', type: 'Individual', status: 'Under Evaluation',
    lastUpdated: '11/12/2025', opportunityDate: '11/04/2025', purpose: 'Tax payment', powerId: '3100-52503', officer: 'R. Castellano', requested: 500000,
    collateral: [c('Concentrated Position — single issuer', '••••7340', 600000, 0.35, 'Manual evaluation'), c('Brokerage — Core', '••••7358', 200000, 0.7)],
    exceptions: ['Concentration review requested'],
    openItems: [{ step: 'Evaluation', label: 'Credit officer review requested — awaiting approval' }, { step: 'Customer Information', label: 'Keep the requested amount within the total maximum borrowing power' }],
    history: [{ date: '11/04/2025', action: 'Opportunity created', evaluator: 'R. Castellano', notes: '' }, { date: '11/12/2025', action: 'Collateral review requested', evaluator: 'R. Castellano', notes: 'Awaiting credit officer approval' }],
  },
  {
    id: 'SBL-24-10975', business: 'Theo and Marguerite Lindahl (Joint)', applicant: 'Theo Lindahl', type: 'Joint', status: 'Pending Review',
    lastUpdated: '11/11/2025', opportunityDate: '11/11/2025', purpose: 'Bridge financing', powerId: '3100-52560', officer: 'S. Mitchell', requested: 1000000,
    collateral: [c('Joint Brokerage', '••••8803', 1300000, 0.7), c('Money Market', '••••8810', 160000, 0.8)],
    exceptions: ['Coverage margin is thin'],
    openItems: [{ step: 'Co-borrowers', label: 'Add a co-borrower' }, { step: 'Co-borrowers', label: 'Confirm the co-applicant’s permission to apply jointly' }],
    history: [{ date: '11/11/2025', action: 'Opportunity created', evaluator: 'S. Mitchell', notes: 'Coverage 104% before any market movement' }],
  },
];

export interface SubmittedRef {
  id: string;
  business: string;
  applicant: string;
  type: AppType;
  requested: number;
  power: number;
  submitted: string;
  /** Underwriter status, using the Pending Review vocabulary. */
  status: 'Underwriting In Progress' | 'Condition Requested' | 'Pending Credit Committee' | 'Underwriting Review Complete' | 'Declined';
  decision: 'Pending' | 'Approved' | 'Declined';
  approvedLimit?: number;
  conditions: string[];
  note: string;
  powerId: string;
  purpose: string;
}

export const SUBMITTED_REFS: SubmittedRef[] = [
  { id: 'SBL-24-10881', business: 'Beatrix Calloway (Individual)', applicant: 'Beatrix Calloway', type: 'Individual', requested: 420000, power: 515000, submitted: '11/18/2025', status: 'Underwriting In Progress', decision: 'Pending', conditions: [], note: 'Decision due in 2 business days.', powerId: '3100-49120', purpose: 'Liquidity reserve' },
  { id: 'SBL-24-10884', business: 'Navarro Logistics Group LLC', applicant: 'Esteban Navarro', type: 'Entity', requested: 2400000, power: 2610000, submitted: '11/17/2025', status: 'Condition Requested', decision: 'Pending', conditions: ['Provide the signed operating agreement listing all members with 25% or more ownership.'], note: 'Beneficial-owner documentation incomplete.', powerId: '3100-49188', purpose: 'Working capital' },
  { id: 'SBL-24-10887', business: 'Imogen Achterberg (Individual)', applicant: 'Imogen Achterberg', type: 'Individual', requested: 275000, power: 340000, submitted: '11/14/2025', status: 'Pending Credit Committee', decision: 'Pending', conditions: [], note: 'Pricing exception under committee review.', powerId: '3100-49231', purpose: 'Home renovation' },
  { id: 'SBL-24-10890', business: 'Okonjo-Reyes Revocable Trust', applicant: 'Adaeze Okonjo-Reyes', type: 'Trust', requested: 950000, power: 1180000, submitted: '11/12/2025', status: 'Underwriting Review Complete', decision: 'Approved', approvedLimit: 950000, conditions: [], note: 'Approved; documents issued for signature.', powerId: '3100-49305', purpose: 'Estate liquidity' },
  { id: 'SBL-24-10893', business: 'Gideon Pruitt (Individual)', applicant: 'Gideon Pruitt', type: 'Individual', requested: 600000, power: 560000, submitted: '11/10/2025', status: 'Declined', decision: 'Declined', conditions: [], note: 'Declined: estimated borrowing power below the requested amount after a market revaluation.', powerId: '3100-49377', purpose: 'Business expansion' },
  { id: 'SBL-24-10896', business: 'Sunniva and Paul Ekberg (Joint)', applicant: 'Sunniva Ekberg', type: 'Joint', requested: 380000, power: 455000, submitted: '11/07/2025', status: 'Condition Requested', decision: 'Pending', conditions: ['Provide a current, unexpired government-issued ID for Paul Ekberg.'], note: 'Co-borrower identification expired during review.', powerId: '3100-49402', purpose: 'Tuition and education' },
  { id: 'SBL-24-10899', business: 'Larkspur Veterinary Partners LLP', applicant: 'Dr. Fenna Oduya', type: 'Entity', requested: 700000, power: 910000, submitted: '11/05/2025', status: 'Underwriting Review Complete', decision: 'Approved', approvedLimit: 700000, conditions: [], note: 'Approved; awaiting pledge and control agreement.', powerId: '3100-49466', purpose: 'Equipment purchase' },
  { id: 'SBL-24-10902', business: 'Cassius Marchetti (Individual)', applicant: 'Cassius Marchetti', type: 'Individual', requested: 1500000, power: 1710000, submitted: '11/03/2025', status: 'Underwriting In Progress', decision: 'Pending', conditions: [], note: 'Concentrated position reviewed at 50%; underwriting confirming.', powerId: '3100-49521', purpose: 'Bridge financing' },
  { id: 'SBL-24-10905', business: 'Wren Abernathy (Individual)', applicant: 'Wren Abernathy', type: 'Individual', requested: 150000, power: 230000, submitted: '10/31/2025', status: 'Underwriting Review Complete', decision: 'Approved', approvedLimit: 150000, conditions: [], note: 'Approved and booked.', powerId: '3100-49588', purpose: 'Tax payment' },
  { id: 'SBL-24-10908', business: 'Tamsin Oyelaran-Hart (Individual)', applicant: 'Tamsin Oyelaran-Hart', type: 'Individual', requested: 520000, power: 610000, submitted: '10/29/2025', status: 'Pending Credit Committee', decision: 'Pending', conditions: [], note: 'Request exceeds the officer’s approval authority.', powerId: '3100-49640', purpose: 'Real estate down payment' },
];

const doc = (name: string, status: ActiveLine['docs'][number]['status']) => ({ name, status });

export const LINE_REFS: ActiveLine[] = [
  { id: 'LOC-77210', client: 'Wren Abernathy', approvedOn: '11/04/2025', limit: 150000, outstanding: 40000, collateralValue: 230000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete')], collateral: [{ account: 'Brokerage ••4471', value: 230000, change30d: 0.011 }] },
  { id: 'LOC-77196', client: 'Halcyon Dental Group PLLC', approvedOn: '10/21/2025', limit: 900000, outstanding: 610000, collateralValue: 920000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete'), doc('Annual financial statement', 'Outstanding')], collateral: [{ account: 'Corporate brokerage ••2290', value: 920000, change30d: -0.084 }] },
  { id: 'LOC-77181', client: 'Margarethe Solberg', approvedOn: '10/02/2025', limit: 300000, outstanding: 120000, collateralValue: 510000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete')], collateral: [{ account: 'Brokerage ••3318', value: 510000, change30d: 0.006 }] },
  { id: 'LOC-77173', client: 'Desmond Achterberg', approvedOn: '09/18/2025', limit: 650000, outstanding: 455000, collateralValue: 720000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Pending signature')], collateral: [{ account: 'Brokerage ••5520', value: 720000, change30d: -0.052 }] },
  { id: 'LOC-77165', client: 'Pemberton-Ruiz Family Trust', approvedOn: '09/02/2025', limit: 1200000, outstanding: 300000, collateralValue: 2050000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete'), doc('Trust certification', 'Complete')], collateral: [{ account: 'Trust brokerage ••6604', value: 1650000, change30d: -0.012 }, { account: 'Municipal bonds ••6611', value: 400000, change30d: 0.003 }] },
  { id: 'LOC-77149', client: 'Oren Vasquez-Lind', approvedOn: '08/14/2025', limit: 220000, outstanding: 205000, collateralValue: 330000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete')], collateral: [{ account: 'Brokerage ••7781', value: 330000, change30d: -0.061 }] },
  { id: 'LOC-77132', client: 'Lumen Architecture Studio LLC', approvedOn: '07/29/2025', limit: 500000, outstanding: 0, collateralValue: 840000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete'), doc('Beneficial ownership recertification', 'Outstanding')], collateral: [{ account: 'Corporate brokerage ••8850', value: 840000, change30d: 0.018 }] },
  { id: 'LOC-77120', client: 'Fiorella Castellane', approvedOn: '07/10/2025', limit: 400000, outstanding: 180000, collateralValue: 600000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete')], collateral: [{ account: 'Brokerage ••9902', value: 600000, change30d: -0.009 }] },
  { id: 'LOC-77111', client: 'Baptiste Okonkwo-Hale', approvedOn: '06/25/2025', limit: 750000, outstanding: 390000, collateralValue: 1010000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete'), doc('Annual financial statement', 'Outstanding')], collateral: [{ account: 'Brokerage ••1036', value: 760000, change30d: -0.021 }, { account: 'Money market ••1044', value: 250000, change30d: 0.002 }] },
  { id: 'LOC-77098', client: 'Rhiannon Takeda-Moss', approvedOn: '06/03/2025', limit: 280000, outstanding: 95000, collateralValue: 460000, maintenanceLtv: 0.7, docs: [doc('Credit agreement', 'Complete'), doc('Pledge & control agreement', 'Complete')], collateral: [{ account: 'Brokerage ••2257', value: 460000, change30d: 0.014 }] },
];

/** Total Maximum Borrowing Power for a reference record: Σ value × rate of selected, eligible accounts. */
export const refPower = (r: PendingRef) => r.collateral.filter((x) => x.status !== 'Not eligible' && x.status !== 'Not selected').reduce((t, x) => t + x.value * x.rate, 0);
export const refMarket = (r: PendingRef) => r.collateral.reduce((t, x) => t + x.value, 0);
