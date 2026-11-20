import { useState, useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronRight, Edit2, Check } from 'lucide-react';
import { Header } from './Header';
import { AcknowledgmentModal } from './AcknowledgmentModal';
import { usePersistentState, useConsoleStore } from '../state/ConsoleStore';
import { useDemoOptional } from '../../demo/DemoContext';

interface EvaluationProps {
  applicationId: string;
  customerName: string;
  opportunityDate: string;
  customerPowerId: string;
  loanPurpose: string;
  requestedAmount: string;
  onBack: () => void;
  onStartApplication?: (totalBorrowingPower: number) => void;
  /** Demo navigation: open with the Acknowledgment Required dialog showing (Before/After toggle). */
  initialAcknowledgment?: boolean;
  /** Accounts to evaluate (demo scenarios); defaults to the original sample set. */
  accounts?: AutoAccount[];
}

interface AutoAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  borrowingPower: number;
  selected: boolean;
}

interface AssetRow {
  id: string;
  description: string;
  collateralValue: number;
  /** What the banker typed (keeps partial input such as "1250." intact). */
  collateralInput?: string;
  lendableValue: number;
}

interface ManualAccount {
  id: string;
  name: string;
  accountNumber: string;
  highlyLiquid: AssetRow[];
  fixedIncome: AssetRow[];
  equities: AssetRow[];
  otherAssets: AssetRow[];
  selected: boolean;
}

type AssetCategory = keyof Pick<ManualAccount, 'highlyLiquid' | 'fixedIncome' | 'equities' | 'otherAssets'>;

const ASSET_TABS: { key: AssetCategory; label: string }[] = [
  { key: 'highlyLiquid', label: 'Highly Liquid' },
  { key: 'fixedIncome', label: 'Fixed Income' },
  { key: 'equities', label: 'Equities' },
  { key: 'otherAssets', label: 'Other Assets' },
];

