import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { usePersistentState } from '../state/ConsoleStore';
import { useModalA11y } from './useModalA11y';

interface AcknowledgmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Persists checkbox / review progress for this application. */
  storageKey?: string;
}

const ACK_ITEMS: { key: 'consent' | 'accuracy' | 'disclosures' | 'electronic' | 'compliance'; text: string }[] = [
  { key: 'consent', text: 'Consent to proceed with formal loan application submission' },
  { key: 'accuracy', text: 'Confirmation that all evaluation data and customer information is accurate and complete' },
  { key: 'disclosures', text: 'Acknowledgment of all required regulatory disclosures and lending compliance requirements' },
  { key: 'electronic', text: 'Agreement to electronic record-keeping and digital signature authority for application processing' },
  { key: 'compliance', text: 'Compliance awareness regarding anti-money laundering, KYC verification, and credit decisioning protocols' },
];

export function AcknowledgmentModal({ isOpen, onClose, onConfirm, storageKey = 'acknowledgment' }: AcknowledgmentModalProps) {
  const [ack, setAck] = usePersistentState(storageKey, () => ({
    checkboxes: {
      consent: false,
      accuracy: false,
      disclosures: false,
      electronic: false,
      compliance: false,
    },
    hasViewedFullAcknowledgement: false,
    isAccordionOpen: false,
  }));
  const { checkboxes, hasViewedFullAcknowledgement, isAccordionOpen } = ack;
  // Which guidance message to emphasise after an early click (no disabled controls).
  const [attention, setAttention] = useState<'step1' | 'step2' | null>(null);
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  // Check if all checkboxes are selected
  const allCheckboxesSelected = Object.values(checkboxes).every(value => value);
  const selectedCount = Object.values(checkboxes).filter(Boolean).length;

  const handleCheckboxChange = (key: keyof typeof checkboxes) => {
    setAttention(null);
    setAck(prev => {
      const nextBoxes = { ...prev.checkboxes, [key]: !prev.checkboxes[key] };
      const allSelected = Object.values(nextBoxes).every(Boolean);
      // Unchecking re-locks the disclosure and requires a fresh review.
      return allSelected
        ? { ...prev, checkboxes: nextBoxes }
        : { checkboxes: nextBoxes, isAccordionOpen: false, hasViewedFullAcknowledgement: false };
    });
  };

  const handleAccordionToggle = () => {
    if (!allCheckboxesSelected) {
      // Locked: explain instead of silently ignoring the click.
      setAttention('step1');
      return;
    }
    setAttention(null);
    setAck(prev => ({
      ...prev,
      isAccordionOpen: !prev.isAccordionOpen,
      // Once opened, mark as viewed
      hasViewedFullAcknowledgement: prev.hasViewedFullAcknowledgement || !prev.isAccordionOpen,
    }));
  };

  const handleConfirm = () => {
    if (hasViewedFullAcknowledgement) {
      onConfirm();
    } else {
      setAttention(allCheckboxesSelected ? 'step2' : 'step1');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - Subtle Dimming Scrim */}
      <div
        className="fixed inset-0 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative min-h-full flex items-center justify-center p-8 pointer-events-none">
        {/* Modal */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ack-title"
          aria-describedby="ack-intro"
          tabIndex={-1}
          className="pointer-events-auto relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#0066CC] px-8 py-6 flex items-center justify-between gap-4">
            <h2 id="ack-title" className="text-xl font-semibold text-white">Acknowledgment Required</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close acknowledgment"
              className="p-2 rounded text-white hover:bg-white/15 focus-visible:outline-white"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="px-8 py-8 overflow-y-auto flex-1">
            <h3 id="ack-intro" className="text-base font-semibold text-gray-900 mb-6">
              Before you start your Loan Request
            </h3>

            {/* Checkbox Items */}
            <fieldset className="space-y-4 mb-8">
              <legend className="sr-only">Required acknowledgements ({selectedCount} of 5 selected)</legend>
              {ACK_ITEMS.map(item => (
                <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkboxes[item.key]}
                    onChange={() => handleCheckboxChange(item.key)}
                    className="mt-0.5 w-4 h-4 accent-[#0066CC] rounded border-gray-300 cursor-pointer"
                  />
                  <span className="flex-1 text-sm text-gray-900">{item.text}</span>
                </label>
              ))}
            </fieldset>

            {/* Accordion Section */}
            <div className={`border rounded-lg overflow-hidden ${allCheckboxesSelected ? 'border-gray-300' : 'border-gray-200'}`}>
              <h4>
                <button
                  type="button"
                  onClick={handleAccordionToggle}
                  aria-expanded={isAccordionOpen && allCheckboxesSelected}
                  aria-controls="ack-full-text"
                  aria-describedby={allCheckboxesSelected ? undefined : 'ack-lock-hint'}
                  className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                    allCheckboxesSelected ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {!allCheckboxesSelected && <Lock className="w-4 h-4 text-gray-500" aria-hidden="true" />}
                    <span className={`text-sm font-semibold ${allCheckboxesSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      View full acknowledgement
                      {!allCheckboxesSelected && <span className="sr-only"> (locked)</span>}
                    </span>
                  </span>
                  {isAccordionOpen && allCheckboxesSelected ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  )}
                </button>
              </h4>

              {/* Helper Text when locked */}
              {!allCheckboxesSelected && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p id="ack-lock-hint" className="text-xs text-gray-600 italic">
                    Select all acknowledgements to view full disclosure
                  </p>
                </div>
              )}

              {/* Accordion Content */}
              {isAccordionOpen && allCheckboxesSelected && (
                <div id="ack-full-text" className="px-6 py-6 bg-white border-t border-gray-200">
                  <div className="text-sm text-gray-700 leading-relaxed space-y-4">
                  <p>
                    <strong className="font-semibold text-gray-900">FORMAL ACKNOWLEDGMENT AND AUTHORIZATION TO PROCEED</strong>
                  </p>
                  
                  <p>
                    By proceeding with this loan application, the authorized banking representative hereby acknowledges and confirms that all evaluation data, customer information, financial documentation, and supporting materials have been thoroughly reviewed for accuracy, completeness, and regulatory compliance in accordance with applicable federal and state lending regulations, including but not limited to the Truth in Lending Act (TILA), Equal Credit Opportunity Act (ECOA), Fair Credit Reporting Act (FCRA), Bank Secrecy Act (BSA), and USA PATRIOT Act requirements.
                  </p>
                  
                  <p>
                    The representative further acknowledges that all information entered into this system will be utilized for credit decisioning, underwriting analysis, risk assessment, compliance review, regulatory reporting, and internal record-keeping purposes. This data may be shared with credit bureaus, third-party verification services, regulatory agencies, and other authorized parties as necessary to process and evaluate this loan application in accordance with PNC Bank's established policies and procedures.
                  </p>
                  
                  <p>
                    The representative certifies that proper authorization has been obtained from the applicant(s) to collect, process, and transmit sensitive personal and financial information, including but not limited to Social Security numbers, tax identification numbers, income documentation, asset valuations, credit history, and employment verification. The representative takes full responsibility for the accuracy and authenticity of all information submitted and acknowledges that any material misrepresentation, falsification, or omission may result in application denial, loan revocation, legal action, and/or termination of banking relationship.
                  </p>
                  
                  <p>
                    By consenting to electronic record-keeping and digital signature authority, the representative agrees that all application materials, disclosures, notices, and communications may be provided, executed, and stored in electronic format in accordance with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and Uniform Electronic Transactions Act (UETA). The representative further acknowledges compliance awareness regarding anti-money laundering (AML) protocols, Know Your Customer (KYC) verification requirements, Office of Foreign Assets Control (OFAC) screening procedures, and Community Reinvestment Act (CRA) obligations.
                  </p>
                  
                  <p>
                    This acknowledgment constitutes a binding agreement between the banking representative and PNC Bank, N.A., and shall remain in effect throughout the duration of the application process and subsequent loan lifecycle, if approved. The representative understands that failure to comply with these terms and conditions may result in disciplinary action, regulatory sanctions, and legal liability as permitted by law.
                  </p>
                  </div>
                </div>
              )}
            </div>

            {/* Guidance - shows different states */}
            <div aria-live="polite">
              {!allCheckboxesSelected && (
                <div
                  className={`mt-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 ${
                    attention === 'step1' ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <p className="text-sm text-blue-800">
                    <strong className="font-semibold">Step 1:</strong> Select all five acknowledgements above to unlock the full disclosure. ({selectedCount} of 5 selected)
                  </p>
                </div>
              )}

              {allCheckboxesSelected && !hasViewedFullAcknowledgement && (
                <div
                  className={`mt-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 ${
                    attention === 'step2' ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  <p className="text-sm text-amber-800">
                    <strong className="font-semibold">Step 2:</strong> Expand and review the full acknowledgement before proceeding with the loan application.
                  </p>
                </div>
              )}

              {hasViewedFullAcknowledgement && allCheckboxesSelected && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-green-800">
                    <strong className="font-semibold">Ready:</strong> All acknowledgements are complete. Start Application opens Step 1, Customer Information.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline uppercase tracking-wide"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              aria-describedby={hasViewedFullAcknowledgement ? undefined : 'ack-start-hint'}
              className={`px-6 py-2.5 text-sm font-medium rounded transition-colors ${
                hasViewedFullAcknowledgement
                  ? 'bg-[#0066CC] text-white hover:bg-[#0052A3]'
                  : 'bg-white text-[#0066CC] border border-[#0066CC] hover:bg-blue-50'
              }`}
            >
              Start Application
            </button>
            {!hasViewedFullAcknowledgement && (
              <span id="ack-start-hint" className="sr-only">
                Complete both acknowledgement steps before starting the application
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
