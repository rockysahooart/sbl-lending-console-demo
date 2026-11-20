import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalA11y } from './useModalA11y';
import { usePersistentState } from '../state/ConsoleStore';

/** Underwriter memo as the legacy system returned it: one free-text block per application. Fictional. */
const UW_MEMO: Record<string, string> = {
  'Started Request': 'UW REVIEW IN PROCESS. CONDITIONS: (1) PROVIDE MOST RECENT MONTH-END STMT FOR ALL PLEDGED ACCTS. (2) CONFIRM PRIMARY SOURCE OF REPAYMENT - STMTS DO NOT SUPPORT AMOUNT SHOWN. (3) EXPLAIN 10/02 DEPOSIT TO BROKERAGE ACCT. RESPOND IN BANKER COMMENTS BELOW. CONDITIONS MUST BE CLEARED PRIOR TO FINAL DECISIONING.',
  Approved: 'APPROVED. CR LIMIT PER REQUEST SUBJ TO STD COLLATERAL MAINT REQUIREMENTS. COMMUNICATE DECISION TO BORROWER AND RECORD RESPONSE.',
  Denied: 'DECLINED. INSUFFICIENT ELIGIBLE COLLATERAL AFTER CONCENTRATION ADJ. COMMUNICATE DECISION TO BORROWER AND RECORD RESPONSE.',
};

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: {
    applicationId: string;
    borrowerName: string;
    loanType: string;
    requestedAmount: string;
    /** Underwriter status from the queue; selects the underwriter memo shown. */
    underwriterStatus?: string;
  };
  onSubmit: (decision: DecisionData) => void;
}

export interface DecisionData {
  notificationMethod: string;
  dateCommunicated: string;
  borrowerResponse: 'Accept' | 'Deny' | 'Change Terms' | '';
  acceptanceDate?: string;
  fundingProcessingType?: string;
  withdrawalDate?: string;
  confirmWithdrawal?: boolean;
  confirmationMethod?: string;
  primaryReasonForWithdrawal?: string;
  specificReasonForWithdrawal?: string;
}

