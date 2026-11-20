import type { ReactNode } from 'react';
import { Header } from './Header';
import { StepTabs } from './StepTabs';

interface ApplicationStepLayoutProps {
  title: string;
  currentStep: number;
  completedSteps: number[];
  onTabChange: (step: number) => void;
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  backLabel?: string;
  /** Optional status message shown beside the footer actions. */
  footerNote?: ReactNode;
  children: ReactNode;
}

/**
 * Frame shared by the four loan-request steps: fixed header, page title,
 * step rail, a vertically scrolling form region, and a fixed footer.
 */
export function ApplicationStepLayout({
  title,
  currentStep,
  completedSteps,
  onTabChange,
  onBack,
  onPrimary,
  primaryLabel,
  backLabel = 'Back',
  footerNote,
  children,
}: ApplicationStepLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <Header pageTitle="Loan Request" />

      <div className="flex-1 min-h-0 bg-[#0066CC] flex flex-col">
        {/* Page Title */}
        <div className="max-w-[1648px] w-full mx-auto px-8 pt-6 pb-4">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 max-w-[1584px] w-[calc(100%-4rem)] mx-auto bg-white rounded-t-lg overflow-hidden flex flex-col">
          <StepTabs currentStep={currentStep} completedSteps={completedSteps} onTabChange={onTabChange} />

          {/* Scrollable Form Content */}
          <main
            id="step-panel"
            role="tabpanel"
            aria-labelledby={`step-tab-${currentStep}`}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-8 py-6"
          >
            {children}
          </main>

          {/* Footer Navigation */}
          <footer className="flex-shrink-0 border-t border-gray-200 px-8 py-4 flex items-center justify-between gap-4 bg-white">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-[#0066CC] hover:underline font-medium uppercase tracking-wide"
            >
              {backLabel}
            </button>
            <div className="flex items-center gap-4">
              {footerNote && (
                <p className="text-xs text-gray-600" role="status" aria-live="polite">
                  {footerNote}
                </p>
              )}
              <button
                type="button"
                onClick={onPrimary}
                className="px-6 py-2 bg-[#0066CC] text-white rounded hover:bg-[#0052A3] transition-colors text-sm font-medium"
              >
                {primaryLabel}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
