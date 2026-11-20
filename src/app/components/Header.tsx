import { Menu, User } from 'lucide-react';
import { useConsoleStore } from '../state/ConsoleStore';

interface HeaderProps {
  pageTitle?: string;
  onNavigationClick?: () => void;
}

export function Header({ pageTitle = '', onNavigationClick }: HeaderProps) {
  // Every screen's menu button opens the navigation drawer; a screen may
  // pass its own handler, otherwise the shared console handler is used.
  const { openMenu } = useConsoleStore();
  const handleMenu = onNavigationClick ?? openMenu;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="max-w-[1584px] mx-auto px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 h-16">
          {/* Left Zone: Navigation & Product Name */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleMenu}
              className="p-2 text-gray-600 hover:text-[#0066CC] hover:bg-gray-50 rounded transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-gray-300" aria-hidden="true" />
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <span className="w-1 h-4 rounded-sm bg-[#f5a742]" aria-hidden="true" />
              Securities Lending Console
            </span>
          </div>

          {/* Center Zone: Page Title */}
          <h1 className="text-base font-semibold text-gray-900 text-center">
            {pageTitle}
          </h1>

          {/* Right Zone: User Context */}
          <div className="flex items-center justify-end gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Sarah Mitchell</div>
              <div className="text-xs text-gray-600">Loan Officer • Branch 4472</div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center" aria-hidden="true">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
