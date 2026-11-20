import { useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ApplicationStepLayout } from './ApplicationStepLayout';
import type { StepProps } from './LoanApplication';

interface CollateralDetail {
  id: string;
  collateralType: string;
  collateralSubType: string;
  percentOfOwnership: string;
  relationshipType: string;
  heldBy: string;
  accountOwner: string;
}

interface Collateral {
  id: string;
  collateralName: string;
  collateralAccountNumber: string;
  estimatedCollateralValue: string;
  isExpanded: boolean;
  isSelected: boolean;
  pledgedForRegulation: 'yes' | 'no';
  details: CollateralDetail[];
  /** Time of the last Save, shown as confirmation. */
  savedAt?: string;
}

export const initialCollaterals: Collateral[] = [
  {
    id: 'col-1',
    collateralName: 'U.S. Treasury Bond Portfolio',
    collateralAccountNumber: 'ACC-789456123',
    estimatedCollateralValue: '$250,000',
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'no',
    details: [
      {
        id: 'detail-1-1',
        collateralType: 'Securities',
        collateralSubType: 'Government Bonds',
        percentOfOwnership: '100',
        relationshipType: 'Primary',
        heldBy: 'PNC Brokerage',
        accountOwner: 'Daniel Okafor',
      },
    ],
  },
  {
    id: 'col-2',
    collateralName: 'Apple Inc. Corporate Bond',
    collateralAccountNumber: 'ACC-456789012',
    estimatedCollateralValue: '$175,000',
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'no',
    details: [
      {
        id: 'detail-2-1',
        collateralType: 'Securities',
        collateralSubType: 'Corporate Bonds',
        percentOfOwnership: '100',
        relationshipType: 'Primary',
        heldBy: 'Fidelity Investments',
        accountOwner: 'Daniel Okafor',
      },
    ],
  },
  {
    id: 'col-3',
    collateralName: 'Microsoft Corporation Stock',
    collateralAccountNumber: 'ACC-234567890',
    estimatedCollateralValue: '$630,750',
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'yes',
    details: [
      {
        id: 'detail-3-1',
        collateralType: 'Equities',
        collateralSubType: 'Common Stock',
        percentOfOwnership: '100',
        relationshipType: 'Primary',
        heldBy: 'Charles Schwab',
        accountOwner: 'Daniel Okafor',
      },
    ],
  },
  {
    id: 'col-4',
    collateralName: 'Vanguard Total Stock Market ETF',
    collateralAccountNumber: 'ACC-567890123',
    estimatedCollateralValue: '$491,500',
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'no',
    details: [
      {
        id: 'detail-4-1',
        collateralType: 'Equities',
        collateralSubType: 'Exchange-Traded Fund',
        percentOfOwnership: '100',
        relationshipType: 'Primary',
        heldBy: 'Vanguard',
        accountOwner: 'Daniel Okafor',
      },
    ],
  },
  {
    id: 'col-5',
    collateralName: 'Commercial Office Building',
    collateralAccountNumber: 'ACC-890123456',
    estimatedCollateralValue: '$1,250,000',
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'yes',
    details: [
      {
        id: 'detail-5-1',
        collateralType: 'Real Estate',
        collateralSubType: 'Commercial Property',
        percentOfOwnership: '100',
        relationshipType: 'Primary',
        heldBy: 'Borrower',
        accountOwner: 'Acme Manufacturing LLC',
      },
    ],
  },
  {
    id: 'col-6',
    collateralName: 'CNC Manufacturing Equipment',
    collateralAccountNumber: 'ACC-123456789',
    estimatedCollateralValue: '$385,000',
    isExpanded: false,
    isSelected: false,
    pledgedForRegulation: 'no',
    details: [
      {
        id: 'detail-6-1',
        collateralType: 'Equipment',
        collateralSubType: 'Manufacturing Equipment',
        percentOfOwnership: '100',
        relationshipType: 'Primary',
        heldBy: 'Business Entity',
        accountOwner: 'Acme Manufacturing LLC',
      },
    ],
  },
];

const SELECT_FIELDS: { field: keyof CollateralDetail; label: string; options: string[] }[] = [
  { field: 'collateralType', label: 'Collateral Type', options: ["Securities", "Equities", "Real Estate", "Equipment", "Inventory", "Cash", "Other"] },
  { field: 'collateralSubType', label: 'Collateral Sub Type', options: ["Government Bonds", "Corporate Bonds", "Common Stock", "Preferred Stock", "Exchange-Traded Fund", "Mutual Fund", "Commercial Property", "Residential Property", "Manufacturing Equipment", "Office Equipment", "Vehicles"] },
];
const RELATIONSHIP_OPTIONS = ["Primary", "Secondary", "Joint", "Guarantor"];
const HELD_BY_OPTIONS = ["PNC Brokerage", "Fidelity Investments", "Charles Schwab", "Vanguard", "Borrower", "Business Entity", "Third Party"];

