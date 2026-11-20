/**
 * ALL DATA IN THIS FILE IS FICTIONAL.
 * Names, identifiers, accounts, balances, rates and loan amounts were invented
 * for a UX portfolio demonstration. They do not represent PNC customers,
 * transactions, products or policy.
 */

export type Mode = 'before' | 'after';
export type ScenarioId = 'single' | 'joint' | 'complex';

export type AssetClass =
  | 'cash' // cash & CDs held at the bank
  | 'liquid' // money market funds, T-bills < 7 yrs
  | 'fixed' // bonds, T-notes 7+ yrs
  | 'equity' // listed equities & ETFs
  | 'other' // mutual funds, alternatives
  | 'restricted'; // restricted / control stock — not marginable

export interface Person {
  id: string;
  name: string;
  dob: string;
  ssn: string; // masked display value
  /** Full fictional SSN for the audited reveal pattern. 9xx area numbers are never issued. */
  ssnFull?: string;
  mdmId: string;
  powerId: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  customerSince: string;
  idType: string;
  idNumber: string;
  idPlace: string;
  idIssued: string;
  idExpires: string;
  employmentStatus: string;
  employmentTitle: string;
  citizenship: string;
  maritalStatus: string;
}

export interface Account {
  id: string;
  name: string;
  number: string; // masked
  institution: string;
  owner: string;
  heldBy: string;
  relationship: 'Primary' | 'Joint' | 'Trust' | 'Entity';
  ownershipPct: number;
  holdings: { label: string; assetClass: AssetClass; value: number; singleIssuer?: boolean }[];
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  short: string;
  summary: string;
  applicationType: 'Individual' | 'Joint' | 'Entity';
  requestId: string;
  entityName?: string;
  primary: Person;
  coBorrowerId?: string; // person expected to be added as co-borrower
  beneficialOwners?: { personId: string; pct: number }[];
  requestedAmount: number;
  purpose: string;
  product: string;
  opportunityDate: string;
  createdBy: string;
  accounts: Account[];
  /** What makes the scenario interesting — shown on the intro screen. */
  challenge: string;
}

/** Advance rates used by both experiences (fictional policy). */
export const ADVANCE_RATES: Record<AssetClass, number> = {
  cash: 1.0,
  liquid: 0.8,
  fixed: 0.8,
  equity: 0.7,
  other: 0.6,
  restricted: 0,
};

export const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  cash: 'Cash & CDs at bank',
  liquid: 'Money market / T-bills < 7 yrs',
  fixed: 'Fixed income',
  equity: 'Listed equities & ETFs',
  other: 'Mutual funds & other',
  restricted: 'Restricted stock',
};

/** Single holding above this share of pledged collateral is “concentrated”. */
export const CONCENTRATION_LIMIT = 0.4;
/** Policy-bounded manual review range for a concentrated position. */
export const CONCENTRATION_REVIEW_RANGE = { min: 0.35, max: 0.6 };

const p = (o: Partial<Person> & Pick<Person, 'id' | 'name'>): Person => ({
  dob: '04/18/1971',
  ssn: '***-**-4410',
  mdmId: '7700000',
  powerId: '3100-00000',
  phone: '(412) 555-0100',
  email: 'client@example.com',
  address1: '410 Grandview Avenue',
  address2: '—',
  city: 'Pittsburgh',
  state: 'PA',
  zip: '15211',
  customerSince: '03/02/2011',
  idType: "Driver's License",
  idNumber: 'PA-30418827',
  idPlace: 'Pennsylvania',
  idIssued: '05/12/2021',
  idExpires: '05/12/2029',
  employmentStatus: 'Employed',
  employmentTitle: 'Managing Director',
  citizenship: 'U.S. Citizen',
  maritalStatus: 'Married',
  ...o,
});

