import { useState } from 'react';
import { User } from 'lucide-react';
import { ApplicationStepLayout } from './ApplicationStepLayout';
import type { ApplicationData, StepProps } from './LoanApplication';
import { useDemoOptional } from '../../demo/DemoContext';

interface CustomerInformationProps extends StepProps {
  applicationId: string;
  totalBorrowingPower: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatCurrencyInput = (value: string) => {
  if (!value) return '';
  return new Intl.NumberFormat('en-US').format(parseInt(value, 10));
};

export const inputClass =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]';

/** Read-only label/value pair placed in an explicit grid column. */
function Detail({ label, value, col }: { label: string; value: string; col?: string }) {
  return (
    <div className={col}>
      <dt className="text-xs font-medium text-gray-600 mb-2">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value}</dd>
    </div>
  );
}

/**
 * Primary borrower identity card — fixed 400 × 180.
 * Every value is read from application state.
 */
export function PrimaryBorrowerCard({ data }: { data: ApplicationData }) {
  const details: { label: string; value: string; wide?: boolean }[] = [
    { label: 'DOB', value: data.dob },
    { label: 'MDM ID', value: data.mdmId },
    { label: 'SSN', value: data.ssn },
    { label: 'Power ID', value: data.powerId },
    { label: 'Phone', value: data.phone, wide: true },
    { label: 'Email', value: data.email, wide: true },
  ];

  return (
    <article
      aria-labelledby="primary-borrower-name"
      data-testid="borrower-card"
      className="w-[400px] h-[180px] bg-gray-50 border border-gray-400 rounded shadow-sm p-4 flex items-stretch gap-4 mb-6"
    >
      {/* Left: Avatar and Identity Header */}
      <div className="flex flex-col justify-center gap-2 w-[120px] flex-shrink-0">
        <div className="w-12 h-12 bg-[#0066CC] rounded flex items-center justify-center" aria-hidden="true">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-1">Primary Borrower</p>
          <h3 id="primary-borrower-name" className="text-xs font-semibold text-gray-900 leading-snug break-words">
            {data.legalName}
          </h3>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="w-px bg-gray-200 flex-shrink-0" aria-hidden="true" />

      {/* Right: Identity Details - Dense Grid */}
      <dl className="flex-1 min-w-0 grid grid-cols-2 content-center gap-x-5 gap-y-2">
        {details.map(({ label, value, wide }) => (
          <div key={label} className={wide ? 'col-span-2' : undefined}>
            <dt className="text-[10px] text-gray-500 uppercase tracking-wide leading-tight">{label}</dt>
            <dd className="text-xs font-medium text-gray-800 leading-tight mt-0.5 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function YesNoQuestion({
  name,
  question,
  value,
  onChange,
  last,
}: {
  name: string;
  question: string;
  value: string;
  onChange: (value: string) => void;
  last?: boolean;
}) {
  return (
    <fieldset className={`flex items-center justify-between gap-8 py-3 ${last ? '' : 'border-b border-gray-100'}`}>
      <legend className="float-left text-sm text-gray-900">{question}</legend>
      <div className="flex items-center gap-6 flex-shrink-0">
        {['Yes', 'No'].map(option => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="w-4 h-4 accent-[#0066CC] cursor-pointer"
            />
            <span className="text-sm text-gray-900">{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CustomerInformation({
  totalBorrowingPower,
  data,
  currentTab,
  completedSteps,
  onNext,
  onBack,
  onTabChange,
  onDataUpdate,
}: CustomerInformationProps) {
  const demo = useDemoOptional();
  const [amountError, setAmountError] = useState('');
  const formData = data;
  const update = (patch: Partial<ApplicationData>) => onDataUpdate(patch);

  const requested = parseInt(formData.requestedAmount || '0', 10);
  const overBy = requested - totalBorrowingPower;

  const handleSubmit = () => {
    if (!requested) {
      demo?.track('error', 'before');
      setAmountError('Enter the requested loan amount to continue.');
      document.getElementById('requested-amount')?.focus();
      return;
    }
    onNext();
  };

  return (
    <ApplicationStepLayout
      title="1. Loan Request - Customer Information"
      currentStep={currentTab}
      completedSteps={completedSteps}
      onTabChange={onTabChange}
      onBack={onBack}
      backLabel="Back to Evaluation"
      onPrimary={handleSubmit}
      primaryLabel="Next"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Confirm Requested Loan Amount */}
        <section className="mb-10 pb-10 border-b border-gray-200" aria-labelledby="sec-amount">
          <h3 id="sec-amount" className="text-base font-semibold text-gray-900 mb-6">Confirm Requested Loan Amount</h3>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label htmlFor="requested-amount" className="text-xs font-medium text-gray-600 mb-2 block">
                Requested Loan Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" aria-hidden="true">$</span>
                <input
                  id="requested-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formatCurrencyInput(formData.requestedAmount)}
                  aria-invalid={amountError ? true : undefined}
                  aria-describedby="requested-amount-hint"
                  onChange={(e) => {
                    setAmountError('');
                    update({ requestedAmount: e.target.value.replace(/[^0-9]/g, '') });
                  }}
                  className={`${inputClass} pl-8 ${amountError ? 'border-red-500' : ''}`}
                />
              </div>
              <p
                id="requested-amount-hint"
                className={`text-xs mt-1 ${amountError ? 'text-red-700' : overBy > 0 ? 'text-amber-700' : 'text-gray-500'}`}
                aria-live="polite"
              >
                {amountError ||
                  (overBy > 0
                    ? `Exceeds the total maximum borrowing power by ${formatCurrency(overBy)}. Adjust the amount or return to the Evaluation to add accounts.`
                    : `Within the total maximum borrowing power (${formatCurrency(totalBorrowingPower - requested)} available).`)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Total Maximum Borrowing Power</p>
              <p className="text-lg font-semibold text-[#0066CC] mt-2 tabular-nums">{formatCurrency(totalBorrowingPower)}</p>
              <p className="text-xs text-gray-500">Carried over from Total Evaluation</p>
            </div>
          </div>
        </section>

        {/* Customer Information */}
        <section className="mb-10 pb-10 border-b border-gray-200" aria-labelledby="sec-customer">
          <h3 id="sec-customer" className="text-base font-semibold text-gray-900 mb-6">Customer Information</h3>

          <PrimaryBorrowerCard data={formData} />

          {/* Address Information — standard six-column grid */}
          <dl className="grid grid-cols-6 gap-x-6 gap-y-4 mb-6" data-testid="address-grid">
            <Detail col="col-start-1" label="Address Line 1" value={formData.addressLine1} />
            <Detail col="col-start-2" label="Address Line 2" value={formData.addressLine2} />
            <Detail col="col-start-3" label="City" value={formData.city} />
            <Detail col="col-start-4" label="State" value={formData.state} />
            <Detail col="col-start-5" label="ZIP Code" value={formData.zipCode} />
            <Detail col="col-start-6" label="Customer Since" value={formData.customerSince} />
          </dl>

          {/* Identity Information — column 6 intentionally empty */}
          <dl className="grid grid-cols-6 gap-x-6 gap-y-4 mb-6" data-testid="identity-grid">
            <Detail col="col-start-1" label="Proof of Identity" value={formData.proofOfIdentity} />
            <Detail col="col-start-2" label="ID Number" value={formData.idNumber} />
            <Detail col="col-start-3" label="Place of Issuance" value={formData.placeOfIssuance} />
            <Detail col="col-start-4" label="Date Issued" value={formData.dateIssued} />
            <Detail col="col-start-5" label="Date of Expiration" value={formData.dateExpiration} />
          </dl>

          {/* Employment Information */}
          <dl className="grid grid-cols-6 gap-x-6 gap-y-4">
            <Detail col="col-start-1" label="Employment Status" value={formData.employmentStatus} />
            <Detail col="col-start-2" label="Employment Title" value={formData.employmentTitle} />
            <Detail col="col-start-3" label="Citizenship Status" value={formData.citizenshipStatus} />
          </dl>
        </section>

        {/* Additional Information */}
        <section aria-labelledby="sec-additional">
          <h3 id="sec-additional" className="text-base font-semibold text-gray-900 mb-6">Additional Information</h3>

          <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-8">
            <div>
              <label htmlFor="ci-pep" className="text-xs font-medium text-gray-600 mb-2 block">Is the person politically exposed?</label>
              <select
                id="ci-pep"
                value={formData.isPoliticallyExposed}
                onChange={(e) => update({ isPoliticallyExposed: e.target.value })}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label htmlFor="ci-marital" className="text-xs font-medium text-gray-600 mb-2 block">Marital Status</label>
              <select
                id="ci-marital"
                value={formData.maritalStatus}
                onChange={(e) => update({ maritalStatus: e.target.value })}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div>
              <label htmlFor="ci-spouse" className="text-xs font-medium text-gray-600 mb-2 block">Spousal Name</label>
              <input
                id="ci-spouse"
                type="text"
                value={formData.spouseName}
                onChange={(e) => update({ spouseName: e.target.value })}
                aria-describedby="ci-spouse-hint"
                className={inputClass}
              />
              <p id="ci-spouse-hint" className="text-xs text-gray-500 mt-1">
                {formData.maritalStatus === 'Married' ? "Enter the spouse's legal name." : 'Complete if the applicant is married.'}
              </p>
            </div>
          </div>

          {/* Compliance Questions */}
          <div>
            <YesNoQuestion
              name="ci-weapons"
              question="Is the client engaged in the sale (wholesale or retail), manufacture or distribution of weapons, ammunition, components, or special nuclear weapons as contracted by the US Government?"
              value={formData.isWeaponsRelated}
              onChange={(v) => update({ isWeaponsRelated: v })}
            />
            <YesNoQuestion
              name="ci-repayment"
              question="Should PNC expect repayment from anyone other than the co-borrower?"
              value={formData.isPNCRepayment}
              onChange={(v) => update({ isPNCRepayment: v })}
            />
            <YesNoQuestion
              name="ci-inconsistent"
              question="Is the source of repayment inconsistent with the customer's profile or industry?"
              value={formData.isInconsistentSource}
              onChange={(v) => update({ isInconsistentSource: v })}
              last
            />
          </div>
        </section>
      </form>
    </ApplicationStepLayout>
  );
}
