/**
 * Adapters that feed the BEFORE baseline (src/app/components) with the shared
 * fictional data, so both experiences work on identical scenarios.
 * The baseline UI itself is unchanged.
 */
import { ACTIVE_LINES, PEOPLE, PIPELINE, SCENARIOS, fmtMoney, scenarioById, type Account, type Person, type ScenarioId } from './data';
import { legacyAutoValue } from './engine';

type Status =
  | 'Pending Review'
  | 'Under Evaluation'
  | 'Approved'
  | 'Rejected'
  | 'On Hold'
  | 'Submitted to Underwriting'
  | 'Underwriting In Progress'
  | 'Pending Additional Information'
  | 'Underwriting Review Complete';

export interface BaselineLoan {
  id: string;
  applicationId: string;
  businessName: string;
  primaryApplicant: string;
  loanType: string;
  status: Status;
  lastUpdated: string;
  scenarioId?: ScenarioId;
  expandedDetails: {
    opportunityDate: string;
    product: string;
    customerPowerId: string;
    loanPurpose: string;
    loanAmount: string;
    evaluationHistory?: { date: string; action: string; evaluator: string; status: string; notes: string }[];
  };
}

const usd = (n: number) => `${fmtMoney(n)} USD`;

export const BASELINE_PENDING: BaselineLoan[] = [
  ...SCENARIOS.map((s, i) => ({
    id: s.id,
    applicationId: s.requestId,
    businessName: s.entityName ?? `${s.primary.name} (Individual)`,
    primaryApplicant: s.primary.name,
    loanType: 'Securities-Based Line of Credit',
    status: (['Pending Review', 'Pending Review', 'Under Evaluation'] as Status[])[i],
    lastUpdated: ['11/18/2025', '11/17/2025', '11/14/2025'][i],
    scenarioId: s.id,
    expandedDetails: {
      opportunityDate: s.opportunityDate,
      product: s.product,
      customerPowerId: s.primary.powerId,
      loanPurpose: s.purpose,
      loanAmount: usd(s.requestedAmount),
      evaluationHistory: [{ date: s.opportunityDate, action: 'Opportunity created', evaluator: s.createdBy, status: 'Completed', notes: `${s.applicationType} request created from relationship review` }],
    },
  })),
];

export const BASELINE_SUBMITTED: BaselineLoan[] = [
  ...PIPELINE.filter((r) => r.status === 'In Underwriting').map((r) => ({
    id: r.requestId,
    applicationId: r.requestId,
    businessName: `${r.client} (Individual)`,
    primaryApplicant: r.client,
    loanType: 'Securities-Based Line of Credit',
    status: 'Underwriting In Progress' as Status,
    lastUpdated: '11/12/2025',
    expandedDetails: {
      opportunityDate: r.created,
      product: r.product,
      customerPowerId: r.powerId,
      loanPurpose: r.purpose,
      loanAmount: usd(r.requestedAmount),
      evaluationHistory: [{ date: '11/12/2025', action: 'Submitted to Underwriting', evaluator: 'System', status: 'Completed', notes: 'Application package submitted for underwriting review' }],
    },
  })),
  ...ACTIVE_LINES.map((l) => ({
    id: l.id,
    applicationId: l.id,
    businessName: `${l.client} (Individual)`,
    primaryApplicant: l.client,
    loanType: 'Securities-Based Line of Credit',
    status: 'Underwriting Review Complete' as Status,
    lastUpdated: l.approvedOn,
    expandedDetails: {
      opportunityDate: l.approvedOn,
      product: 'Securities-Based Line of Credit',
      customerPowerId: PEOPLE.find((p) => p.name === l.client)?.powerId ?? '—',
      loanPurpose: 'Liquidity reserve',
      loanAmount: usd(l.limit),
      evaluationHistory: [{ date: l.approvedOn, action: 'Final Underwriting Review', evaluator: 'Underwriting', status: 'Completed', notes: 'Approved; documentation in progress' }],
    },
  })),
];

/** Pending Review queue for the baseline’s post-underwriting screen. */
export const BASELINE_REVIEW = [
  ...PIPELINE.map((r, i) => ({
    id: String(i + 1),
    applicationId: r.requestId,
    borrowerName: r.client,
    loanType: 'Securities-Based Line of Credit',
    requestedAmount: fmtMoney(r.requestedAmount),
    underwriterStatus: (['Approved', 'Started Request', 'Denied'] as const)[i % 3],
    lastUpdated: r.created,
  })),
  ...ACTIVE_LINES.map((l, i) => ({
    id: String(10 + i),
    applicationId: l.id,
    borrowerName: l.client,
    loanType: 'Securities-Based Line of Credit',
    requestedAmount: fmtMoney(l.limit),
    underwriterStatus: 'Approved' as const,
    lastUpdated: l.approvedOn,
  })),
];

/** Auto-evaluation cards for the baseline Evaluation screen. */
export function baselineAutoAccounts(applicationId: string) {
  const s = SCENARIOS.find((x) => x.requestId === applicationId);
  if (!s) return undefined;
  return s.accounts.map((a) => ({
    id: a.id,
    bankName: a.institution,
    accountNumber: a.number,
    borrowingPower: legacyAutoValue(a, s.accounts),
    selected: true,
  }));
}

