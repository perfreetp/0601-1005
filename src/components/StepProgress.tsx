import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  currentStep: number;
  steps: string[];
}

export default function StepProgress({ currentStep, steps }: StepProgressProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isLast = idx === steps.length - 1;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 border-2',
                  isCompleted &&
                    'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20',
                  isCurrent &&
                    'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-brand-800/40 border-brand-600/40 text-brand-400/60'
                )}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap transition-colors duration-300',
                  isCompleted && 'text-emerald-400',
                  isCurrent && 'text-amber-400',
                  !isCompleted && !isCurrent && 'text-brand-400/60'
                )}
              >
                {step}
              </span>
            </div>

            {!isLast && (
              <div className="flex-1 mx-3 h-0.5 relative overflow-hidden -mt-5">
                <div
                  className={cn(
                    'absolute inset-0 transition-all duration-500',
                    isCompleted
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-brand-700/40'
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
