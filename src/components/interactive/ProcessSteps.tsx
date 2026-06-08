import { useState } from 'react';

interface Step {
  title: string;
  description: string;
  color: string;
}

interface Props {
  steps: Step[];
  title?: string;
}

export default function ProcessSteps({ steps, title = '流程图' }: Props) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="my-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            onClick={() => setActiveStep(activeStep === idx ? null : idx)}
            className="cursor-pointer group"
          >
            <div
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                activeStep === idx
                  ? `${step.color} border-current shadow-md`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  activeStep === idx ? 'scale-110' : ''
                } transition-transform`}
                style={{ backgroundColor: activeStep === idx ? undefined : '#6b7280' }}
              >
                {idx + 1}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                {activeStep === idx && (
                  <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <svg className="w-4 h-6 text-gray-300" fill="currentColor" viewBox="0 0 16 24">
                  <path d="M8 16l-6-6h12z" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-400">👆 点击每个步骤查看详细说明</p>
    </div>
  );
}