export const PEOPLE: Person[] = [
  p({ id: 'p-okafor', ssnFull: '912-48-2217', name: 'Daniel Okafor', dob: '09/03/1978', ssn: '***-**-2217', mdmId: '7710243', powerId: '3100-48217', phone: '(412) 555-0142', email: 'd.okafor@example.com', address1: '22 Beechwood Boulevard', city: 'Pittsburgh', zip: '15217', customerSince: '06/14/2012', idNumber: 'PA-29117450', employmentTitle: 'Orthopedic Surgeon', maritalStatus: 'Single' }),
  p({ id: 'p-marquez', ssnFull: '934-11-6630', name: 'Elena Marquez', dob: '02/22/1976', ssn: '***-**-6630', mdmId: '7720518', powerId: '3100-52066', phone: '(216) 555-0178', email: 'e.marquez@example.com', address1: '1180 Lakeshore Drive', city: 'Cleveland', state: 'OH', zip: '44107', customerSince: '11/03/2008', idNumber: 'OH-UR551208', idPlace: 'Ohio', employmentTitle: 'Founder & CEO' }),
  p({ id: 'p-reyes', ssnFull: '934-27-1904', name: 'Thomas Reyes', dob: '07/30/1974', ssn: '***-**-1904', mdmId: '7720519', powerId: '3100-52067', phone: '(216) 555-0179', email: 't.reyes@example.com', address1: '1180 Lakeshore Drive', city: 'Cleveland', state: 'OH', zip: '44107', customerSince: '11/03/2008', idNumber: 'OH-UR551977', idPlace: 'Ohio', idIssued: '08/14/2017', idExpires: '08/14/2025', employmentTitle: 'Architect' }),
  p({ id: 'p-lindqvist', ssnFull: '957-30-8812', name: 'Margaret Lindqvist', dob: '12/09/1965', ssn: '***-**-8812', mdmId: '7731002', powerId: '3100-60451', phone: '(412) 555-0191', email: 'm.lindqvist@example.com', address1: '7 Fox Chapel Road', city: 'Pittsburgh', zip: '15238', customerSince: '01/20/2004', idType: 'U.S. Passport', idNumber: '5480•••21', idPlace: 'U.S. Department of State', idIssued: '03/01/2020', idExpires: '03/01/2030', employmentTitle: 'Managing Member, Northbridge Holdings' }),
  p({ id: 'p-lindqvist-h', ssnFull: '957-62-3350', name: 'Henrik Lindqvist', dob: '05/16/1963', ssn: '***-**-3350', mdmId: '7731003', powerId: '3100-60452', phone: '(412) 555-0192', email: 'h.lindqvist@example.com', address1: '7 Fox Chapel Road', city: 'Pittsburgh', zip: '15238', customerSince: '01/20/2004', idNumber: 'PA-18802215', employmentTitle: 'Member, Northbridge Holdings' }),
  // Directory-only records (appear in search results, not scenario parties)
  p({ id: 'p-chen', name: 'Wei Chen', mdmId: '7740117', powerId: '3100-70114', ssn: '***-**-5521', email: 'w.chen@example.com' }),
  p({ id: 'p-adeyemi', name: 'Folake Adeyemi', mdmId: '7740251', powerId: '3100-70229', ssn: '***-**-7783', email: 'f.adeyemi@example.com' }),
  p({ id: 'p-novak', name: 'Petra Novak', mdmId: '7740388', powerId: '3100-70391', ssn: '***-**-0942', email: 'p.novak@example.com' }),
  p({ id: 'p-reyes-j', name: 'Julia Reyes', mdmId: '7720701', powerId: '3100-52301', ssn: '***-**-6619', email: 'j.reyes@example.com', city: 'Akron', state: 'OH', zip: '44303' }),
];

export const personById = (id: string) => PEOPLE.find((x) => x.id === id)!;

