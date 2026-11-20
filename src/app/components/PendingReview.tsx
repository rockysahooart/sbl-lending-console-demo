import { useEffect, useState } from 'react';
import { useDemoOptional } from '../../demo/DemoContext';
import { Header } from './Header';
import { DecisionModal, DecisionData } from './DecisionModal';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { FilterPopup } from './FilterPopup';
import { BASELINE_REVIEW } from '../../demo/beforeData';

interface PendingReviewApplication {
  id: string;
  applicationId: string;
  borrowerName: string;
  loanType: string;
  requestedAmount: string;
  underwriterStatus: 'Approved' | 'Denied' | 'Started Request';
  lastUpdated: string;
  finalDecision?: 'Accepted' | 'Denied' | 'Change Terms Requested';
}

// Fictional data shared with the demo (src/demo). No real customers.
const mockPendingReviewData: PendingReviewApplication[] = BASELINE_REVIEW as PendingReviewApplication[];

interface PendingReviewProps {
  onBack: () => void;
  /** Demo navigation: open with this application's decision dialog (Before/After toggle). */
  initialApplicationId?: string;
}

// onBack is kept for API compatibility; the header menu now opens navigation.
export function PendingReview({ initialApplicationId }: PendingReviewProps) {
  const [applications, setApplications] = useState<PendingReviewApplication[]>(mockPendingReviewData);
  const initialApp = initialApplicationId ? mockPendingReviewData.find((a) => a.applicationId === initialApplicationId) ?? null : null;
  const [selectedApplication, setSelectedApplication] = useState<PendingReviewApplication | null>(initialApp);
  const [isModalOpen, setIsModalOpen] = useState(!!initialApp);
  // Demo navigation: report the open application so the toggle can follow it.
  const demo = useDemoOptional();
  const openId = isModalOpen ? selectedApplication?.applicationId : undefined;
  useEffect(() => {
    demo?.reportLocation('before', { screen: 'review', appId: openId });
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [decisionNote, setDecisionNote] = useState('');

  // Search, Filter, Sort State
  const [searchCriteria, setSearchCriteria] = useState<'applicationId' | 'borrowerName' | 'businessName'>('applicationId');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Apply search filter
  let filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    switch (searchCriteria) {
      case 'applicationId':
        return app.applicationId.toLowerCase().includes(query);
      case 'borrowerName':
        return app.borrowerName.toLowerCase().includes(query);
      case 'businessName':
        // For borrowerName field (since we don't have a separate business name)
        return app.borrowerName.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  // Apply status filter
  if (selectedStatuses.length > 0) {
    filteredApplications = filteredApplications.filter((app) => {
      // Check if the application has a final decision that matches the selected statuses
      if (app.finalDecision) {
        return selectedStatuses.includes(app.finalDecision);
      } else {
        // If no final decision, check if "Pending Banker Decision" is selected
        return selectedStatuses.includes('Pending Banker Decision');
      }
    });
  }

  // Apply sorting
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    const dateA = new Date(a.lastUpdated);
    const dateB = new Date(b.lastUpdated);
    return sortOrder === 'newest' 
      ? dateB.getTime() - dateA.getTime() 
      : dateA.getTime() - dateB.getTime();
  });

  const displayApplications = sortedApplications;

  const handleEvaluate = (application: PendingReviewApplication) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleSubmitDecision = (decisionData: DecisionData) => {
    if (!selectedApplication) return;

    // Map borrower response to final decision status
    let finalDecision: 'Accepted' | 'Denied' | 'Change Terms Requested' = 'Accepted';
    if (decisionData.borrowerResponse === 'Accept') {
      finalDecision = 'Accepted';
    } else if (decisionData.borrowerResponse === 'Deny') {
      finalDecision = 'Denied';
    } else if (decisionData.borrowerResponse === 'Change Terms') {
      finalDecision = 'Change Terms Requested';
    }

    // Update the application with the final decision
    setApplications(applications.map(app => 
      app.id === selectedApplication.id 
        ? { ...app, finalDecision }
        : app
    ));

    setDecisionNote(`${selectedApplication.applicationId}: final decision recorded as “${finalDecision}”.`);
    // Close modal
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const getUnderwriterStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Denied':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Started Request':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getFinalDecisionColor = (decision?: string) => {
    switch (decision) {
      case 'Accepted':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Denied':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Change Terms Requested':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return '';
    }
  };

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
      <Header pageTitle="Pending Review" />

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1584px] mx-auto px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Post-Underwriting Review Queue
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Applications reviewed by underwriting awaiting final banker decisioning
              </p>
              {decisionNote && (
                <p className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800" role="status">
                  {decisionNote}
                </p>
              )}
            </div>

            {/* Search, Filter, Sort Controls */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="flex-1 flex items-center gap-3">
                  <fieldset className="flex items-center gap-6 bg-white px-4 py-2 rounded border border-gray-300">
                    <legend className="sr-only">Search by</legend>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="review-search-criteria"
                        checked={searchCriteria === 'applicationId'}
                        onChange={() => setSearchCriteria('applicationId')}
                        className="w-4 h-4 text-[#0066CC] border-gray-300 focus:ring-[#0066CC]"
                      />
                      <span className="text-sm font-medium text-gray-700">Application ID</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="review-search-criteria"
                        checked={searchCriteria === 'businessName'}
                        onChange={() => setSearchCriteria('businessName')}
                        className="w-4 h-4 text-[#0066CC] border-gray-300 focus:ring-[#0066CC]"
                      />
                      <span className="text-sm font-medium text-gray-700">Business Name</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="review-search-criteria"
                        checked={searchCriteria === 'borrowerName'}
                        onChange={() => setSearchCriteria('borrowerName')}
                        className="w-4 h-4 text-[#0066CC] border-gray-300 focus:ring-[#0066CC]"
                      />
                      <span className="text-sm font-medium text-gray-700">Primary Applicant</span>
                    </label>
                  </fieldset>
                  
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <input
                      type="search"
                      aria-label={`Search by ${searchCriteria === 'applicationId' ? 'Application ID' : searchCriteria === 'businessName' ? 'Business Name' : 'Primary Applicant'}`}
                      placeholder={`Search by ${searchCriteria === 'applicationId' ? 'Application ID' : searchCriteria === 'businessName' ? 'Business Name' : 'Primary Applicant'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={isFilterOpen}
                    aria-haspopup="dialog"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                    {selectedStatuses.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-[#0066CC] text-white rounded-full text-xs">
                        {selectedStatuses.length}
                      </span>
                    )}
                  </button>

                  {isFilterOpen && (
                    <FilterPopup
                      selectedStatuses={selectedStatuses}
                      onStatusChange={(statuses) => {
                        setSelectedStatuses(statuses);
                      }}
                      onClose={() => setIsFilterOpen(false)}
                      availableStatuses={['Accepted', 'Denied', 'Change Terms Requested', 'Pending Banker Decision']}
                    />
                  )}
                </div>

                {/* Sort */}
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Last Updated: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Application ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Borrower Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Loan Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Requested Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Underwriter Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Final Decision
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayApplications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {application.applicationId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {application.borrowerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {application.loanType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {application.requestedAmount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getUnderwriterStatusColor(application.underwriterStatus)}`}>
                          {application.underwriterStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {application.finalDecision ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getFinalDecisionColor(application.finalDecision)}`}>
                            {application.finalDecision}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {application.lastUpdated}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          aria-haspopup="dialog"
                          aria-label={`Evaluate ${application.applicationId}`}
                          onClick={() => handleEvaluate(application)}
                          className="text-sm font-medium text-[#0066CC] hover:text-[#0052A3] hover:underline"
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayApplications.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-sm font-medium text-gray-900 mb-1">No applications match the current search or filter</div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedStatuses([]);
                          }}
                          className="text-sm text-[#0066CC] hover:underline font-medium"
                        >
                          Clear search and filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Decision Modal */}
      {selectedApplication && (
        <DecisionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedApplication(null);
          }}
          application={{
            applicationId: selectedApplication.applicationId,
            borrowerName: selectedApplication.borrowerName,
            loanType: selectedApplication.loanType,
            requestedAmount: selectedApplication.requestedAmount,
            underwriterStatus: selectedApplication.underwriterStatus,
          }}
          onSubmit={handleSubmitDecision}
        />
      )}
    </div>
  );
}