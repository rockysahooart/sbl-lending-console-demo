import { useEffect } from 'react';
import { usePersistentState } from '../state/ConsoleStore';
import { useDemoOptional, type Stage } from '../../demo/DemoContext';
import type { Person } from '../../demo/data';
import { baselineGaps } from '../../demo/beforeData';
import { CustomerInformation } from './CustomerInformation';
import { CoBorrower } from './CoBorrower';
import { LoanInformation } from './LoanInformation';
import { Collaterals } from './Collaterals';
import { LoanSubmissionConfirmation } from './LoanSubmissionConfirmation';

interface LoanApplicationProps {
  applicationId: string;
  customerName: string;
  opportunityDate: string;
  customerPowerId: string;
  loanPurpose: string;
  requestedAmount: string;
  totalBorrowingPower: number;
  /** Back from step 1 — returns to the Evaluation for this application. */
  onBack: () => void;
  /** Leaves the workflow for the dashboard (confirmation screen). */
  onReturnToConsole?: () => void;
  /** Demo: borrower record and collateral accounts for the scenario. */
  primary?: Person;
  collaterals?: any[];
}

/** Shared props for each application step. */
export interface StepProps {
  data: ApplicationData;
  currentTab: number;
  completedSteps: number[];
  onNext: (data?: Partial<ApplicationData>) => void;
  onBack: () => void;
  onTabChange: (tab: number) => void;
  onDataUpdate: (data: Partial<ApplicationData>) => void;
}

export type ApplicationData = {
  // Customer Information
  applicationType: 'Individual' | 'Joint';
  /** Digits only; confirmed / edited on step 1. */
  requestedAmount: string;
  // Step-1 "Additional Information" belongs to the primary borrower; the
  // co-borrower step's section of the same name is scoped to the co-borrowers.
  coBorrowerPoliticallyExposed?: string;
  coBorrowerMaritalStatus?: string;
  coBorrowerSpouseName?: string;
  legalName: string;
  businessName: string;
  dob: string;
  ssn: string;
  mdmId: string;
  powerId: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  customerSince: string;
  proofOfIdentity: string;
  idNumber: string;
  placeOfIssuance: string;
  dateIssued: string;
  dateExpiration: string;
  employmentStatus: string;
  employmentTitle: string;
  citizenshipStatus: string;
  isPoliticallyExposed: string;
  maritalStatus: string;
  spouseName: string;
  isWeaponsRelated: string;
  isPNCRepayment: string;
  isInconsistentSource: string;
  
  // Co-Borrower
  isJointApplication: boolean;
  hasCoApplicantPermission: boolean;
  repaymentSource: 'In person' | 'Online' | 'Via Phone';
  coBorrowers: CoBorrowerData[];

  // Loan Information
  methodOfApplication?: string;
  primarySourceOfWealth?: string;
  secondarySourceOfWealth?: string;
  primarySourceOfRepayment?: string;
  secondarySourceOfRepayment?: string;
  relationshipManagerCorrect?: string;
  loanAmount?: string;
  pricingExceptionRequested?: string;
  spreadOverCOF?: string;
  bookingCostCenter?: string;
  rmMemo?: string;
  sustainabilityReview?: string;
  achAutoPayOption?: string;

  // Collaterals
  collaterals?: any[];
};

export type CoBorrowerData = {
  id: string;
  name: string;
  powerId: string;
  mdmId: string;
  ssn: string;
  dob: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  customerSince: string;
  proofOfIdentity: string;
  idNumber: string;
  placeOfIssuance: string;
  dateIssued: string;
  dateExpiration: string;
  employmentStatus: string;
  employmentTitle: string;
  citizenshipStatus: string;
};

