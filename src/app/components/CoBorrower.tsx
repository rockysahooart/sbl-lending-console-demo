import { Fragment, useState } from 'react';
import { Search, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ApplicationStepLayout } from './ApplicationStepLayout';
import { inputClass } from './CustomerInformation';
import type { ApplicationData, CoBorrowerData, StepProps } from './LoanApplication';
import { baselineSearch } from '../../demo/beforeData';
import { useDemoOptional } from '../../demo/DemoContext';

const MAX_CO_BORROWERS = 8;

type CoBorrowerRecord = CoBorrowerData & {
  role?: string;
  relationship?: string;
  isPoliticallyExposed?: string;
  maritalStatus?: string;
};

function ReadOnly({ label, value, col }: { label: string; value: string; col: string }) {
  return (
    <div className={col}>
      <dt className="text-xs font-medium text-gray-600 mb-2">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value}</dd>
    </div>
  );
}

function RadioRow({
  legend,
  name,
  options,
  value,
  onChange,
  last,
}: {
  legend: string;
  name: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  last?: boolean;
}) {
  return (
    <fieldset className={`flex items-center justify-between gap-8 py-3 ${last ? '' : 'border-b border-gray-100'}`}>
      <legend className="float-left text-sm text-gray-900">{legend}</legend>
      <div className="flex items-center gap-6 flex-shrink-0">
        {options.map(option => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="w-4 h-4 accent-[#0066CC] cursor-pointer"
            />
            <span className="text-sm text-gray-900">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CoBorrower({ data, currentTab, completedSteps, onNext, onBack, onTabChange, onDataUpdate }: StepProps) {
  // Controlled by application state: edits survive tab changes and Back.
  const formData = data;
  const coBorrowers = formData.coBorrowers as CoBorrowerRecord[];
  const update = (patch: Partial<ApplicationData>) => onDataUpdate(patch);

  const demo = useDemoOptional();
  const [searchBy, setSearchBy] = useState<'mdm' | 'power' | 'ssn'>('mdm');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<CoBorrowerRecord[]>([]);
  const [expandedCoBorrowerId, setExpandedCoBorrowerId] = useState<string | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      demo?.track('error', 'before');
      setSearchError(`${getSearchPlaceholder()} to search.`);
      document.getElementById('co-search-input')?.focus();
      return;
    }
    setSearchError('');
    setSearchResults(baselineSearch(searchBy, searchQuery));
    setShowResults(true);
  };

  const handleAddCoBorrower = (coBorrower: CoBorrowerRecord) => {
    if (coBorrowers.length >= MAX_CO_BORROWERS) return;
    if (coBorrowers.some(cb => cb.id === coBorrower.id)) return;
    update({ coBorrowers: [...coBorrowers, coBorrower] });
  };

  const handleRemoveCoBorrower = (id: string) => {
    update({ coBorrowers: coBorrowers.filter(cb => cb.id !== id) });
    if (expandedCoBorrowerId === id) setExpandedCoBorrowerId(null);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedCoBorrowerId(expandedCoBorrowerId === id ? null : id);
  };

  const handleUpdateCoBorrower = (id: string, field: string, value: string) => {
    update({ coBorrowers: coBorrowers.map(cb => (cb.id === id ? { ...cb, [field]: value } : cb)) });
  };

  const getSearchPlaceholder = () => {
    switch (searchBy) {
      case 'mdm':
        return 'Enter MDM ID';
      case 'power':
        return 'Enter Power ID';
      case 'ssn':
        return 'Enter SSN or Tax ID';
      default:
        return 'Enter search value';
    }
  };

  const canAddMore = coBorrowers.length < MAX_CO_BORROWERS;

  return (
    <ApplicationStepLayout
      title="2. Loan Request - Co-borrowers"
      currentStep={currentTab}
      completedSteps={completedSteps}
      onTabChange={onTabChange}
      onBack={onBack}
      onPrimary={() => onNext()}
      primaryLabel="Next"
    >
      {/* Confirm Application Type */}
      <section className="mb-10 pb-10 border-b border-gray-200" aria-labelledby="sec-app-type">
        <h3 id="sec-app-type" className="text-base font-semibold text-gray-900 mb-6">Confirm Application Type</h3>
        <RadioRow
          legend="Is this a joint application?"
          name="co-joint"
          options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
          value={formData.isJointApplication ? 'yes' : 'no'}
          onChange={(v) =>
            update({ isJointApplication: v === 'yes', applicationType: v === 'yes' ? 'Joint' : 'Individual' })
          }
        />
        <RadioRow
          legend="Have the co-applicant(s) given you permission to apply jointly on their behalf?"
          name="co-permission"
          options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
          value={formData.hasCoApplicantPermission ? 'yes' : 'no'}
          onChange={(v) => update({ hasCoApplicantPermission: v === 'yes' })}
        />
        <RadioRow
          legend="How will the customer confirm repayment method?"
          name="co-repayment"
          options={[
            { label: 'In person', value: 'In person' },
            { label: 'Online', value: 'Online' },
            { label: 'Via phone', value: 'Via Phone' },
          ]}
          value={formData.repaymentSource}
          onChange={(v) => update({ repaymentSource: v as ApplicationData['repaymentSource'] })}
          last
        />
      </section>

      {/* Search for Co-Borrower */}
      <section className="mb-8 pb-8 border-b border-gray-200" aria-labelledby="sec-co-search">
        <h3 id="sec-co-search" className="text-base font-semibold text-gray-900 mb-6">Search for Co-Borrower Details</h3>

        <form
          className="flex items-start gap-8"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <fieldset className="flex items-center gap-6 min-h-[38px]">
            <legend className="float-left mr-6 text-sm text-gray-700">Search by</legend>
            {[
              { value: 'mdm' as const, label: 'MDM ID' },
              { value: 'power' as const, label: 'Power ID' },
              { value: 'ssn' as const, label: 'SSN/Tax ID' },
            ].map(option => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="co-search-by"
                  checked={searchBy === option.value}
                  onChange={() => setSearchBy(option.value)}
                  className="w-4 h-4 accent-[#0066CC]"
                />
                <span className="text-sm text-gray-900">{option.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="flex-1 max-w-md">
            <div className="flex gap-2">
              <label htmlFor="co-search-input" className="sr-only">{getSearchPlaceholder()}</label>
              <input
                id="co-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchError('');
                }}
                aria-invalid={searchError ? true : undefined}
                aria-describedby="co-search-error"
                className={`${inputClass} flex-1`}
                placeholder={getSearchPlaceholder()}
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#0066CC] rounded hover:bg-[#0052A3] flex items-center gap-2"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                Search
              </button>
            </div>
            <p id="co-search-error" className="text-xs text-red-700 mt-1" aria-live="polite">{searchError}</p>
          </div>
        </form>

        {/* Search Results */}
        {showResults && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4" aria-live="polite">
              Search Results ({searchResults.length})
            </h4>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Customer Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Power ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">MDM ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">SSN</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-gray-600">
                      No customers found for “{searchQuery}”. Check the identifier and search again.
                    </td>
                  </tr>
                )}
                {searchResults.map((coBorrower) => {
                  const isAdded = coBorrowers.some(cb => cb.id === coBorrower.id);
                  return (
                    <tr key={coBorrower.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.powerId}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.mdmId}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.ssn}</td>
                      <td className="px-4 py-3 text-right">
                        {isAdded ? (
                          <span className="text-xs text-gray-600">Added</span>
                        ) : !canAddMore ? (
                          <span className="text-xs text-gray-600">Limit reached ({MAX_CO_BORROWERS} maximum)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddCoBorrower(coBorrower)}
                            aria-label={`Add ${coBorrower.name} as co-borrower`}
                            className="text-xs text-[#0066CC] hover:underline font-medium"
                          >
                            Add Co-Borrower
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Added Co-Borrower Rows */}
      {coBorrowers.length > 0 && (
        <section className="mb-8 pb-8 border-b border-gray-200" aria-labelledby="sec-co-added">
          <h3 id="sec-co-added" className="text-base font-semibold text-gray-900 mb-4">
            Added Co-Borrowers ({coBorrowers.length}/{MAX_CO_BORROWERS})
          </h3>

          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  {[
                    ['Name', 'w-[17%]'],
                    ['Phone Number', 'w-[13%]'],
                    ['Email', 'w-[20%]'],
                    ['DOB', 'w-[10%]'],
                    ['SSN/Tax ID', 'w-[12%]'],
                    ['MDM ID', 'w-[10%]'],
                    ['Power ID', 'w-[10%]'],
                  ].map(([label, width]) => (
                    <th key={label} scope="col" className={`${width} px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide`}>
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="w-[8%] px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {coBorrowers.map((coBorrower, index) => {
                  const isExpanded = expandedCoBorrowerId === coBorrower.id;
                  const panelId = `co-detail-${coBorrower.id}`;
                  return (
                    <Fragment key={coBorrower.id}>
                      <tr
                        className={`${index !== 0 ? 'border-t border-gray-200' : ''} cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => handleToggleExpand(coBorrower.id)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpand(coBorrower.id);
                            }}
                            className="flex items-start gap-2 text-left text-sm rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                            )}
                            <span className="break-words">{coBorrower.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 break-words">{coBorrower.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 break-all">{coBorrower.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.dob}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.ssn}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.mdmId}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{coBorrower.powerId}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCoBorrower(coBorrower.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Remove co-borrower ${coBorrower.name}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <tr id={panelId}>
                          <td colSpan={8} className="bg-gray-50 border-t border-gray-200 px-4 py-6">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                                  Address Information <span className="font-normal normal-case tracking-normal text-gray-500">(from customer record)</span>
                                </h4>
                                <dl className="grid grid-cols-6 gap-x-6 gap-y-4">
                                  <ReadOnly col="col-start-1" label="Address Line 1" value={coBorrower.addressLine1} />
                                  <ReadOnly col="col-start-2" label="Address Line 2" value={coBorrower.addressLine2} />
                                  <ReadOnly col="col-start-3" label="City" value={coBorrower.city} />
                                  <ReadOnly col="col-start-4" label="State" value={coBorrower.state} />
                                  <ReadOnly col="col-start-5" label="ZIP Code" value={coBorrower.zipCode} />
                                  <ReadOnly col="col-start-6" label="Customer Since" value={coBorrower.customerSince} />
                                </dl>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                                  Identity Information <span className="font-normal normal-case tracking-normal text-gray-500">(from customer record)</span>
                                </h4>
                                <dl className="grid grid-cols-6 gap-x-6 gap-y-4">
                                  <ReadOnly col="col-start-1" label="Proof of Identity" value={coBorrower.proofOfIdentity} />
                                  <ReadOnly col="col-start-2" label="ID Number" value={coBorrower.idNumber} />
                                  <ReadOnly col="col-start-3" label="Place of Issuance" value={coBorrower.placeOfIssuance} />
                                  <ReadOnly col="col-start-4" label="Date Issued" value={coBorrower.dateIssued} />
                                  <ReadOnly col="col-start-5" label="Date of Expiration" value={coBorrower.dateExpiration} />
                                </dl>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">Additional Information</h4>
                                <div className="grid grid-cols-6 gap-x-6 gap-y-4">
                                  <div className="col-span-2">
                                    <label htmlFor={`${panelId}-pep`} className="text-xs font-medium text-gray-600 mb-2 block">
                                      Is the person politically exposed?
                                    </label>
                                    <select
                                      id={`${panelId}-pep`}
                                      className={inputClass}
                                      value={coBorrower.isPoliticallyExposed || ''}
                                      onChange={(e) => handleUpdateCoBorrower(coBorrower.id, 'isPoliticallyExposed', e.target.value)}
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                  </div>
                                  <div className="col-span-2">
                                    <label htmlFor={`${panelId}-marital`} className="text-xs font-medium text-gray-600 mb-2 block">
                                      Marital Status
                                    </label>
                                    <select
                                      id={`${panelId}-marital`}
                                      className={inputClass}
                                      value={coBorrower.maritalStatus || ''}
                                      onChange={(e) => handleUpdateCoBorrower(coBorrower.id, 'maritalStatus', e.target.value)}
                                    >
                                      <option value="">Select</option>
                                      <option value="Single">Single</option>
                                      <option value="Married">Married</option>
                                      <option value="Divorced">Divorced</option>
                                      <option value="Widowed">Widowed</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Additional Information */}
      <section aria-labelledby="sec-co-additional">
        <h3 id="sec-co-additional" className="text-base font-semibold text-gray-900 mb-6">Additional Information</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="co-add-pep" className="text-xs font-medium text-gray-600 mb-2 block">Is the person politically exposed?</label>
            <select
              id="co-add-pep"
              className={inputClass}
              value={formData.coBorrowerPoliticallyExposed || ''}
              onChange={(e) => update({ coBorrowerPoliticallyExposed: e.target.value })}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label htmlFor="co-add-marital" className="text-xs font-medium text-gray-600 mb-2 block">Marital Status</label>
            <select
              id="co-add-marital"
              className={inputClass}
              value={formData.coBorrowerMaritalStatus || ''}
              onChange={(e) => update({ coBorrowerMaritalStatus: e.target.value })}
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label htmlFor="co-add-spouse" className="text-xs font-medium text-gray-600 mb-2 block">Spousal Name</label>
            <input
              id="co-add-spouse"
              type="text"
              className={inputClass}
              value={formData.coBorrowerSpouseName || ''}
              onChange={(e) => update({ coBorrowerSpouseName: e.target.value })}
            />
          </div>
        </div>
      </section>
    </ApplicationStepLayout>
  );
}