/** Person record for a baseline application (falls back by Power ID). */
export function baselinePerson(applicationId: string, powerId: string): Person | undefined {
  const s = SCENARIOS.find((x) => x.requestId === applicationId);
  return s ? s.primary : PEOPLE.find((p) => p.powerId === powerId);
}

/** Collateral rows for the baseline Collaterals step. */
export function baselineCollaterals(applicationId: string) {
  const s = SCENARIOS.find((x) => x.requestId === applicationId);
  if (!s) return undefined;
  const typeOf = (a: Account) => {
    const c = a.holdings[0].assetClass;
    return c === 'fixed' || c === 'liquid' ? ['Securities', c === 'fixed' ? 'Corporate Bonds' : 'Government Bonds'] : c === 'cash' ? ['Cash', ''] : ['Equities', c === 'restricted' ? 'Common Stock' : 'Exchange-Traded Fund'];
  };
  return s.accounts.map((a, i) => ({
    id: `col-${a.id}`,
    collateralName: a.name,
    collateralAccountNumber: a.number,
    estimatedCollateralValue: fmtMoney(a.holdings.reduce((t, h) => t + h.value, 0)),
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'no' as const,
    savedAt: '',
    details: [{ id: `detail-${a.id}-1`, collateralType: typeOf(a)[0], collateralSubType: typeOf(a)[1], percentOfOwnership: String(a.ownershipPct), relationshipType: i === 0 ? 'Primary' : '', heldBy: '', accountOwner: a.owner }],
  }));
}

/** Directory search for the baseline Co-borrower step (MDM / Power / SSN). */
export function baselineSearch(by: 'mdm' | 'power' | 'ssn', query: string) {
  const q = query.trim().toLowerCase().replace(/[^0-9a-z]/g, '');
  if (!q) return [];
  return PEOPLE.filter((p) => {
    const field = by === 'mdm' ? p.mdmId : by === 'power' ? p.powerId : p.ssn;
    return field.toLowerCase().replace(/[^0-9a-z]/g, '').includes(q) || p.name.toLowerCase().includes(query.trim().toLowerCase());
  }).map((p) => ({
    id: p.id,
    name: p.name,
    role: '',
    relationship: '',
    powerId: p.powerId,
    mdmId: p.mdmId,
    ssn: p.ssn,
    dob: p.dob,
    phone: p.phone,
    email: p.email,
    addressLine1: p.address1,
    addressLine2: p.address2,
    city: p.city,
    state: p.state,
    zipCode: p.zip,
    customerSince: p.customerSince,
    proofOfIdentity: p.idType,
    idNumber: p.idNumber,
    placeOfIssuance: p.idPlace,
    dateIssued: p.idIssued,
    dateExpiration: p.idExpires,
    employmentStatus: p.employmentStatus,
    employmentTitle: p.employmentTitle,
    citizenshipStatus: p.citizenship,
  }));
}

export { scenarioById };

/**
 * Same fictional readiness rules as the After experience, applied to the
 * baseline's application data at the moment of Submit. Only rules that have
 * an equivalent field in the baseline are counted (e.g. no concentration
 * review, which the baseline has no mechanism for), plus beneficial-owner
 * certification, which the baseline cannot capture at all.
 */
export function baselineGaps(applicationId: string, d: Record<string, any>, totalBorrowingPower: number): { count: number; items: string[] } {
  const s = SCENARIOS.find((x) => x.requestId === applicationId);
  const items: string[] = [];
  const need = (ok: boolean, label: string) => { if (!ok) items.push(label); };
  need(!!d.isPoliticallyExposed, 'Politically exposed person status');
  need(d.isWeaponsRelated !== 'Yes', 'Explanation for “Yes” on weapons question');
  if (d.maritalStatus === 'Married' && !d.isJointApplication) need(!!String(d.spouseName ?? '').trim(), 'Spouse name');
  const requested = parseInt(String(d.requestedAmount ?? '0'), 10) || 0;
  need(requested > 0 && requested <= totalBorrowingPower, 'Requested amount within borrowing power');
  if (s?.applicationType === 'Joint') {
    const cos = (d.coBorrowers ?? []) as { dateExpiration?: string }[];
    need(cos.length > 0, 'Co-borrower added');
    need(cos.every((c) => !c.dateExpiration || !isPast(c.dateExpiration)), 'Co-borrower identification valid');
    need(!!d.hasCoApplicantPermission, 'Co-applicant permission');
  }
  if (s && (s.applicationType === 'Entity' || s.accounts.some((a) => a.relationship === 'Trust'))) items.push('Beneficial ownership certification (not captured)');
  need(((d.collaterals ?? []) as { isSelected?: boolean }[]).some((c) => c.isSelected), 'Collateral selected');
  need(!!d.primarySourceOfWealth, 'Primary source of wealth');
  need(!!d.primarySourceOfRepayment, 'Primary source of repayment');
  need(!!d.sustainabilityReview, 'Sustainability review answer');
  if (d.pricingExceptionRequested === 'Yes') need(!!d.spreadOverCOF, 'Pricing exception spread');
  return { count: items.length, items };
}

function isPast(mmddyyyy: string) {
  const [m, dd, y] = mmddyyyy.split('/').map(Number);
  return !!(m && dd && y) && new Date(y, m - 1, dd) < new Date(2025, 10, 19);
}
