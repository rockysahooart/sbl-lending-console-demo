import { createContext, useContext, useState, type ReactNode } from 'react';
import { Header } from './Header';
import { StepTabs } from './StepTabs';

/** Legacy application header data, repeated at the top of every step (as the original system did). */
export interface LegacySummaryData { applicationId: string; customerName: string; powerId: string; opened: string; purpose: string; requested: string; power: string; type: string }
export const LegacySummary = createContext<LegacySummaryData | null>(null);

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
  const sum = useContext(LegacySummary);
  const [saved, setSaved] = useState('');
  const save = () => setSaved(`11/19/2025 ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`);
  return (
    <div className="flex flex-col h-screen">
      <Header pageTitle="Loan Request" />
      <div className="lg-sysbar" aria-hidden="true"><span>SBL Origination · Loan Request Maintenance</span></div>

      <div className="flex-1 min-h-0 bg-[#0066CC] flex flex-col">
        {/* Page Title */}
        <div className="max-w-[1648px] w-full mx-auto px-8 pt-6 pb-4">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 max-w-[1584px] w-[calc(100%-4rem)] mx-auto bg-white rounded-t-lg overflow-hidden flex flex-col">
          {sum && (
            <div className="lg-summary">
              <table>
                <caption className="sr-only">Application header</caption>
                <tbody>
                  <tr>
                    <td className="k">Application No.</td><td className="lg-code">{sum.applicationId}</td>
                    <td className="k">Customer</td><td>{sum.customerName}</td>
                    <td className="k">Power ID</td><td className="lg-code">{sum.powerId}</td>
                    <td className="k">App Type</td><td>{sum.type}</td>
                  </tr>
                  <tr>
                    <td className="k">Opened</td><td>{sum.opened}</td>
                    <td className="k">Purpose</td><td>{sum.purpose}</td>
                    <td className="k">Req. Amt</td><td>{sum.requested}</td>
                    <td className="k">Max Borr. Pwr</td><td>{sum.power}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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
            <div className="flex items-center gap-2">
              {footerNote && (
                <p className="text-xs text-gray-600" role="status" aria-live="polite">
                  {footerNote}
                </p>
              )}
              {saved && <span className="lg-footer-msg" role="status">Record saved {saved}</span>}
              <button type="button" className="lg-btn" onClick={save}>Save</button>
              <button type="button" className="lg-btn" onClick={() => window.print()}>Print</button>
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
