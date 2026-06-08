interface Step {
  title: string;
  description: string;
  color: string;
}

interface Props {
  title?: string;
  steps: Step[];
}

export default function ProcessSteps({ title, steps }: Props) {
  return (
    <div className="my-8">
      {title && <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">{title}</h3>}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`relative border-l-4 p-5 rounded-r-lg shadow-sm ${step.color}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                {index + 1}
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">{step.title}</h4>
                <p className="text-sm opacity-80 leading-relaxed">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
