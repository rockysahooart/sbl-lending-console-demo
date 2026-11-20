import { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, Search, Filter, ArrowUpDown } from 'lucide-react';
import { Header } from './Header';
import { Evaluation } from './Evaluation';
import { LoanApplication } from './LoanApplication';
import { LoanOverview } from './LoanOverview';
import { FilterPopup } from './FilterPopup';
import React, { useEffect } from 'react';
import { BASELINE_PENDING, BASELINE_SUBMITTED, baselineAutoAccounts, baselineCollaterals, baselinePerson } from '../../demo/beforeData';
import { useDemoOptional, type Stage } from '../../demo/DemoContext';
import { useConsoleStore } from '../state/ConsoleStore';

interface LoanApplication {
  id: string;
  applicationId: string;
  businessName: string;
  primaryApplicant: string;
  loanType: string;
  status: 'Pending Review' | 'Under Evaluation' | 'Approved' | 'Rejected' | 'On Hold' | 'Submitted to Underwriting' | 'Underwriting In Progress' | 'Pending Additional Information' | 'Underwriting Review Complete';
  lastUpdated: string;
  expandedDetails: {
    opportunityDate: string;
    product: string;
    customerPowerId: string;
    loanPurpose: string;
    loanAmount: string;
    evaluationHistory?: Array<{
      date: string;
      action: string;
      evaluator: string;
      status: string;
      notes: string;
    }>;
  };
}

// Fictional data shared with the demo (src/demo). No real customers.
const mockData: LoanApplication[] = BASELINE_PENDING as LoanApplication[];
const submittedApplicationsData: LoanApplication[] = BASELINE_SUBMITTED as LoanApplication[];

const tabs = ['Pending Evaluations', 'Evaluations', 'Submitted Applications'];

interface LoanTableProps {
  onMenuClick?: () => void;
  /** Demo: open directly at a request's evaluation or application. */
  initialView?: {
    applicationId?: string;
    view: 'dashboard' | 'evaluation' | 'application' | 'submitted' | 'overview';
    /** Demo navigation (Before/After toggle): queue tab, expanded row, acknowledgment dialog. */
    tab?: 'pending' | 'evaluations' | 'submitted';
    expanded?: string;
    acknowledgment?: boolean;
  };
}

