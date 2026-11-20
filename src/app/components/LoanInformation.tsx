import { ApplicationStepLayout } from './ApplicationStepLayout';
import { inputClass } from './CustomerInformation';
import type { ApplicationData, StepProps } from './LoanApplication';

type LoanField =
  | 'methodOfApplication'
  | 'primarySourceOfWealth'
  | 'secondarySourceOfWealth'
  | 'primarySourceOfRepayment'
  | 'secondarySourceOfRepayment'
  | 'relationshipManagerCorrect'
  | 'pricingExceptionRequested'
  | 'bookingCostCenter'
  | 'sustainabilityReview';

const SELECTS: Record<LoanField, { label: string; options: string[] }> = {
  methodOfApplication: { label: 'Method of Application', options: ['In Branch', 'Digital Assisted', 'Relationship Manager Initiated'] },
  primarySourceOfWealth: { label: 'Primary Source of Wealth', options: ['Business Income', 'Investments', 'Real Estate', 'Inheritance'] },
  secondarySourceOfWealth: { label: 'Secondary Source of Wealth', options: ['None', 'Investments', 'Spouse Income', 'Other'] },
  primarySourceOfRepayment: { label: 'Primary Source of Repayment', options: ['Business Cash Flow', 'Personal Income', 'Investment Income'] },
  secondarySourceOfRepayment: { label: 'Secondary Source of Repayment', options: ['None', 'Guarantor', 'Asset Liquidation'] },
  relationshipManagerCorrect: { label: 'Is the Relationship Manager for this request Correct?', options: ['Yes', 'No'] },
  pricingExceptionRequested: { label: 'Pricing Exception Requested?', options: ['Yes', 'No'] },
  bookingCostCenter: { label: 'Booking Cost Center', options: ['Commercial Lending', 'Small Business Banking', 'Private Banking'] },
  sustainabilityReview: { label: 'Should this be reviewed for Sustainability Requirements?', options: ['Yes', 'No'] },
};

const PRODUCT_INFO = [
  ['Product Category', 'Line of Credit'],
  ['Product Type', 'QLP 2'],
  ['Personal Loan Purpose', 'Personal Only'],
  ['Primary Loan Purpose', 'Texas'],
  ['Loan Secured By', 'Real Estate'],
  ['RM Officer', 'Clifford, Doug'],
];

const RATE_INFO = [
  ['Interest Rate Type', 'Variable'],
  ['Rate Index', 'SOFR - Daily'],
  ['Payment Structure', 'Interest Only'],
  ['Credit Action', 'New'],
  ['Disclosure Notification Sent', '11/10/2024'],
  ['Data Disclosure Sent', '11/04/2024'],
];

export function LoanInformation({ data, currentTab, completedSteps, onNext, onBack, onTabChange, onDataUpdate }: StepProps) {
  // Controlled by application state; every change is saved immediately.
  const handleChange = (field: keyof ApplicationData, value: string) => onDataUpdate({ [field]: value });

  const select = (field: LoanField) => (
    <div>
      <label htmlFor={`li-${field}`} className="text-xs font-medium text-gray-600 mb-2 block">
        {SELECTS[field].label}
      </label>
      <select
        id={`li-${field}`}
        className={inputClass}
        value={(data[field] as string) || ''}
        onChange={(e) => handleChange(field, e.target.value)}
      >
        <option value="">Select</option>
        {SELECTS[field].options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const readOnlyRow = (rows: string[][], label: string) => (
    <section className="mb-8 pb-8 border-b border-gray-200" aria-label={label}>
      <dl className="grid grid-cols-6 gap-x-6 gap-y-6">
        {rows.map(([dt, dd]) => (
          <div key={dt}>
            <dt className="text-xs font-medium text-gray-600 mb-2">{dt}</dt>
            <dd className="text-sm text-gray-900">{dd}</dd>
          </div>
        ))}
      </dl>
    </section>
  );

  return (
    <ApplicationStepLayout
      title="3. Loan Request - Loan Information"
      currentStep={currentTab}
      completedSteps={completedSteps}
      onTabChange={onTabChange}
      onBack={onBack}
      onPrimary={() => onNext()}
      primaryLabel="Next"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        {/* Loan Details Section */}
        <section className="mb-8 pb-8 border-b border-gray-200" aria-labelledby="sec-loan-details">
          <h3 id="sec-loan-details" className="text-base font-semibold text-gray-900 mb-6">Loan Details</h3>

          <div className="grid grid-cols-3 gap-6 mb-6">
            {select('methodOfApplication')}
            {select('primarySourceOfWealth')}
            {select('secondarySourceOfWealth')}
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            {select('primarySourceOfRepayment')}
            {select('secondarySourceOfRepayment')}
            {select('relationshipManagerCorrect')}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label htmlFor="li-loanAmount" className="text-xs font-medium text-gray-600 mb-2 block">Loan Amount</label>
              <div className="relative">
                <input
                  id="li-loanAmount"
                  type="text"
                  inputMode="decimal"
                  className={`${inputClass} pr-8`}
                  placeholder="Type Here"
                  value={data.loanAmount || ''}
                  onChange={(e) => handleChange('loanAmount', e.target.value.replace(/[^0-9.,]/g, ''))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" aria-hidden="true">$</span>
              </div>
            </div>

            {select('pricingExceptionRequested')}

            <div>
              <label htmlFor="li-spread" className="text-xs font-medium text-gray-600 mb-2 block">Spread over COF</label>
              <div className="relative">
                <input
                  id="li-spread"
                  type="text"
                  inputMode="decimal"
                  className={`${inputClass} pr-8`}
                  placeholder="Type Here"
                  value={data.spreadOverCOF || ''}
                  onChange={(e) => handleChange('spreadOverCOF', e.target.value.replace(/[^0-9.]/g, ''))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" aria-hidden="true">%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Read-only product information (set by the product, not editable here) */}
        {readOnlyRow(PRODUCT_INFO, 'Product information')}
        {readOnlyRow(RATE_INFO, 'Rate and disclosure information')}

        {/* Additional Fields Section */}
        <section className="mb-8 pb-8 border-b border-gray-200" aria-label="Booking and review">
          <div className="grid grid-cols-3 gap-6">
            {select('bookingCostCenter')}
            <div>
              <label htmlFor="li-rmMemo" className="text-xs font-medium text-gray-600 mb-2 block">RM Memo</label>
              <input
                id="li-rmMemo"
                type="text"
                className={inputClass}
                placeholder="Type Here"
                value={data.rmMemo || ''}
                onChange={(e) => handleChange('rmMemo', e.target.value)}
              />
            </div>
            {select('sustainabilityReview')}
          </div>
        </section>

        {/* ACH Auto Pay Option */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-600 mb-3">ACH Auto Pay Option</legend>
          <div className="flex items-center gap-8">
            {['Yes', 'No'].map(option => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="achAutoPayOption"
                  value={option}
                  checked={(data.achAutoPayOption || 'Yes') === option}
                  onChange={(e) => handleChange('achAutoPayOption', e.target.value)}
                  className="w-4 h-4 accent-[#0066CC]"
                />
                <span className="text-sm text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </ApplicationStepLayout>
  );
}
