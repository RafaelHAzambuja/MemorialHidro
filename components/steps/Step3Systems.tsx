
import React from 'react';
import { System, ProjectState } from '../../types';

interface Step3Props {
  systems: System[];
  onStateChange: (updates: Partial<ProjectState>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const Step3Systems: React.FC<Step3Props> = ({ systems, onStateChange, nextStep, prevStep }) => {

  const toggleSystem = (index: number) => {
    const newSystems = [...systems];
    newSystems[index].enabled = !newSystems[index].enabled;
    onStateChange({ systems: newSystems });
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Sistemas a Dimensionar</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Selecione quais sistemas serão incluídos no projeto.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {systems.map((system, index) => (
          <div
            key={index}
            onClick={() => toggleSystem(index)}
            className={`rounded-xl p-6 cursor-pointer transition-all border-2 ${
              system.enabled
                ? 'bg-primary-50 dark:bg-primary-900/40 border-primary-500'
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            <div className="flex items-start">
              <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg mr-4 text-white text-xl ${system.enabled ? 'bg-primary-600' : 'bg-slate-400 dark:bg-slate-500'}`}>
                <i className={system.icon}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{system.name}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{system.description}</p>
              </div>
              <div className="relative">
                <div className={`w-12 h-6 rounded-full transition-colors ${system.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${system.enabled ? 'translate-x-6' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center transition">
          <i className="fas fa-arrow-left mr-2"></i> Anterior
        </button>
        <button onClick={nextStep} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center shadow-lg transition">
          Próximo <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};
