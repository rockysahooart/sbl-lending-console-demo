import { X } from 'lucide-react';
import { useModalA11y } from './useModalA11y';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LoanOverviewProps {
  applicationId: string;
  businessName: string;
  primaryApplicant: string;
  loanType: string;
  loanAmount: string;
  onClose: () => void;
}

export function LoanOverview({
  applicationId,
  businessName,
  primaryApplicant,
  loanType,
  loanAmount,
  onClose,
}: LoanOverviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const panelRef = useModalA11y<HTMLDivElement>(true, onClose);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <>
      {/* Dimmed Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/15 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-8"
        onClick={(e) => {
          // Clicks on the dimmed area around the panel close it (backdrop click).
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="overview-title"
          tabIndex={-1}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 id="overview-title" className="text-lg font-semibold text-gray-900">
                Loan Overview — {applicationId}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Read-only view • Application currently in underwriting
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close loan overview"
              className="p-1 rounded text-gray-500 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content with Accordions */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-3">
              {/* Customer Information Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  aria-expanded={expandedSections.has('customer')}
                  aria-controls="overview-customer"
                  onClick={() => toggleSection('customer')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Customer Information
                  </span>
                  {expandedSections.has('customer') ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.has('customer') && (
                  <div id="overview-customer" className="px-6 py-6 bg-white border-t border-gray-200">
                    {/* Business Details */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Business Name
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {businessName}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Primary Contact
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {primaryApplicant}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Business Type
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            LLC
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Tax ID
                            </div>
                            <div className="text-sm font-semibold text-gray-900 font-mono leading-relaxed">
                              **-***4567
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Customer Since
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              03/15/2018
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Industry
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              Manufacturing
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                          <div className="col-span-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Business Address
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              1234 Commerce Boulevard, Pittsburgh, PA 15219
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Date of Expiration
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              12/31/2050
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Primary Phone
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              (412) 555-0123
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Email Address
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              contact@business.com
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Co-borrowers Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  aria-expanded={expandedSections.has('coborrowers')}
                  aria-controls="overview-coborrowers"
                  onClick={() => toggleSection('coborrowers')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Co-borrowers
                  </span>
                  {expandedSections.has('coborrowers') ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.has('coborrowers') && (
                  <div id="overview-coborrowers" className="px-6 py-6 bg-white border-t border-gray-200">
                    <div className="space-y-8">
                      {/* Co-borrower 1 */}
                      <div>
                        <div className="mb-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Co-borrower 1
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            Sarah Johnson
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Relationship
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                Co-Owner
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Ownership Percentage
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                35%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Credit Score
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                745
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                SSN
                              </div>
                              <div className="text-sm font-semibold text-gray-900 font-mono leading-relaxed">
                                ***-**-6789
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Date of Birth
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                05/14/1978
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200"></div>

                      {/* Co-borrower 2 */}
                      <div>
                        <div className="mb-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Co-borrower 2
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            Michael Davis
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Relationship
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                Guarantor
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Ownership Percentage
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                0%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Credit Score
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                812
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                SSN
                              </div>
                              <div className="text-sm font-semibold text-gray-900 font-mono leading-relaxed">
                                ***-**-3421
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Date of Birth
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                11/22/1965
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Loan Information Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  aria-expanded={expandedSections.has('loan')}
                  aria-controls="overview-loan"
                  onClick={() => toggleSection('loan')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Loan Information
                  </span>
                  {expandedSections.has('loan') ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.has('loan') && (
                  <div id="overview-loan" className="px-6 py-6 bg-white border-t border-gray-200">
                    <div className="space-y-5">
                      {/* Loan Details */}
                      <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Loan Type
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {loanType}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Requested Amount
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            {loanAmount}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Loan Term
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            60 months
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Interest Rate
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              7.25%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Payment Frequency
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              Monthly
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              First Payment Date
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              02/15/2026
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Loan Purpose
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            Equipment purchase and business expansion to support increased production capacity and meet growing market demand.
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Down Payment
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              $50,000
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              LTV Ratio
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              75%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              DSCR
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              1.45x
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Estimated Monthly Payment
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              $8,350
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Total Interest
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              $81,250
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Total Payback
                            </div>
                            <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                              $501,250
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collaterals Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  aria-expanded={expandedSections.has('collaterals')}
                  aria-controls="overview-collaterals"
                  onClick={() => toggleSection('collaterals')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Collaterals
                  </span>
                  {expandedSections.has('collaterals') ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {expandedSections.has('collaterals') && (
                  <div id="overview-collaterals" className="px-6 py-6 bg-white border-t border-gray-200">
                    <div className="space-y-8">
                      {/* Collateral 1 */}
                      <div>
                        <div className="mb-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Collateral 1
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            CNC Machining Center - Model XZ-5000
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Collateral Type
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                Equipment
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Year
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                2024
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Lien Position
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                First
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Appraised Value
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                $320,000
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200"></div>

                      {/* Collateral 2 */}
                      <div>
                        <div className="mb-4">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Collateral 2
                          </div>
                          <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                            Industrial Laser Cutter - Model LC-2500
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Collateral Type
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                Equipment
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Year
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                2023
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Lien Position
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                First
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-x-8 gap-y-5">
                            <div>
                              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Appraised Value
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                $190,000
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                              <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                                Total Collateral Value
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                $510,000
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">
                                Collateral Coverage Ratio
                              </div>
                              <div className="text-sm font-semibold text-gray-900 leading-relaxed">
                                121% (Adequate)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                This loan is currently in the underwriting phase. No modifications can be made at this time.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}