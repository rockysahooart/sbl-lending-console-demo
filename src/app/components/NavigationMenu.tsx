import { X, FileText, ClipboardList } from 'lucide-react';
import { useModalA11y } from './useModalA11y';

interface NavigationMenuProps {
  isOpen: boolean;
  currentSection?: 'evaluations' | 'pending-review';
  onClose: () => void;
  onNavigate: (section: 'evaluations' | 'pending-review') => void;
}

export function NavigationMenu({ isOpen, currentSection, onClose, onNavigate }: NavigationMenuProps) {
  const panelRef = useModalA11y<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleNavigate = (section: 'evaluations' | 'pending-review') => {
    onNavigate(section);
    onClose();
  };

  const items = [
    { section: 'evaluations' as const, label: 'Evaluations', Icon: FileText },
    { section: 'pending-review' as const, label: 'Pending Review', Icon: ClipboardList },
  ];

  return (
    <>
      {/* Backdrop - Subtle Dimming Scrim */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Menu */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-menu-title"
        tabIndex={-1}
        className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 id="nav-menu-title" className="text-lg font-semibold text-gray-900">Navigation</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4" aria-label="Primary">
          <ul className="space-y-2">
            {items.map(({ section, label, Icon }) => {
              const current = currentSection === section;
              return (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(section)}
                    aria-current={current ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors group ${
                      current ? 'bg-blue-50 text-[#0066CC]' : 'text-gray-700 hover:bg-blue-50 hover:text-[#0066CC]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${current ? 'text-[#0066CC]' : 'text-gray-500 group-hover:text-[#0066CC]'}`} />
                    <span className="font-medium">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
