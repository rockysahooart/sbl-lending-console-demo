interface ProgressIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: 'Customer Information' },
  { number: 2, label: 'Co-Borrowers' },
  { number: 3, label: 'Loan Information' },
  { number: 4, label: 'Collaterals' },
  { number: 5, label: 'Submitted' },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1584px] mx-auto px-8">
        <div className="flex">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`flex-1 px-6 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
                step.number === currentStep
                  ? 'border-[#0066CC] text-[#0066CC] bg-white'
                  : step.number < currentStep
                  ? 'border-transparent text-gray-600 bg-gray-50'
                  : 'border-transparent text-gray-400 bg-gray-50'
              }`}
            >
              <span className="text-xs text-gray-500 block mb-1">Step {step.number}</span>
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}