
import React from 'react';
import { ProjectState, Module } from '../../types';

interface Step6Props {
  state: ProjectState;
  onStateChange: (updates: Partial<ProjectState>) => void;
  prevStep: () => void;
  progress: number;
  enabledModules: Module[];
  completedModulesCount: number;
  handleGenerateReport: () => void;
  handleGenerateDocx: () => void;
}

export const Step6FinalReport: React.FC<Step6Props> = ({ state, prevStep, progress, enabledModules, completedModulesCount, handleGenerateReport, handleGenerateDocx }) => {

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Memorial Final</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Confira o resumo completo e gere o memorial para impressão ou arquivamento.</p>

      <div className="mb-8 p-5 bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-primary-900/30 dark:to-emerald-900/30 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-primary-800 dark:text-primary-300">Progresso do Projeto</span>
          <span className="font-bold text-primary-900 dark:text-primary-200 text-lg">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-primary-200 dark:bg-primary-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-500 to-emerald-500 h-3 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-primary-700 dark:text-primary-300 mt-3 text-sm">
          {completedModulesCount} de {enabledModules.length} módulos calculados
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Resumo dos Sistemas</h3>
        <div className="space-y-4">
          {enabledModules.map(module => (
            <div key={module.name} className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg flex items-center text-slate-800 dark:text-slate-200">
                  <i className={`${module.icon} text-primary-600 mr-3`}></i>
                  {module.name}
                </h4>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${module.results.length > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'}`}>
                  {module.results.length > 0 ? 'Concluído' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
        <button onClick={prevStep} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center w-full sm:w-auto justify-center transition">
          <i className="fas fa-arrow-left mr-2"></i> Anterior
        </button>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button onClick={handleGenerateDocx} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center shadow-lg w-full justify-center transition">
            <i className="fas fa-file-word mr-2"></i> Baixar DOCX
          </button>
          <button onClick={handleGenerateReport} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg flex items-center shadow-lg w-full justify-center transition">
            <i className="fas fa-file-pdf mr-2"></i> Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