export const SCENARIOS: Scenario[] = [
  {
    id: 'single',
    label: 'Single borrower',
    short: 'Straightforward',
    summary: 'Individual client pledging a diversified brokerage portfolio.',
    challenge: 'All collateral is eligible; a clean path from evaluation to submission.',
    applicationType: 'Individual',
    requestId: 'SBL-24-10871',
    primary: personById('p-okafor'),
    requestedAmount: 400000,
    purpose: 'Real estate down payment',
    product: 'Securities-Based Line of Credit',
    opportunityDate: '10/28/2025',
    createdBy: 'J. Whitfield',
    accounts: [
      { id: 'a-4417', name: 'Brokerage — Growth', number: '••••4417', institution: 'Bank Brokerage', owner: 'Daniel Okafor', heldBy: 'Bank Brokerage', relationship: 'Primary', ownershipPct: 100, holdings: [{ label: 'U.S. listed equities', assetClass: 'equity', value: 310000 }, { label: 'Broad-market ETFs', assetClass: 'equity', value: 70000 }] },
      { id: 'a-4418', name: 'Brokerage — Income', number: '••••4418', institution: 'Bank Brokerage', owner: 'Daniel Okafor', heldBy: 'Bank Brokerage', relationship: 'Primary', ownershipPct: 100, holdings: [{ label: 'Municipal bonds', assetClass: 'fixed', value: 250000 }] },
      { id: 'a-2209', name: 'Money Market', number: '••••2209', institution: 'Bank Deposits', owner: 'Daniel Okafor', heldBy: 'Bank Deposits', relationship: 'Primary', ownershipPct: 100, holdings: [{ label: 'Money market fund', assetClass: 'liquid', value: 60000 }] },
    ],
  },
  {
    id: 'joint',
    label: 'Joint application',
    short: 'Extra verification',
    summary: 'Married co-applicants pledging joint and trust accounts.',
    challenge: "Co-borrower's ID expired 08/14/2025 and the trust account needs beneficial-owner certification.",
    applicationType: 'Joint',
    requestId: 'SBL-24-10904',
    primary: personById('p-marquez'),
    coBorrowerId: 'p-reyes',
    beneficialOwners: [{ personId: 'p-marquez', pct: 50 }, { personId: 'p-reyes', pct: 50 }],
    requestedAmount: 750000,
    purpose: 'Business expansion bridge',
    product: 'Securities-Based Line of Credit',
    opportunityDate: '11/04/2025',
    createdBy: 'J. Whitfield',
    accounts: [
      { id: 'a-7781', name: 'Joint Brokerage', number: '••••7781', institution: 'Bank Brokerage', owner: 'Elena Marquez & Thomas Reyes', heldBy: 'Bank Brokerage', relationship: 'Joint', ownershipPct: 100, holdings: [{ label: 'U.S. listed equities', assetClass: 'equity', value: 520000 }, { label: 'Dividend ETFs', assetClass: 'equity', value: 120000 }] },
      { id: 'a-7790', name: 'Marquez–Reyes Family Trust', number: '••••7790', institution: 'Bank Wealth Management', owner: 'Marquez–Reyes Family Revocable Trust', heldBy: 'Bank Wealth Management', relationship: 'Trust', ownershipPct: 100, holdings: [{ label: 'Investment-grade corporate bonds', assetClass: 'fixed', value: 410000 }] },
      { id: 'a-3302', name: 'Certificate of Deposit', number: '••••3302', institution: 'Bank Deposits', owner: 'Elena Marquez', heldBy: 'Bank Deposits', relationship: 'Primary', ownershipPct: 100, holdings: [{ label: '12-month CD', assetClass: 'cash', value: 90000 }] },
    ],
  },
  {
    id: 'complex',
    label: 'Complex collateral',
    short: 'Manual review',
    summary: 'Holding company pledging a concentrated stock position.',
    challenge: 'A single position exceeds the 40% concentration limit and one account holds restricted stock; manual review is required.',
    applicationType: 'Entity',
    requestId: 'SBL-24-10933',
    entityName: 'Northbridge Holdings LLC',
    primary: personById('p-lindqvist'),
    beneficialOwners: [{ personId: 'p-lindqvist', pct: 60 }, { personId: 'p-lindqvist-h', pct: 40 }],
    requestedAmount: 2100000,
    purpose: 'Acquisition of operating company',
    product: 'Securities-Based Line of Credit',
    opportunityDate: '11/11/2025',
    createdBy: 'J. Whitfield',
    accounts: [
      { id: 'a-9120', name: 'Concentrated Position', number: '••••9120', institution: 'Bank Brokerage', owner: 'Northbridge Holdings LLC', heldBy: 'Bank Brokerage', relationship: 'Entity', ownershipPct: 100, holdings: [{ label: 'Halvorsen Robotics (HRBT) — single stock', assetClass: 'equity', value: 1900000, singleIssuer: true }] },
      { id: 'a-9121', name: 'Diversified ETFs', number: '••••9121', institution: 'Bank Brokerage', owner: 'Northbridge Holdings LLC', heldBy: 'Bank Brokerage', relationship: 'Entity', ownershipPct: 100, holdings: [{ label: 'Total-market ETFs', assetClass: 'equity', value: 1150000 }] },
      { id: 'a-9122', name: 'International Equities', number: '••••9122', institution: 'Bank Brokerage', owner: 'Northbridge Holdings LLC', heldBy: 'Bank Brokerage', relationship: 'Entity', ownershipPct: 100, holdings: [{ label: 'Developed-market ADRs', assetClass: 'equity', value: 420000 }] },
      { id: 'a-9123', name: 'Founder Shares', number: '••••9123', institution: 'Bank Brokerage', owner: 'Northbridge Holdings LLC', heldBy: 'Bank Brokerage', relationship: 'Entity', ownershipPct: 100, holdings: [{ label: 'Restricted stock (Rule 144)', assetClass: 'restricted', value: 600000 }] },
      { id: 'a-9124', name: 'Treasury Ladder', number: '••••9124', institution: 'Bank Brokerage', owner: 'Northbridge Holdings LLC', heldBy: 'Bank Brokerage', relationship: 'Entity', ownershipPct: 100, holdings: [{ label: 'U.S. Treasury bills < 7 yrs', assetClass: 'liquid', value: 300000 }] },
    ],
  },
];

