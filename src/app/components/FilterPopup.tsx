import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useModalA11y } from './useModalA11y';

interface FilterPopupProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
  onClose: () => void;
  availableStatuses: string[];
}

export function FilterPopup({
  selectedStatuses,
  onStatusChange,
  onClose,
  availableStatuses,
}: FilterPopupProps) {
  const [tempSelectedStatuses, setTempSelectedStatuses] = useState<string[]>(selectedStatuses);
  const panelRef = useModalA11y<HTMLDivElement>(true, onClose);

  useEffect(() => {
    setTempSelectedStatuses(selectedStatuses);
  }, [selectedStatuses]);

  const handleToggleStatus = (status: string) => {
    if (tempSelectedStatuses.includes(status)) {
      setTempSelectedStatuses(tempSelectedStatuses.filter(s => s !== status));
    } else {
      setTempSelectedStatuses([...tempSelectedStatuses, status]);
    }
  };

  const handleApply = () => {
    onStatusChange(tempSelectedStatuses);
    onClose();
  };

  const handleClear = () => {
    setTempSelectedStatuses([]);
    onStatusChange([]);
    onClose();
  };

  return (
    <>
      {/* Background overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popup panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-popup-title"
        className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg w-80"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 id="filter-popup-title" className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Filter by Status
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filter"
            className="p-1 rounded text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status checkboxes */}
        <fieldset className="px-4 py-4 space-y-3 max-h-80 overflow-y-auto">
          <legend className="sr-only">Statuses</legend>
          {availableStatuses.map((status) => (
            <label
              key={status}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-2 py-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={tempSelectedStatuses.includes(status)}
                onChange={() => handleToggleStatus(status)}
                className="w-4 h-4 accent-[#0066CC] border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">{status}</span>
            </label>
          ))}
        </fieldset>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 bg-[#0066CC] text-white rounded text-sm font-medium hover:bg-[#0052A3] transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </>
  );
}