const INITIAL_AUTO_ACCOUNTS: AutoAccount[] = [
  { id: '1', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx1', borrowingPower: 350000, selected: true },
  { id: '2', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx2', borrowingPower: 350000, selected: true },
  { id: '3', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx3', borrowingPower: 350000, selected: true },
  { id: '4', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx4', borrowingPower: 350000, selected: false },
  { id: '5', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx5', borrowingPower: 183000, selected: false },
  { id: '6', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx6', borrowingPower: 183000, selected: false },
  { id: '7', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx7', borrowingPower: 183000, selected: false },
  { id: '8', bankName: 'PNC', accountNumber: 'xxx-xxxxxxx8', borrowingPower: 183000, selected: false },
];

/** Advance rate applied to a collateral value to get its lendable value. */
export function lendableRate(category: AssetCategory, description: string): number {
  if (category === 'highlyLiquid') return description.includes('Cash') ? 1 : 0.8; // Cash at PNC 100%, others 80%
  if (category === 'fixedIncome') return 0.8;
  if (category === 'equities') return 0.7;
  return 0.6; // otherAssets
}

function createManualAccount(autoAcc: AutoAccount): ManualAccount {
  return {
    id: autoAcc.id,
    name: `${autoAcc.bankName} ${autoAcc.accountNumber}`,
    accountNumber: autoAcc.accountNumber,
    selected: true,
    highlyLiquid: [
      { id: 'hl1', description: 'Cash, Bank Certificates of Deposits at PNC', collateralValue: 0, lendableValue: 0 },
      { id: 'hl2', description: 'Money Market Funds and ETFs', collateralValue: 0, lendableValue: 0 },
      { id: 'hl3', description: 'U.S. Treasury Bills Maturing in Less than 7 years', collateralValue: 0, lendableValue: 0 },
    ],
    fixedIncome: [
      { id: 'fi1', description: 'U.S. Treasury Bills Maturing in 7+ years', collateralValue: 0, lendableValue: 0 },
      { id: 'fi2', description: 'Corporate Bonds', collateralValue: 0, lendableValue: 0 },
    ],
    equities: [
      { id: 'eq1', description: 'U.S. Listed Equities', collateralValue: 0, lendableValue: 0 },
      { id: 'eq2', description: 'International Listed Equities', collateralValue: 0, lendableValue: 0 },
    ],
    otherAssets: [
      { id: 'oa1', description: 'Mutual Funds', collateralValue: 0, lendableValue: 0 },
      { id: 'oa2', description: 'Other Assets', collateralValue: 0, lendableValue: 0 },
    ],
  };
}

const sumLendable = (acc: ManualAccount) =>
  ASSET_TABS.reduce((sum, tab) => sum + acc[tab.key].reduce((s, row) => s + row.lendableValue, 0), 0);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function Evaluation({
  applicationId,
  customerName,
  opportunityDate,
  customerPowerId,
  loanPurpose,
  requestedAmount,
  onBack,
  onStartApplication,
  accounts,
  initialAcknowledgment,
}: EvaluationProps) {
  const key = (name: string) => `evaluation:${applicationId}:${name}`;
  const [expanded, setExpanded] = usePersistentState(key('sections'), () => ({
    customer: true,
    auto: true,
    manual: true,
    total: true,
  }));
  const toggleSection = (section: keyof typeof expanded) =>
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));

  // Auto Evaluation accounts
  const [autoAccounts, setAutoAccounts] = usePersistentState<AutoAccount[]>(key('auto'), () => accounts ?? INITIAL_AUTO_ACCOUNTS);

  // Manual Evaluation accounts - dynamically created from selected auto accounts
  const [manualAccounts, setManualAccounts] = usePersistentState<ManualAccount[]>(key('manual'), () => []);

  // Manual Evaluation is derived from Auto Evaluation during render, so it
  // can never lag a selection change: only selected accounts appear, in Auto
  // order, each using its saved manual data when it exists.
  const manualView = useMemo(
    () => autoAccounts.filter(acc => acc.selected).map(a => manualAccounts.find(m => m.id === a.id) ?? createManualAccount(a)),
    [autoAccounts, manualAccounts],
  );

  // Persist the same list so edits always apply to stored data; data for
  // accounts that are deselected is discarded (as in the original behaviour).
  useEffect(() => {
    const same =
      manualView.length === manualAccounts.length && manualView.every((m, i) => m === manualAccounts[i]);
    if (!same) setManualAccounts(manualView);
  }, [manualView, manualAccounts, setManualAccounts]);

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = usePersistentState<Record<string, AssetCategory>>(key('tabs'), () => ({}));
  const [highlightedValues, setHighlightedValues] = useState<Set<string>>(new Set());
  const [showAcknowledgment, setShowAcknowledgment] = useState(!!initialAcknowledgment);
  const [announcement, setAnnouncement] = useState('');
  const pendingScrollId = useRef<string | null>(null);

  // Calculate totals
  const autoEvalTotal = autoAccounts
    .filter(acc => acc.selected)
    .reduce((sum, acc) => sum + acc.borrowingPower, 0);

  const manualEvalTotal = manualView
    .filter(acc => acc.selected)
    .reduce((sum, acc) => sum + sumLendable(acc), 0);

  const totalBorrowingPower = autoEvalTotal + manualEvalTotal;

  // Demo instrumentation + persistence of the total for re-entry.
  const demo = useDemoOptional();
  const { write } = useConsoleStore();
  useEffect(() => {
    write(key('total'), totalBorrowingPower);
  }, [totalBorrowingPower]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    demo?.reportStage('before', showAcknowledgment ? 'acknowledgment' : 'evaluation');
    demo?.reportLocation('before', { screen: showAcknowledgment ? 'acknowledgment' : 'evaluation', appId: applicationId });
  }, [showAcknowledgment]); // eslint-disable-line react-hooks/exhaustive-deps

  const allAutoSelected = autoAccounts.every(acc => acc.selected);
  const allManualSelected = manualView.length > 0 && manualView.every(acc => acc.selected);

  // Toggle all auto accounts
  const handleSelectAllAuto = () => {
    setAutoAccounts(prev => prev.map(acc => ({ ...acc, selected: !allAutoSelected })));
    setAnnouncement(allAutoSelected ? 'All accounts deselected' : `All ${autoAccounts.length} accounts selected`);
  };

  // Toggle single auto account
  const handleToggleAutoAccount = (id: string) => {
    setAutoAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, selected: !acc.selected } : acc)));
  };

  // Override: open Manual Evaluation at this account without clearing any
  // selection. An unselected account is carried over so it can be overridden.
  const handleOverride = (account: AutoAccount) => {
    if (!account.selected) {
      setAutoAccounts(prev => prev.map(acc => (acc.id === account.id ? { ...acc, selected: true } : acc)));
      setAnnouncement(`${account.bankName} ${account.accountNumber} selected and added to Manual Evaluation`);
    } else {
      setAnnouncement(`Manual Evaluation opened for ${account.bankName} ${account.accountNumber}`);
    }
    setExpanded(prev => ({ ...prev, manual: true }));
    pendingScrollId.current = account.id;
  };

  // Scroll after the manual card exists in the DOM.
  useEffect(() => {
    const id = pendingScrollId.current;
    if (!id) return;
    const card = document.getElementById(`manual-account-${id}`);
    if (!card) return;
    pendingScrollId.current = null;
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    card.querySelector<HTMLElement>('[data-account-heading]')?.focus({ preventScroll: true });
  });

  // Toggle all manual accounts
  const handleSelectAllManual = () => {
    setManualAccounts(() => manualView.map(acc => ({ ...acc, selected: !allManualSelected })));
  };

  // Toggle single manual account
  const handleToggleManualAccount = (id: string) => {
    setManualAccounts(() => manualView.map(acc => (acc.id === id ? { ...acc, selected: !acc.selected } : acc)));
  };

  // Update account name
  const handleUpdateAccountName = (id: string, name: string) => {
    setManualAccounts(() => manualView.map(acc => (acc.id === id ? { ...acc, name } : acc)));
  };

  const finishEditingName = (account: ManualAccount) => {
    if (!account.name.trim()) handleUpdateAccountName(account.id, `PNC ${account.accountNumber}`);
    setEditingAccountId(null);
    requestAnimationFrame(() => document.getElementById(`edit-name-${account.id}`)?.focus());
  };

  // Update collateral value and recalculate lendable value immediately
  const handleUpdateCollateral = (accountId: string, category: AssetCategory, rowId: string, rawInput: string) => {
    const cleaned = rawInput.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    const value = parseFloat(cleaned) || 0;

    setManualAccounts(() =>
      manualView.map(acc => {
        if (acc.id !== accountId) return acc;
        const updatedRows = acc[category].map(row =>
          row.id !== rowId
            ? row
            : {
                ...row,
                collateralInput: cleaned,
                collateralValue: value,
                lendableValue: value * lendableRate(category, row.description),
              },
        );
        return { ...acc, [category]: updatedRows };
      }),
    );

    // Highlight the updated lendable value
    const highlightKey = `${accountId}-${category}-${rowId}`;
    setHighlightedValues(new Set([highlightKey]));
    setTimeout(() => {
      setHighlightedValues(prev => {
        const next = new Set(prev);
        next.delete(highlightKey);
        return next;
      });
    }, 800);
  };

  const handleAssetTabKey = (e: KeyboardEvent<HTMLButtonElement>, accountId: string, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const last = ASSET_TABS.length - 1;
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'ArrowRight' ? (index === last ? 0 : index + 1) : index === 0 ? last : index - 1;
    setActiveTab(prev => ({ ...prev, [accountId]: ASSET_TABS[next].key }));
    requestAnimationFrame(() => document.getElementById(`asset-tab-${accountId}-${ASSET_TABS[next].key}`)?.focus());
  };

  const handleGeneratePdf = () => {
    setAnnouncement('Print dialog opened. Choose “Save as PDF” to download the evaluation.');
    // Let the announcement render before the blocking print dialog opens.
    setTimeout(() => window.print(), 50);
  };

  const handleBeginApplication = () => {
    setShowAcknowledgment(false);
    if (onStartApplication) {
      onStartApplication(totalBorrowingPower);
    }
  };

  const sectionHeader = (
    section: keyof typeof expanded,
    title: string,
    total?: number,
  ) => (
    <h2>
      <button
        type="button"
        id={`eval-${section}-header`}
        aria-expanded={expanded[section]}
        aria-controls={`eval-${section}-panel`}
        onClick={() => toggleSection(section)}
        className="w-full px-6 py-4 flex items-center justify-between rounded-lg text-left hover:bg-gray-50"
      >
        <span className="flex items-center gap-3">
          {expanded[section] ? (
            <ChevronDown className="w-5 h-5 text-gray-600" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
          )}
          <span className="font-semibold text-gray-900">{title}</span>
        </span>
        {total !== undefined && (
          <span className="text-right">
            <span className="block text-xs text-gray-500">Maximum Borrowing Power</span>
            <span className="block text-sm font-semibold text-gray-900 tabular-nums" data-testid={`total-${section}`}>
              {formatCurrency(total)}
            </span>
          </span>
        )}
      </button>
    </h2>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header pageTitle="Evaluation" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1584px] mx-auto w-full px-8 py-6">
          <div className="space-y-4">
            {/* Customer Details Section */}
            <section className="bg-white rounded-lg border border-gray-200" aria-labelledby="eval-customer-header">
              {sectionHeader('customer', 'Customer Details')}

              {expanded.customer && (
                <div id="eval-customer-panel" className="px-6 pb-6">
                  <dl className="grid grid-cols-5 gap-8">
                    {[
                      ['Customer Name', customerName],
                      ['Opportunity Date', opportunityDate],
                      ['Customer Power ID', customerPowerId],
                      ['Loan Purpose', loanPurpose],
                      ['Requested Loan Amount', requestedAmount],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-medium text-gray-500 mb-1">{label}</dt>
                        <dd className="text-sm text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>

            {/* Auto Evaluation Section */}
            <section className="bg-white rounded-lg border border-gray-200" aria-labelledby="eval-auto-header">
              {sectionHeader('auto', 'Auto Evaluation', autoEvalTotal)}

              {expanded.auto && (
                <div id="eval-auto-panel" className="px-6 pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      type="button"
                      onClick={handleSelectAllAuto}
                      className="text-sm text-[#0066CC] hover:underline font-medium"
                    >
                      {allAutoSelected ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-xs text-gray-500" aria-live="polite">
                      {autoAccounts.filter(a => a.selected).length} of {autoAccounts.length} accounts selected
                    </span>
                  </div>

                  <ul className="grid grid-cols-4 gap-4">
                    {autoAccounts.map(account => (
                      <li
                        key={account.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          account.selected ? 'border-[#0066CC] bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <label className="flex items-start gap-3 mb-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={account.selected}
                            onChange={() => handleToggleAutoAccount(account.id)}
                            className="mt-0.5 w-4 h-4 accent-[#0066CC] rounded border-gray-300"
                          />
                          <span className="flex-1">
                            <span className="block text-sm font-medium text-gray-900">{account.bankName}</span>
                            <span className="block text-xs text-gray-500">{account.accountNumber}</span>
                          </span>
                          {/* Text indicator so selection is not conveyed by colour alone */}
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider ${
                              account.selected ? 'text-[#0066CC]' : 'text-gray-500'
                            }`}
                          >
                            {account.selected ? 'Selected' : 'Not selected'}
                          </span>
                        </label>
                        <div className="mb-2">
                          <div className="text-xs text-gray-500">Maximum Borrowing Power</div>
                          <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(account.borrowingPower)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOverride(account)}
                          aria-label={`Override ${account.bankName} ${account.accountNumber} in Manual Evaluation`}
                          className="text-xs text-[#0066CC] hover:underline font-medium"
                        >
                          Override
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Manual Evaluation Section */}
            <section
              className="bg-white rounded-lg border border-gray-200 scroll-mt-6"
              data-manual-eval
              aria-labelledby="eval-manual-header"
            >
              {sectionHeader('manual', 'Manual Evaluation', manualEvalTotal)}

              {expanded.manual && (
                <div id="eval-manual-panel" className="px-6 pb-6">
                  {/* Helper text indicating accounts from Auto Evaluation */}
                  {manualView.length > 0 && (
                    <p className="mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-xs text-gray-600" data-testid="manual-banner">
                      Showing {manualView.length} account{manualView.length !== 1 ? 's' : ''} selected from Auto Evaluation
                    </p>
                  )}

                  {manualView.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSelectAllManual}
                        className="text-sm text-[#0066CC] hover:underline font-medium mb-4"
                      >
                        {allManualSelected ? 'Deselect All Accounts' : 'Select All Accounts'}
                      </button>

                      <ul className="space-y-4">
                        {manualView.map(account => {
                          const currentTab = activeTab[account.id] || 'highlyLiquid';
                          const accountTotal = sumLendable(account);
                          const isEditing = editingAccountId === account.id;

                          return (
                            <li
                              key={account.id}
                              id={`manual-account-${account.id}`}
                              data-testid="manual-account"
                              className={`border rounded-lg scroll-mt-6 ${
                                account.selected ? 'border-[#0066CC]' : 'border-gray-200'
                              }`}
                            >
                              <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    id={`manual-include-${account.id}`}
                                    checked={account.selected}
                                    onChange={() => handleToggleManualAccount(account.id)}
                                    aria-label={`Include ${account.name} in Manual Evaluation total`}
                                    className="w-4 h-4 accent-[#0066CC] rounded border-gray-300"
                                  />
                                  {isEditing ? (
                                    <>
                                      <label htmlFor={`name-input-${account.id}`} className="sr-only">
                                        Account name
                                      </label>
                                      <input
                                        id={`name-input-${account.id}`}
                                        type="text"
                                        value={account.name}
                                        onChange={(e) => handleUpdateAccountName(account.id, e.target.value)}
                                        onBlur={() => finishEditingName(account)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === 'Escape') {
                                            e.preventDefault();
                                            finishEditingName(account);
                                          }
                                        }}
                                        className="min-w-[280px] border-b border-[#0066CC] px-1 py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus-visible:border-b-2"
                                        autoFocus
                                      />
                                      <span className="text-xs text-gray-500">Press Enter to save</span>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <h3
                                        className="text-sm font-medium text-gray-900 break-words"
                                        tabIndex={-1}
                                        data-account-heading
                                      >
                                        {account.name}
                                      </h3>
                                      <button
                                        type="button"
                                        id={`edit-name-${account.id}`}
                                        onClick={() => setEditingAccountId(account.id)}
                                        aria-label={`Edit account name ${account.name}`}
                                        className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                      >
                                        <Edit2 className="w-3 h-3" aria-hidden="true" />
                                      </button>
                                    </div>
                                  )}
                                  <span
                                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-px rounded border ${
                                      account.selected
                                        ? 'text-[#0066CC] border-blue-200 bg-blue-50'
                                        : 'text-gray-500 border-gray-200'
                                    }`}
                                  >
                                    {account.selected ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Check className="w-3 h-3" aria-hidden="true" /> Included
                                      </span>
                                    ) : (
                                      'Excluded from total'
                                    )}
                                  </span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs text-gray-500">Maximum Borrowing Power</div>
                                  <div className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(accountTotal)}</div>
                                </div>
                              </div>

                              {/* Tabs */}
                              <div className="border-b border-gray-200">
                                <div className="flex gap-6 px-4" role="tablist" aria-label={`Asset classes for ${account.name}`}>
                                  {ASSET_TABS.map((tab, index) => (
                                    <button
                                      key={tab.key}
                                      type="button"
                                      role="tab"
                                      id={`asset-tab-${account.id}-${tab.key}`}
                                      aria-selected={currentTab === tab.key}
                                      aria-controls={`asset-panel-${account.id}`}
                                      tabIndex={currentTab === tab.key ? 0 : -1}
                                      onClick={() => setActiveTab(prev => ({ ...prev, [account.id]: tab.key }))}
                                      onKeyDown={(e) => handleAssetTabKey(e, account.id, index)}
                                      className={`py-3 px-2 -mb-px border-b-2 text-xs font-medium transition-colors ${
                                        currentTab === tab.key
                                          ? 'border-[#0066CC] text-[#0066CC]'
                                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                      }`}
                                    >
                                      {tab.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Asset Table */}
                              <div
                                className="p-4"
                                role="tabpanel"
                                id={`asset-panel-${account.id}`}
                                aria-labelledby={`asset-tab-${account.id}-${currentTab}`}
                              >
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th scope="col" className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide pb-3 pr-4">Data</th>
                                      <th scope="col" className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide pb-3 px-4 w-64">Collateral Value</th>
                                      <th scope="col" className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide pb-3 pl-4 w-64">Lendable Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {account[currentTab].map(row => {
                                      const highlightKey = `${account.id}-${currentTab}-${row.id}`;
                                      const isHighlighted = highlightedValues.has(highlightKey);
                                      const rate = lendableRate(currentTab, row.description);
                                      const inputId = `collateral-${account.id}-${row.id}`;

                                      return (
                                        <tr key={row.id} className="border-b border-gray-100">
                                          <td className="py-4 pr-4 text-sm text-gray-900 align-middle">
                                            <label htmlFor={inputId}>{row.description}</label>
                                            <span className="block text-xs text-gray-500">{Math.round(rate * 100)}% advance rate</span>
                                          </td>
                                          <td className="py-4 px-4 align-middle">
                                            <div className="relative">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" aria-hidden="true">$</span>
                                              <input
                                                id={inputId}
                                                type="text"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                value={row.collateralInput ?? (row.collateralValue > 0 ? row.collateralValue.toString() : '')}
                                                onChange={(e) =>
                                                  handleUpdateCollateral(account.id, currentTab, row.id, e.target.value)
                                                }
                                                className="w-full border border-gray-300 rounded pl-7 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] transition-shadow"
                                                placeholder="0"
                                              />
                                            </div>
                                          </td>
                                          <td className="py-4 pl-4 align-middle">
                                            <output
                                              htmlFor={inputId}
                                              data-testid={`lendable-${account.id}-${row.id}`}
                                              className={`text-sm font-medium tabular-nums transition-colors duration-300 ${
                                                isHighlighted ? 'text-[#0066CC]' : 'text-gray-900'
                                              }`}
                                            >
                                              {formatCurrency(row.lendableValue)}
                                            </output>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  ) : (
                    <div className="py-12 text-center" data-testid="manual-empty">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        No accounts available for manual evaluation
                      </p>
                      <p className="text-xs text-gray-500">
                        Select accounts in Auto Evaluation above to enable manual override and detailed asset evaluation
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Total Evaluation Section */}
            <section className="bg-white rounded-lg border border-gray-200" aria-labelledby="eval-total-header">
              {sectionHeader('total', 'Total Evaluation', totalBorrowingPower)}

              {expanded.total && (
                <div id="eval-total-panel" className="px-6 pb-6">
                  <dl className="grid grid-cols-3 gap-8">
                    {[
                      ['Auto Evaluation', autoEvalTotal],
                      ['Manual Evaluation', manualEvalTotal],
                      ['Total Evaluations', totalBorrowingPower],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-xs font-medium text-gray-500 mb-2">
                          {label}
                          <span className="block font-normal mt-2">Maximum Borrowing Power</span>
                        </dt>
                        <dd className="text-2xl font-semibold text-[#0066CC] tabular-nums">{formatCurrency(value as number)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer — fixed to the bottom of the frame */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg print:hidden">
        <div className="max-w-[1584px] mx-auto px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
          >
            BACK
          </button>
          <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGeneratePdf}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Generate PDF
            </button>
            <button
              type="button"
              onClick={() => setShowAcknowledgment(true)}
              aria-haspopup="dialog"
              className="px-6 py-2 text-sm font-medium text-white bg-[#0066CC] rounded hover:bg-[#0052A3]"
            >
              Start Request
            </button>
          </div>
        </div>
      </footer>

      {/* Acknowledgment Modal */}
      <AcknowledgmentModal
        storageKey={key('acknowledgment')}
        isOpen={showAcknowledgment}
        onClose={() => setShowAcknowledgment(false)}
        onConfirm={handleBeginApplication}
      />
    </div>
  );
}