export function DecisionModal({ isOpen, onClose, application, onSubmit }: DecisionModalProps) {
  const [comments, setComments] = usePersistentState<{ at: string; text: string }[]>(`uw-comments:${application.applicationId}`, () => []);
  const [comment, setComment] = useState('');
  const [formData, setFormData] = useState<DecisionData>({
    notificationMethod: '',
    dateCommunicated: '',
    borrowerResponse: '',
    acceptanceDate: '',
    fundingProcessingType: '',
    withdrawalDate: '',
    confirmWithdrawal: false,
    confirmationMethod: '',
    primaryReasonForWithdrawal: '',
    specificReasonForWithdrawal: '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  // Required fields (marked *) for the chosen borrower response.
  const missingFields = () => {
    const missing: string[] = [];
    if (!formData.notificationMethod) missing.push('Notification Method');
    if (!formData.dateCommunicated) missing.push('Date Communicated');
    if (!formData.borrowerResponse) missing.push('Borrower Response');
    if (formData.borrowerResponse === 'Accept') {
      if (!formData.acceptanceDate) missing.push('Acceptance Date');
      if (!formData.fundingProcessingType) missing.push('Funding Processing Type');
    }
    if (formData.borrowerResponse === 'Deny') {
      if (!formData.withdrawalDate) missing.push('Withdrawal Date');
      if (!formData.confirmationMethod) missing.push('Confirmation Method');
      if (!formData.primaryReasonForWithdrawal) missing.push('Primary Reason for Withdrawal');
      if (!formData.specificReasonForWithdrawal) missing.push('Specific Reason for Withdrawal');
      if (!formData.confirmWithdrawal) missing.push('Confirm withdrawal');
    }
    return missing;
  };

  const handleSubmit = () => {
    const missing = missingFields();
    if (missing.length) {
      setErrors(missing);
      requestAnimationFrame(() => document.getElementById('decision-errors')?.focus());
      return;
    }
    setErrors([]);
    onSubmit(formData);
    // Reset form
    setFormData({
      notificationMethod: '',
      dateCommunicated: '',
      borrowerResponse: '',
      acceptanceDate: '',
      fundingProcessingType: '',
      withdrawalDate: '',
      confirmWithdrawal: false,
      confirmationMethod: '',
      primaryReasonForWithdrawal: '',
      specificReasonForWithdrawal: '',
    });
  };

  const updateField = (field: keyof DecisionData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors.length) setErrors([]);
  };

  return (
    <>
      {/* Backdrop - Subtle Dimming Scrim */}
      <div 
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Floating Panel with Consistent Corner Radius */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        aria-describedby="decision-subtitle"
        tabIndex={-1}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header - No radius, clipped by parent */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h2 id="decision-title" className="text-lg font-semibold text-gray-900">Final Decisioning</h2>
            <p id="decision-subtitle" className="text-sm text-gray-600 mt-0.5">
              {application.applicationId} • {application.borrowerName} • {application.requestedAmount}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Legacy underwriter memo and banker comments (separate from the decision fields below). */}
          <fieldset className="mb-6 border border-gray-300 p-3">
            <legend className="px-1 text-sm font-semibold">Underwriter Comments / Conditions</legend>
            <table className="w-full mb-2">
              <tbody>
                <tr><td className="font-semibold w-32">UW Status</td><td>{application.underwriterStatus ?? '—'}</td><td className="font-semibold w-24">Underwriter</td><td>CRUW-07</td></tr>
                <tr><td className="font-semibold align-top">Memo</td><td colSpan={3} className="lg-code">{UW_MEMO[application.underwriterStatus ?? ''] ?? 'NO COMMENTS.'}</td></tr>
                {comments.map((c, i) => (
                  <tr key={i}><td className="font-semibold align-top">Banker cmt</td><td colSpan={3}><span className="text-gray-600">{c.at} SMITCHELL: </span>{c.text}</td></tr>
                ))}
              </tbody>
            </table>
            <label htmlFor="uw-banker-comment" className="text-xs font-medium text-gray-600 mb-1 block">Banker Comments</label>
            <textarea id="uw-banker-comment" rows={2} className="w-full border border-gray-300" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => { if (comment.trim()) { setComments([...comments, { at: `11/19/2025 ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`, text: comment.trim() }]); setComment(''); } }}>Save Comment</button>
              <button type="button" onClick={() => setComment('')}>Clear</button>
            </div>
          </fieldset>

          {/* Top Fields - Always Visible */}
          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
            <div>
              <label htmlFor="decision-notificationMethod" className="text-xs font-medium text-gray-600 mb-2 block">
                Notification Method <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
              </label>
              <select
                id="decision-notificationMethod"
                value={formData.notificationMethod}
                onChange={(e) => updateField('notificationMethod', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
              >
                <option value="">Select...</option>
                <option value="Email">Email</option>
                <option value="Paper Mail">Paper Mail</option>
                <option value="In Person">In Person</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            <div>
              <label htmlFor="decision-dateCommunicated" className="text-xs font-medium text-gray-600 mb-2 block">
                Date Communicated <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
              </label>
              <input
                id="decision-dateCommunicated"
                type="date"
                value={formData.dateCommunicated}
                onChange={(e) => updateField('dateCommunicated', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
              />
            </div>

            <div>
              <label htmlFor="decision-borrowerResponse" className="text-xs font-medium text-gray-600 mb-2 block">
                Borrower Response <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
              </label>
              <select
                id="decision-borrowerResponse"
                value={formData.borrowerResponse}
                onChange={(e) => updateField('borrowerResponse', e.target.value as any)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
              >
                <option value="">Select...</option>
                <option value="Accept">Accept</option>
                <option value="Deny">Deny</option>
                <option value="Change Terms">Change Terms</option>
              </select>
            </div>
          </div>

          {/* Dynamic Content Based on Borrower Response */}
          
          {/* Accept Section */}
          {formData.borrowerResponse === 'Accept' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Acceptance Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="decision-acceptanceDate" className="text-xs font-medium text-gray-600 mb-2 block">
                    Acceptance Date <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
                  </label>
                  <input
                id="decision-acceptanceDate"
                    type="date"
                    value={formData.acceptanceDate}
                    onChange={(e) => updateField('acceptanceDate', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                  />
                </div>

                <div>
                  <label htmlFor="decision-fundingProcessingType" className="text-xs font-medium text-gray-600 mb-2 block">
                    Funding Processing Type <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
                  </label>
                  <select
                id="decision-fundingProcessingType"
                    value={formData.fundingProcessingType}
                    onChange={(e) => updateField('fundingProcessingType', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                  >
                    <option value="">Select...</option>
                    <option value="Standard Funding">Standard Funding</option>
                    <option value="Expedited Funding">Expedited Funding</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="ACH Transfer">ACH Transfer</option>
                    <option value="Check Disbursement">Check Disbursement</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Deny Section */}
          {formData.borrowerResponse === 'Deny' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Withdrawal Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="decision-withdrawalDate" className="text-xs font-medium text-gray-600 mb-2 block">
                      Withdrawal Date <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
                    </label>
                    <input
                id="decision-withdrawalDate"
                      type="date"
                      value={formData.withdrawalDate}
                      onChange={(e) => updateField('withdrawalDate', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>

                  <div>
                    <label htmlFor="decision-confirmationMethod" className="text-xs font-medium text-gray-600 mb-2 block">
                      Confirmation Method <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
                    </label>
                    <select
                id="decision-confirmationMethod"
                      value={formData.confirmationMethod}
                      onChange={(e) => updateField('confirmationMethod', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    >
                      <option value="">Select...</option>
                      <option value="Email Confirmation">Email Confirmation</option>
                      <option value="Written Letter">Written Letter</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="In-Person Meeting">In-Person Meeting</option>
                      <option value="Certified Mail">Certified Mail</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="decision-primaryReasonForWithdrawal" className="text-xs font-medium text-gray-600 mb-2 block">
                      Primary Reason for Withdrawal <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
                    </label>
                    <select
                id="decision-primaryReasonForWithdrawal"
                      value={formData.primaryReasonForWithdrawal}
                      onChange={(e) => updateField('primaryReasonForWithdrawal', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    >
                      <option value="">Select...</option>
                      <option value="Credit Decision">Credit Decision</option>
                      <option value="Borrower Request">Borrower Request</option>
                      <option value="Incomplete Documentation">Incomplete Documentation</option>
                      <option value="Regulatory Concerns">Regulatory Concerns</option>
                      <option value="Rate/Terms Not Acceptable">Rate/Terms Not Acceptable</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="decision-specificReasonForWithdrawal" className="text-xs font-medium text-gray-600 mb-2 block">
                      Specific Reason for Withdrawal <span className="text-red-600" aria-hidden="true">*</span><span className="sr-only"> (required)</span>
                    </label>
                    <select
                id="decision-specificReasonForWithdrawal"
                      value={formData.specificReasonForWithdrawal}
                      onChange={(e) => updateField('specificReasonForWithdrawal', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    >
                      <option value="">Select...</option>
                      <option value="Insufficient Cash Flow">Insufficient Cash Flow</option>
                      <option value="Credit Score Below Threshold">Credit Score Below Threshold</option>
                      <option value="Inadequate Collateral">Inadequate Collateral</option>
                      <option value="Customer Found Alternative Financing">Customer Found Alternative Financing</option>
                      <option value="Customer No Longer Needs Funds">Customer No Longer Needs Funds</option>
                      <option value="Missing Required Documents">Missing Required Documents</option>
                      <option value="BSA/AML Concerns">BSA/AML Concerns</option>
                      <option value="Pricing Not Competitive">Pricing Not Competitive</option>
                      <option value="Terms Not Acceptable to Borrower">Terms Not Acceptable to Borrower</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.confirmWithdrawal}
                      onChange={(e) => updateField('confirmWithdrawal', e.target.checked)}
                      className="w-4 h-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]"
                    />
                    <span className="text-sm text-gray-900 font-medium">Confirm withdrawal</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Change Terms Section */}
          {formData.borrowerResponse === 'Change Terms' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-xs font-semibold mt-0.5">
                  i
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Term Modification Required</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    If loan terms need to be changed, please reach out to the loan coordinator. 
                    Term modifications require additional review and approval before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {errors.length > 0 && (
          <div
            id="decision-errors"
            tabIndex={-1}
            role="alert"
            className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800"
          >
            <strong className="font-semibold">Complete the required fields:</strong> {errors.join(', ')}.
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-medium text-white bg-[#0066CC] rounded hover:bg-[#0052A3] transition-colors"
          >
            Submit Decision
          </button>
        </div>
      </div>
    </>
  );
}