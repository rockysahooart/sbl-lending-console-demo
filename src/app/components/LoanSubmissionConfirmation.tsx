import { useState } from 'react';
import { CheckCircle, FileText, Download } from 'lucide-react';
import { Header } from './Header';

interface LoanSubmissionConfirmationProps {
  applicationId: string;
  customerName: string;
  loanAmount: string;
  onReturnToDashboard: () => void;
  onViewDetails: () => void;
}

export function LoanSubmissionConfirmation({
  applicationId,
  customerName,
  loanAmount,
  onReturnToDashboard,
  onViewDetails,
}: LoanSubmissionConfirmationProps) {
  const [downloadNote, setDownloadNote] = useState('');
  const handleDownloadPDF = () => {
    // The browser's print dialog provides "Save as PDF" for the summary.
    setDownloadNote('Print dialog opened — choose “Save as PDF” to download the summary.');
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header pageTitle="Loan Request" />

      <div className="flex-1 min-h-0 bg-[#0066CC] flex flex-col">
        {/* Page Title Area */}
        <div className="px-8 pt-6 pb-4">
          <h2 className="text-2xl font-semibold text-white">Loan Request Submitted</h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 bg-white rounded-t-lg mx-8 mb-0 overflow-hidden flex flex-col">
          {/* Scrollable Content */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-8 py-8">
            {/* Success Icon and Message */}
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-12 h-12 text-green-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Your loan request has been successfully submitted
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Application <span className="font-medium text-gray-900">{applicationId}</span> for{' '}
                    <span className="font-medium text-gray-900">{customerName}</span> requesting{' '}
                    <span className="font-medium text-gray-900">{loanAmount}</span> has been received by our underwriting team. 
                    You will be notified as the application progresses through each stage of review.
                  </p>
                </div>
              </div>

              {/* Download PDF Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-gray-600" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-0.5">
                        Full Loan Summary Package
                      </div>
                      <div className="text-xs text-gray-500">
                        Complete application details and supporting documentation
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download PDF
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3 empty:hidden" role="status" aria-live="polite">{downloadNote}</p>
              </div>

              {/* What Happens Next Section */}
              <div className="mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  What happens next
                </h3>
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Initial Review and Underwriting
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Our underwriting team will conduct a preliminary assessment of the application, 
                        reviewing financial statements, collateral valuations, and customer credit history. 
                        Additional documentation may be requested during this phase.
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 flex justify-center">
                      <div className="w-0.5 h-6 bg-gray-300"></div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Credit Decisioning
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        The credit committee will evaluate the complete underwriting package and render 
                        a decision on the loan request. This includes assessment of credit risk, pricing structure, 
                        terms and conditions, and any required covenants or guarantees.
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 flex justify-center">
                      <div className="w-0.5 h-6 bg-gray-300"></div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Documentation and Closing
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Upon approval, loan documents will be prepared including the credit agreement, 
                        security agreements, promissory notes, and any ancillary documentation. The borrower 
                        will review, execute, and return all required documents to finalize the transaction.
                      </p>
                    </div>
                  </div>

                  {/* Connector Line */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 flex justify-center">
                      <div className="w-0.5 h-6 bg-gray-300"></div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0066CC] text-white flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Funding
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        After all documentation has been executed and conditions precedent have been satisfied, 
                        the loan will be funded according to the agreed disbursement schedule. Funds will be 
                        transferred to the designated account as specified in the loan agreement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 leading-relaxed">
                  <span className="font-semibold">Note:</span> This loan request has now entered our internal processing workflow. 
                  You will receive automated notifications at key milestones, and your relationship manager will contact you 
                  if any additional information is required. You can track the status of this application from the Securities Lending Console.
                </p>
              </div>
            </div>
          </main>

          {/* Footer Navigation */}
          <div className="flex-shrink-0 border-t border-gray-200 px-8 py-4 flex items-center justify-between bg-white">
            <button
              type="button"
              onClick={onViewDetails}
              className="text-sm text-[#0066CC] hover:underline font-medium"
            >
              View Loan Details
            </button>
            <button
              type="button"
              onClick={onReturnToDashboard}
              className="px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] transition-colors text-sm font-medium"
            >
              Return to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}