export function LoanApplication({
  applicationId,
  customerName,
  opportunityDate,
  customerPowerId,
  loanPurpose,
  requestedAmount,
  totalBorrowingPower,
  onBack,
  onReturnToConsole,
  primary,
  collaterals,
}: LoanApplicationProps) {
  // Persisted per application: leaving the workflow (Back to Evaluation, the
  // navigation menu) and returning restores the step and every entered value.
  const key = (name: string) => `application:${applicationId}:${name}`;
  const [currentStep, setCurrentStep] = usePersistentState(key('step'), () => 1);
  const [completedSteps, setCompletedSteps] = usePersistentState<number[]>(key('completed'), () => []);
  const [applicationData, setApplicationData] = usePersistentState<ApplicationData>(key('data'), () => ({
    applicationType: 'Individual',
    requestedAmount: requestedAmount.replace(/[^0-9]/g, ''),
    legalName: customerName,
    businessName: '',
    dob: primary?.dob ?? '—',
    ssn: primary?.ssn ?? '—',
    mdmId: primary?.mdmId ?? '—',
    powerId: customerPowerId,
    phone: primary?.phone ?? '—',
    email: primary?.email ?? '—',
    addressLine1: primary?.address1 ?? '—',
    addressLine2: primary?.address2 ?? '—',
    city: primary?.city ?? '—',
    state: primary?.state ?? '—',
    zipCode: primary?.zip ?? '—',
    customerSince: primary?.customerSince ?? '—',
    proofOfIdentity: primary?.idType ?? '—',
    idNumber: primary?.idNumber ?? '—',
    placeOfIssuance: primary?.idPlace ?? '—',
    dateIssued: primary?.idIssued ?? '—',
    dateExpiration: primary?.idExpires ?? '—',
    employmentStatus: primary?.employmentStatus ?? '—',
    employmentTitle: primary?.employmentTitle ?? '—',
    citizenshipStatus: primary?.citizenship ?? '—',
    isPoliticallyExposed: '',
    maritalStatus: '',
    spouseName: '',
    isWeaponsRelated: 'Yes',
    isPNCRepayment: 'Yes',
    isInconsistentSource: 'Yes',
    isJointApplication: false,
    hasCoApplicantPermission: false,
    repaymentSource: 'In person',
    coBorrowers: [],
    achAutoPayOption: 'Yes',
    ...(collaterals ? { collaterals } : {}),
  }));

  // Demo instrumentation: report the current step as a canonical stage.
  const demo = useDemoOptional();
  useEffect(() => {
    const map: Record<number, Stage> = { 1: 'customer', 2: 'parties', 3: 'loan', 4: 'collateral', 5: 'submitted' };
    demo?.reportStage('before', map[currentStep] ?? 'customer');
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToTop = () =>
    requestAnimationFrame(() => document.getElementById('step-panel')?.scrollTo({ top: 0 }));

  // Next / Save and Continue / Submit: save, mark the step completed, advance.
  const handleNext = (data?: Partial<ApplicationData>) => {
    if (data) setApplicationData(prev => ({ ...prev, ...data }));
    // Demo instrumentation: record missing/invalid items at the moment of Submit.
    if (currentStep === 4) demo?.recordGaps('before', baselineGaps(applicationId, { ...applicationData, ...data }, totalBorrowingPower).count);
    setCompletedSteps(prev => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    setCurrentStep(currentStep + 1);
    scrollToTop();
  };

  const handleBack = () => {
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const handleTabChange = (step: number) => {
    setCurrentStep(step);
    scrollToTop();
  };

  // Functional update: every field change merges into the latest state, so
  // rapid edits across components never overwrite each other.
  const handleDataUpdate = (data: Partial<ApplicationData>) => {
    setApplicationData(prev => ({ ...prev, ...data }));
  };

  const stepProps: StepProps = {
    data: applicationData,
    currentTab: currentStep,
    completedSteps,
    onNext: handleNext,
    onBack: handleBack,
    onTabChange: handleTabChange,
    onDataUpdate: handleDataUpdate,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerInformation
            applicationId={applicationId}
            totalBorrowingPower={totalBorrowingPower}
            {...stepProps}
          />
        );
      case 2:
        return <CoBorrower {...stepProps} />;
      case 3:
        return <LoanInformation {...stepProps} />;
      case 4:
        return <Collaterals {...stepProps} />;
      case 5:
        return (
          <LoanSubmissionConfirmation
            applicationId={applicationId}
            customerName={applicationData.legalName}
            loanAmount={`${formatAmount(applicationData.requestedAmount)} USD`}
            onReturnToDashboard={onReturnToConsole ?? onBack}
            onViewDetails={() => setCurrentStep(1)}
          />
        );
      default:
        // Unreachable: steps are 1–5. Fall back to the first step rather than a placeholder.
        return (
          <CustomerInformation applicationId={applicationId} totalBorrowingPower={totalBorrowingPower} {...stepProps} />
        );
    }
  };

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      {renderStep()}
    </div>
  );
}

const formatAmount = (digits: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    parseInt(digits || '0', 10),
  );