const fieldClass =
  'w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC]';

export function Collaterals({ data, currentTab, completedSteps, onNext, onBack, onTabChange, onDataUpdate }: StepProps) {
  // Collaterals live in application state so edits survive tab changes.
  const collaterals: Collateral[] = (data.collaterals as Collateral[] | undefined) ?? initialCollaterals;
  const setCollaterals = (next: Collateral[]) => onDataUpdate({ collaterals: next });
  const [deletedNote, setDeletedNote] = useState('');

  const selectAll = collaterals.length > 0 && collaterals.every(c => c.isSelected);
  const selectedCount = collaterals.filter(c => c.isSelected).length;

  // Content edits (details, pledge) clear the "Saved" confirmation until the
  // banker saves again; expand/select changes leave it as is.
  const patch = (id: string, change: Partial<Collateral>) => {
    const isContentEdit = 'details' in change || 'pledgedForRegulation' in change;
    setCollaterals(
      collaterals.map(c => (c.id === id ? { ...c, ...change, ...(isContentEdit ? { savedAt: '' } : {}) } : c)),
    );
  };

  const handleSelectAll = () => setCollaterals(collaterals.map(c => ({ ...c, isSelected: !selectAll })));

  const handleUpdateDetail = (collateralId: string, detailId: string, field: keyof CollateralDetail, value: string) => {
    const collateral = collaterals.find(c => c.id === collateralId)!;
    patch(collateralId, { details: collateral.details.map(d => (d.id === detailId ? { ...d, [field]: value } : d)) });
  };

  const handleAddDetail = (collateralId: string) => {
    const collateral = collaterals.find(c => c.id === collateralId)!;
    const newDetail: CollateralDetail = {
      id: `detail-${collateralId}-${Date.now()}`,
      collateralType: '',
      collateralSubType: '',
      percentOfOwnership: '',
      relationshipType: '',
      heldBy: '',
      accountOwner: '',
    };
    patch(collateralId, { details: [...collateral.details, newDetail] });
    requestAnimationFrame(() => document.getElementById(`${newDetail.id}-collateralType`)?.focus());
  };

  const handleDeleteDetail = (collateralId: string, detailId: string) => {
    const collateral = collaterals.find(c => c.id === collateralId)!;
    if (collateral.details.length <= 1) return;
    patch(collateralId, { details: collateral.details.filter(d => d.id !== detailId) });
    setDeletedNote(`Detail row removed from ${collateral.collateralName}`);
  };

  const handleSave = (id: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    patch(id, { savedAt: time });
  };

  return (
    <ApplicationStepLayout
      title="4. Loan Request - Collaterals"
      currentStep={currentTab}
      completedSteps={completedSteps}
      onTabChange={onTabChange}
      onBack={onBack}
      onPrimary={() => onNext()}
      primaryLabel="Submit"
      footerNote={`${selectedCount} of ${collaterals.length} collaterals selected`}
    >
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-[#0066CC] hover:underline font-medium uppercase tracking-wide"
        >
          {selectAll ? 'Deselect All' : 'Select All'}
        </button>
        <p className="sr-only" role="status" aria-live="polite">{deletedNote}</p>
      </div>

      {/* Collateral List */}
      <ul className="space-y-3">
        {collaterals.map((collateral) => {
          const panelId = `collateral-panel-${collateral.id}`;
          return (
            <li
              key={collateral.id}
              className={`border rounded-lg overflow-hidden bg-white ${collateral.isSelected ? 'border-[#0066CC]' : 'border-gray-300'}`}
            >
              {/* Collapsed Row */}
              <div className={`px-6 py-4 flex items-center gap-4 transition-colors ${collateral.isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <input
                  type="checkbox"
                  checked={collateral.isSelected}
                  onChange={() => patch(collateral.id, { isSelected: !collateral.isSelected })}
                  aria-label={`Select ${collateral.collateralName}`}
                  className="w-4 h-4 accent-[#0066CC] border-gray-300 rounded"
                />

                <button
                  type="button"
                  aria-expanded={collateral.isExpanded}
                  aria-controls={panelId}
                  onClick={() => patch(collateral.id, { isExpanded: !collateral.isExpanded })}
                  className="flex-1 flex items-center gap-4 text-left rounded"
                >
                  <ChevronRight
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${collateral.isExpanded ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                  <dl className="flex-1 grid grid-cols-3 gap-8">
                    <div>
                      <dt className="text-xs text-gray-500 mb-1">Collateral Name</dt>
                      <dd className="text-sm text-gray-900 font-medium">{collateral.collateralName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-1">Collateral Account Number</dt>
                      <dd className="text-sm text-gray-900">{collateral.collateralAccountNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 mb-1">Estimated Collateral Value</dt>
                      <dd className="text-sm text-gray-900 font-medium">{collateral.estimatedCollateralValue}</dd>
                    </div>
                  </dl>
                </button>
                {collateral.isSelected && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0066CC]">Selected</span>
                )}
              </div>

              {/* Expanded Detail Panel */}
              {collateral.isExpanded && (
                <div id={panelId} className="bg-gray-50 border-t border-gray-200 p-6">
                  <div className="bg-white border border-gray-300 rounded-lg p-6">
                    <div className="space-y-4 mb-6">
                      {collateral.details.map((detail, index) => {
                        const id = (f: string) => `${detail.id}-${f}`;
                        const rowLabel = `detail row ${index + 1}`;
                        return (
                          <fieldset key={detail.id} className="pb-4 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <legend className="sr-only">Collateral {rowLabel}</legend>
                            <div className="grid grid-cols-6 gap-3">
                              {SELECT_FIELDS.map(({ field, label, options }) => (
                                <div key={field}>
                                  <label htmlFor={id(field)} className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</label>
                                  <select
                                    id={id(field)}
                                    value={detail[field]}
                                    onChange={(e) => handleUpdateDetail(collateral.id, detail.id, field, e.target.value)}
                                    className={fieldClass}
                                  >
                                    <option value="">Select...</option>
                                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                              ))}
                              <div>
                                <label htmlFor={id('percent')} className="text-xs font-medium text-gray-600 mb-1.5 block">Percent of Ownership</label>
                                <div className="relative">
                                  <input
                                    id={id('percent')}
                                    type="text"
                                    inputMode="decimal"
                                    value={detail.percentOfOwnership}
                                    onChange={(e) =>
                                      handleUpdateDetail(collateral.id, detail.id, 'percentOfOwnership', e.target.value.replace(/[^0-9.]/g, ''))
                                    }
                                    className={`${fieldClass} pr-7`}
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500" aria-hidden="true">%</span>
                                </div>
                              </div>
                              <div>
                                <label htmlFor={id('relationship')} className="text-xs font-medium text-gray-600 mb-1.5 block">Relationship Type</label>
                                <select
                                  id={id('relationship')}
                                  value={detail.relationshipType}
                                  onChange={(e) => handleUpdateDetail(collateral.id, detail.id, 'relationshipType', e.target.value)}
                                  className={fieldClass}
                                >
                                  <option value="">Select...</option>
                                  {RELATIONSHIP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={id('heldBy')} className="text-xs font-medium text-gray-600 mb-1.5 block">Held By</label>
                                <select
                                  id={id('heldBy')}
                                  value={detail.heldBy}
                                  onChange={(e) => handleUpdateDetail(collateral.id, detail.id, 'heldBy', e.target.value)}
                                  className={fieldClass}
                                >
                                  <option value="">Select...</option>
                                  {HELD_BY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={id('owner')} className="text-xs font-medium text-gray-600 mb-1.5 block">Account Owner</label>
                                <div className="flex gap-2">
                                  <input
                                    id={id('owner')}
                                    type="text"
                                    value={detail.accountOwner}
                                    onChange={(e) => handleUpdateDetail(collateral.id, detail.id, 'accountOwner', e.target.value)}
                                    className={`${fieldClass} flex-1 min-w-0`}
                                  />
                                  {collateral.details.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDetail(collateral.id, detail.id)}
                                      className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      aria-label={`Delete ${rowLabel}`}
                                    >
                                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </fieldset>
                        );
                      })}
                    </div>

                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={() => handleAddDetail(collateral.id)}
                        className="flex items-center gap-2 text-sm text-[#0066CC] hover:underline font-medium"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Add Detail Row
                      </button>
                    </div>

                    <fieldset className="mb-6 pb-6 border-b border-gray-200">
                      <legend className="text-xs font-medium text-gray-600 mb-3">Pledged for Regulation Use Purpose</legend>
                      <div className="flex gap-6">
                        {(['yes', 'no'] as const).map(v => (
                          <label key={v} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`regulation-${collateral.id}`}
                              checked={collateral.pledgedForRegulation === v}
                              onChange={() => patch(collateral.id, { pledgedForRegulation: v })}
                              className="w-4 h-4 accent-[#0066CC]"
                            />
                            <span className="text-sm text-gray-900">{v === 'yes' ? 'Yes' : 'No'}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="flex justify-end items-center gap-4">
                      <p className="text-xs text-green-700" role="status" aria-live="polite">
                        {collateral.savedAt ? `Saved at ${collateral.savedAt}` : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSave(collateral.id)}
                        className="px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ApplicationStepLayout>
  );
}
