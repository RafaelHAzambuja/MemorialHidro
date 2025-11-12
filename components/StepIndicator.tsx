
import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  maxStepReached: number;
  goToStep: (step: number) => void;
}

const steps = [
  { number: 1, title: "Tipo de Edificação" },
  { number: 2, title: "Dados do Projeto" },
  { number: 3, title: "Sistemas" },
  { number: 4, title: "Cálculos" },
  { number: 5, title: "Plantas" },
  { number: 6, title: "Memorial Final" },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, maxStepReached, goToStep }) => {
  return (
    <div className="relative print:hidden">
      <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700" aria-hidden="true">
        <div
          className="h-1 bg-primary-600 transition-all duration-300"
          style={{ width: `${((maxStepReached - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      <div className="relative flex justify-between">
        {steps.map(step => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isAccessible = step.number <= maxStepReached;
          
          let statusClasses = 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300';
          if (isActive) {
            statusClasses = 'bg-primary-600 text-white ring-4 ring-primary-600/30';
          } else if (isCompleted) {
            statusClasses = 'bg-emerald-600 text-white';
          }

          return (
            <div key={step.number} className="text-center flex-1">
              <button
                onClick={() => isAccessible && goToStep(step.number)}
                disabled={!isAccessible}
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${statusClasses} ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                {isCompleted ? <i className="fas fa-check"></i> : step.number}
              </button>
              <p className={`mt-2 text-xs font-medium ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