export const scenarioById = (id: ScenarioId) => SCENARIOS.find((s) => s.id === id)!;

/** Background pipeline rows (fictional) shown alongside the scenario requests. */
export interface PipelineRow {
  requestId: string;
  client: string;
  mdmId: string;
  powerId: string;
  product: string;
  created: string;
  createdBy: string;
  status: 'Pending Evaluation' | 'Evaluation In Progress' | 'Submitted' | 'In Underwriting' | 'Approved' | 'Returned for Correction';
  requestedAmount: number;
  borrowingPower: number;
  daysOpen: number;
  openItems: number;
  nextAction: string;
  purpose: string;
}

export const PIPELINE: PipelineRow[] = [
  { requestId: 'SBL-24-10812', client: 'Wei Chen', mdmId: '7740117', powerId: '3100-70114', product: 'Securities-Based Line of Credit', created: '10/09/2025', createdBy: 'J. Whitfield', status: 'Evaluation In Progress', requestedAmount: 250000, borrowingPower: 318000, daysOpen: 41, openItems: 2, nextAction: 'Confirm collateral ownership', purpose: 'Tax payment' },
  { requestId: 'SBL-24-10846', client: 'Folake Adeyemi', mdmId: '7740251', powerId: '3100-70229', product: 'Securities-Based Line of Credit', created: '10/21/2025', createdBy: 'R. Castellano', status: 'In Underwriting', requestedAmount: 1200000, borrowingPower: 1460000, daysOpen: 29, openItems: 0, nextAction: 'Awaiting underwriter', purpose: 'Liquidity reserve' },
  { requestId: 'SBL-24-10859', client: 'Petra Novak', mdmId: '7740388', powerId: '3100-70391', product: 'Securities-Based Line of Credit', created: '10/24/2025', createdBy: 'J. Whitfield', status: 'Pending Evaluation', requestedAmount: 180000, borrowingPower: 0, daysOpen: 26, openItems: 4, nextAction: 'Run evaluation', purpose: 'Home renovation' },
];

/** Post-underwriting credit relationships (fictional). */
export interface ActiveLine {
  id: string;
  client: string;
  approvedOn: string;
  limit: number;
  outstanding: number;
  collateralValue: number;
  maintenanceLtv: number; // ltv threshold for maintenance call
  docs: { name: string; status: 'Complete' | 'Pending signature' | 'Outstanding' }[];
  collateral: { account: string; value: number; change30d: number }[];
}

export const ACTIVE_LINES: ActiveLine[] = [
  { id: 'LOC-77104', client: 'Folake Adeyemi', approvedOn: '06/18/2025', limit: 1100000, outstanding: 420000, collateralValue: 1980000, maintenanceLtv: 0.7,
    docs: [{ name: 'Credit agreement', status: 'Complete' }, { name: 'Pledge & control agreement', status: 'Complete' }, { name: 'Annual financial statement', status: 'Outstanding' }],
    collateral: [{ account: 'Brokerage ••5102', value: 1450000, change30d: -0.032 }, { account: 'Money market ••5110', value: 530000, change30d: 0.002 }] },
  { id: 'LOC-77158', client: 'Wei Chen', approvedOn: '08/02/2025', limit: 500000, outstanding: 365000, collateralValue: 560000, maintenanceLtv: 0.7,
    docs: [{ name: 'Credit agreement', status: 'Complete' }, { name: 'Pledge & control agreement', status: 'Complete' }],
    collateral: [{ account: 'Brokerage ••8841', value: 560000, change30d: -0.071 }] },
];

export const SEARCH_DIRECTORY = PEOPLE;

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n));
export const fmtPct = (n: number, d = 0) => `${(n * 100).toFixed(d)}%`;

export const DISCLAIMER =
  'This is an independent UX portfolio demonstration. All names, customer information, account details, loan amounts, collateral values, calculations, and financial data are entirely fictional and do not represent actual PNC customers, transactions, lending decisions, or financial figures. This is not an official PNC application.';