export function LoanTable({ onMenuClick, initialView }: LoanTableProps = {}) {
  const { read } = useConsoleStore();
  const startLoan = initialView ? mockData.find(l => l.applicationId === initialView.applicationId) ?? null : null;
  const startTab = initialView?.view === 'submitted' || initialView?.view === 'overview' || initialView?.tab === 'submitted' ? 2 : initialView?.tab === 'evaluations' ? 1 : 0;
  const [selectedTab, setSelectedTab] = useState(startTab);
  const [expandedRow, setExpandedRow] = useState<string | null>(
    initialView?.expanded ? [...mockData, ...submittedApplicationsData].find(l => l.applicationId === initialView.expanded)?.id ?? null : null,
  );
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [visibleHistory, setVisibleHistory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [evaluatingLoan, setEvaluatingLoan] = useState<LoanApplication | null>(
    startLoan && (initialView?.view === 'evaluation' || initialView?.view === 'application') ? startLoan : null,
  );
  const [viewingLoan, setViewingLoan] = useState<LoanApplication | null>(
    initialView?.view === 'overview' ? submittedApplicationsData.find(l => l.applicationId === initialView.applicationId) ?? null : null,
  );
  const [applicationLoan, setApplicationLoan] = useState<{
    loan: LoanApplication;
    totalBorrowingPower: number;
  } | null>(
    startLoan && initialView?.view === 'application'
      ? { loan: startLoan, totalBorrowingPower: read<number>(`evaluation:${startLoan.applicationId}:total`) ?? (baselineAutoAccounts(startLoan.applicationId) ?? []).reduce((t, a) => t + a.borrowingPower, 0) }
      : null,
  );

  // Demo instrumentation: the list view reports itself as the dashboard stage.
  const demo = useDemoOptional();
  const onList = !applicationLoan && !evaluatingLoan;
  useEffect(() => {
    if (onList) demo?.reportStage('before', 'dashboard' as Stage);
  }, [onList]); // eslint-disable-line react-hooks/exhaustive-deps
  // Demo navigation: report tab, expanded row and overview so the Before/After toggle can follow them.
  useEffect(() => {
    if (!onList) return;
    const tabKey = (['pending', 'evaluations', 'submitted'] as const)[selectedTab];
    const expandedApp = expandedRow ? [...mockData, ...submittedApplicationsData].find(l => l.id === expandedRow)?.applicationId : undefined;
    demo?.reportLocation('before', viewingLoan ? { screen: 'overview', appId: viewingLoan.applicationId, tab: tabKey } : { screen: 'console', tab: tabKey, expanded: expandedApp });
  }, [onList, selectedTab, expandedRow, viewingLoan]); // eslint-disable-line react-hooks/exhaustive-deps
  // Opening a scenario request makes it the demo's current scenario.
  const openScenario = (evaluatingLoan as (LoanApplication & { scenarioId?: string }) | null)?.scenarioId;
  useEffect(() => {
    if (openScenario && demo && demo.scenario !== openScenario) demo.adoptScenario(openScenario as never);
  }, [openScenario]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search, Filter, Sort State
  const [searchCriteria, setSearchCriteria] = useState<'applicationId' | 'businessName' | 'primaryApplicant'>('applicationId');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Use different data based on selected tab
  const rawData = selectedTab === 2 ? submittedApplicationsData : mockData;

  // Apply search filter
  let filteredData = rawData.filter((loan) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    switch (searchCriteria) {
      case 'applicationId':
        return loan.applicationId.toLowerCase().includes(query);
      case 'businessName':
        return loan.businessName.toLowerCase().includes(query);
      case 'primaryApplicant':
        return loan.primaryApplicant.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  // Apply status filter
  if (selectedStatuses.length > 0) {
    filteredData = filteredData.filter((loan) =>
      selectedStatuses.includes(loan.status)
    );
  }

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.lastUpdated);
    const dateB = new Date(b.lastUpdated);
    return sortOrder === 'newest' 
      ? dateB.getTime() - dateA.getTime() 
      : dateA.getTime() - dateB.getTime();
  });

  const activeData = sortedData;

  const itemsPerPage = 8;
  const totalPages = Math.ceil(activeData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = activeData.slice(startIndex, endIndex);

  const handleRowClick = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Under Evaluation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'On Hold':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Submitted to Underwriting':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Underwriting In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending Additional Information':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Underwriting Review Complete':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const searchLabel = searchCriteria === 'applicationId' ? 'Application ID' : searchCriteria === 'businessName' ? 'Business Name' : 'Primary Applicant';

  return (
    <div className="h-full flex flex-col">
      {viewingLoan && (
        <LoanOverview
          applicationId={viewingLoan.applicationId}
          businessName={viewingLoan.businessName}
          primaryApplicant={viewingLoan.primaryApplicant}
          loanType={viewingLoan.loanType}
          loanAmount={viewingLoan.expandedDetails.loanAmount}
          onClose={() => setViewingLoan(null)}
        />
      )}
      {applicationLoan ? (
        <LoanApplication
          applicationId={applicationLoan.loan.applicationId}
          customerName={applicationLoan.loan.primaryApplicant}
          opportunityDate={applicationLoan.loan.expandedDetails.opportunityDate}
          customerPowerId={applicationLoan.loan.expandedDetails.customerPowerId}
          loanPurpose={applicationLoan.loan.expandedDetails.loanPurpose}
          requestedAmount={applicationLoan.loan.expandedDetails.loanAmount}
          totalBorrowingPower={applicationLoan.totalBorrowingPower}
          primary={baselinePerson(applicationLoan.loan.applicationId, applicationLoan.loan.expandedDetails.customerPowerId)}
          collaterals={baselineCollaterals(applicationLoan.loan.applicationId)}
          onBack={() => setApplicationLoan(null)}
          onReturnToConsole={() => {
            setApplicationLoan(null);
            setEvaluatingLoan(null);
          }}
        />
      ) : evaluatingLoan ? (
        <Evaluation
          applicationId={evaluatingLoan.applicationId}
          customerName={evaluatingLoan.primaryApplicant}
          opportunityDate={evaluatingLoan.expandedDetails.opportunityDate}
          customerPowerId={evaluatingLoan.expandedDetails.customerPowerId}
          loanPurpose={evaluatingLoan.expandedDetails.loanPurpose}
          requestedAmount={evaluatingLoan.expandedDetails.loanAmount}
          accounts={baselineAutoAccounts(evaluatingLoan.applicationId)}
          initialAcknowledgment={initialView?.acknowledgment && initialView.applicationId === evaluatingLoan.applicationId}
          onBack={() => setEvaluatingLoan(null)}
          onStartApplication={(totalBorrowingPower) => {
            // Keep the evaluation context so Back from step 1 returns to it.
            setApplicationLoan({ loan: evaluatingLoan, totalBorrowingPower });
          }}
        />
      ) : (
      <>
        <Header pageTitle="Securities Lending Console" onNavigationClick={onMenuClick} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1584px] mx-auto px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6 px-6" role="tablist" aria-label="Application queues">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    id={`queue-tab-${index}`}
                    aria-selected={selectedTab === index}
                    aria-controls="queue-panel"
                    tabIndex={selectedTab === index ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                      e.preventDefault();
                      const next = (index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
                      setSelectedTab(next);
                      setCurrentPage(1);
                      setExpandedRow(null);
                      setVisibleHistory(null);
                      setSelectedStatuses([]);
                      requestAnimationFrame(() => document.getElementById(`queue-tab-${next}`)?.focus());
                    }}
                    onClick={() => {
                      setSelectedTab(index);
                      setCurrentPage(1);
                      setExpandedRow(null);
                      setVisibleHistory(null);
                      // Each queue has its own status set; a filter from another
                      // queue would silently hide every row.
                      setSelectedStatuses([]);
                    }}
                    className={`py-4 px-2 border-b-2 transition-colors text-sm font-medium ${
                      selectedTab === index
                        ? 'border-[#0066CC] text-[#0066CC]'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div id="queue-panel" role="tabpanel" aria-labelledby={`queue-tab-${selectedTab}`}>
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
                        name="dashboard-search-criteria"
                        checked={searchCriteria === 'applicationId'}
                        onChange={() => setSearchCriteria('applicationId')}
                        className="w-4 h-4 text-[#0066CC] border-gray-300 focus:ring-[#0066CC]"
                      />
                      <span className="text-sm font-medium text-gray-700">Application ID</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dashboard-search-criteria"
                        checked={searchCriteria === 'businessName'}
                        onChange={() => setSearchCriteria('businessName')}
                        className="w-4 h-4 text-[#0066CC] border-gray-300 focus:ring-[#0066CC]"
                      />
                      <span className="text-sm font-medium text-gray-700">Business Name</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="dashboard-search-criteria"
                        checked={searchCriteria === 'primaryApplicant'}
                        onChange={() => setSearchCriteria('primaryApplicant')}
                        className="w-4 h-4 text-[#0066CC] border-gray-300 focus:ring-[#0066CC]"
                      />
                      <span className="text-sm font-medium text-gray-700">Primary Applicant</span>
                    </label>
                  </fieldset>
                  
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <input
                      type="search"
                      aria-label={`Search by ${searchLabel}`}
                      placeholder={`Search by ${searchLabel}...`}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
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
                        <span className="sr-only"> statuses selected</span>
                      </span>
                    )}
                  </button>

                  {isFilterOpen && (
                    <FilterPopup
                      selectedStatuses={selectedStatuses}
                      onStatusChange={(statuses) => {
                        setSelectedStatuses(statuses);
                        setCurrentPage(1);
                      }}
                      onClose={() => setIsFilterOpen(false)}
                      availableStatuses={
                        selectedTab === 2
                          ? ['Submitted to Underwriting', 'Underwriting In Progress', 'Pending Additional Information', 'Underwriting Review Complete']
                          : ['Pending Review', 'Under Evaluation', 'Approved', 'On Hold', 'Rejected']
                      }
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
                    <th className="w-12 px-6 py-3"><span className="sr-only">Details</span></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Application ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Primary Applicant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Loan Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((loan) => [
                    <tr
                      key={loan.id}
                      onClick={() => handleRowClick(loan.id)}
                      onMouseEnter={() => setHoveredRow(loan.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        expandedRow === loan.id
                          ? 'bg-blue-50'
                          : hoveredRow === loan.id
                          ? 'bg-gray-50'
                          : 'bg-white'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            aria-expanded={expandedRow === loan.id}
                            aria-controls={`loan-details-${loan.id}`}
                            aria-label={`${expandedRow === loan.id ? 'Hide' : 'Show'} details for ${loan.applicationId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(loan.id);
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            {expandedRow === loan.id ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {loan.applicationId}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {loan.businessName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {loan.primaryApplicant}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {loan.loanType}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {loan.lastUpdated}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          aria-label={`${selectedTab === 2 ? 'View' : 'Evaluate'} ${loan.applicationId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedTab === 2) {
                              setViewingLoan(loan);
                            } else {
                              setEvaluatingLoan(loan);
                            }
                          }}
                          className="text-sm font-medium text-[#0066CC] hover:text-[#0052A3] hover:underline"
                        >
                          {selectedTab === 2 ? 'View' : 'Evaluate'}
                        </button>
                      </td>
                    </tr>,
                    
                    /* Expanded Row Details */
                    expandedRow === loan.id && (
                      <tr key={`${loan.id}-expanded`} id={`loan-details-${loan.id}`} className="bg-gray-50">
                        <td colSpan={8} className="px-6 py-6">
                          <div className="bg-white rounded-md border border-gray-200 p-6">
                            {/* Main Details Grid */}
                            <div className="grid grid-cols-6 gap-6 mb-6">
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Primary Applicant
                                </div>
                                <div className="text-sm text-gray-900">
                                  {loan.primaryApplicant}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Opportunity Date
                                </div>
                                <div className="text-sm text-gray-900">
                                  {loan.expandedDetails.opportunityDate}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Product
                                </div>
                                <div className="text-sm text-gray-900">
                                  {loan.expandedDetails.product}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Customer Power ID
                                </div>
                                <div className="text-sm text-gray-900">
                                  {loan.expandedDetails.customerPowerId}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Loan Purpose
                                </div>
                                <div className="text-sm text-gray-900">
                                  {loan.expandedDetails.loanPurpose}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                  Loan Amount
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {loan.expandedDetails.loanAmount}
                                </div>
                              </div>
                            </div>

                            {/* View History Link */}
                            {loan.expandedDetails.evaluationHistory && (
                              <div className="mb-4">
                                <button 
                                  type="button"
                                  aria-expanded={visibleHistory === loan.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVisibleHistory(visibleHistory === loan.id ? null : loan.id);
                                  }}
                                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="underline">{visibleHistory === loan.id ? 'HIDE HISTORY' : 'VIEW HISTORY'}</span>
                                </button>
                              </div>
                            )}

                            {/* Evaluation History Table (conditionally visible) */}
                            {loan.expandedDetails.evaluationHistory && visibleHistory === loan.id && (
                              <div className="border-t border-gray-200 pt-6">
                                <div className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
                                  Evaluation History
                                </div>
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                        Date
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                        Action
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                        Evaluator
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                        Status
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                                        Notes
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {loan.expandedDetails.evaluationHistory.map((history, index) => (
                                      <tr key={index} className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {history.date}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {history.action}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {history.evaluator}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {history.status}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                          {history.notes}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  ])}
                  {currentData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-sm font-medium text-gray-900 mb-1">No applications match the current search or filter</div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedStatuses([]);
                            setCurrentPage(1);
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

            {/* Pagination */}
            <nav aria-label="Pagination" className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600" aria-live="polite">
                {activeData.length === 0
                  ? 'Showing 0 applications'
                  : `Showing ${startIndex + 1} to ${Math.min(endIndex, activeData.length)} of ${activeData.length} applications`}
              </div>
              <div className="flex items-center gap-2">
                {/* Previous / Next appear only when they can act — never as disabled controls */}
                {currentPage > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-3 py-2 text-sm font-medium rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentPage(pageNumber)}
                          aria-current={currentPage === pageNumber ? 'page' : undefined}
                          aria-label={`Page ${pageNumber}`}
                          className={`px-3 py-2 text-sm font-medium rounded ${
                            currentPage === pageNumber
                              ? 'bg-[#0066CC] text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={`ellipsis-${pageNumber}`} className="px-2 text-gray-500" aria-hidden="true">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                {currentPage < totalPages && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-3 py-2 text-sm font-medium rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </nav>
            </div>
          </div>
        </div>
        </div>
      </>
      )}
    </div>
  );
}