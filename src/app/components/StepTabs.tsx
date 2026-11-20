import type { KeyboardEvent } from 'react';

export const APPLICATION_STEPS = [
  { number: 1, label: 'Customer Information' },
  { number: 2, label: 'Co-borrowers' },
  { number: 3, label: 'Loan Information' },
  { number: 4, label: 'Collaterals' },
];

export type StepStatus = 'In Progress' | 'Completed' | 'Inactive';

interface StepTabsProps {
  currentStep: number;
  completedSteps: number[];
  onTabChange: (step: number) => void;
}

/**
 * Step rail for the four-step loan application. Implements the WAI-ARIA tabs
 * pattern (Left/Right/Home/End) and shows each step's true status:
 * In Progress (current), Completed (saved with Next), Inactive (not yet saved).
 */
export function StepTabs({ currentStep, completedSteps, onTabChange }: StepTabsProps) {
  const statusOf = (step: number): StepStatus =>
    step === currentStep ? 'In Progress' : completedSteps.includes(step) ? 'Completed' : 'Inactive';

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = APPLICATION_STEPS.length - 1;
    let next = -1;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next < 0) return;
    e.preventDefault();
    onTabChange(APPLICATION_STEPS[next].number);
    // Focus follows the newly rendered tab after navigation.
    requestAnimationFrame(() => document.getElementById(`step-tab-${APPLICATION_STEPS[next].number}`)?.focus());
  };

  return (
    <div className="border-b border-gray-200 px-8 pt-5">
      <div role="tablist" aria-label="Loan request steps" className="flex gap-8">
        {APPLICATION_STEPS.map((step, index) => {
          const status = statusOf(step.number);
          const selected = step.number === currentStep;
          return (
            <button
              key={step.number}
              id={`step-tab-${step.number}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="step-panel"
              tabIndex={selected ? 0 : -1}
              data-status={status}
              onClick={() => onTabChange(step.number)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`pb-3 px-1 -mb-px flex items-start gap-2 text-left border-b-2 transition-colors ${
                selected
                  ? 'border-[#0066CC] text-[#0066CC]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="text-sm">Step {step.number}: {step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
