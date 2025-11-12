
import React from 'react';
import { ProjectState } from '../../types';
import { buildingTypes, projectTemplates } from '../../constants';
import { estimatePopulation } from '../../services/utils';

interface Step1Props {
  state: ProjectState;
  onStateChange: (updates: Partial<ProjectState>) => void;
  nextStep: () => void;
}

export const Step1BuildingType: React.FC<Step1Props> = ({ state, onStateChange, nextStep }) => {
  const { selectedBuildingType } = state;

  const handleSelectType = (index: number) => {
    onStateChange({ selectedBuildingType: index });
  };
  
  const handleApplyTemplate = (template: typeof projectTemplates[0]) => {
      const updatedBuildingData = { ...state.buildingData, ...template.config };
      if (template.config.dormitorios) {
        updatedBuildingData.pessoas = estimatePopulation(template.config.dormitorios);
      }
      onStateChange({ buildingData: updatedBuildingData });
  };


  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Tipo de Edificação</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Selecione o tipo de edificação para ajustar os parâmetros de cálculo.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {buildingTypes.map((type, index) => (
          <div
            key={index}
            onClick={() => handleSelectType(index)}
            className={`p-6 rounded-xl cursor-pointer transition-all border-2 text-center transform hover:-translate-y-1 ${
              selectedBuildingType === index
                ? 'bg-primary-600 text-white border-primary-600 ring-4 ring-primary-500/30 scale-105'
                : 'bg-slate-50 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600'
            }`}
          >
            <i className={`${type.icon} text-3xl mb-3`}></i>
            <p className="font-bold text-lg">{type.name}</p>
            <p className="text-sm mt-1 opacity-80">{type.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-sky-50 dark:bg-sky-900/50 rounded-xl border border-sky-200 dark:border-sky-800">
        <h3 className="font-bold text-sky-800 dark:text-sky-300 mb-4 flex items-center"><i className="fas fa-magic mr-2"></i> Templates de Projeto</h3>
        <p className="text-sky-700 dark:text-sky-400 mb-4 text-sm">Aplique configurações pré-definidas para acelerar o preenchimento:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectTemplates.map(template => (
            <div key={template.name} onClick={() => handleApplyTemplate(template)} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-sky-200 dark:border-sky-700 cursor-pointer hover:bg-sky-100 dark:hover:bg-slate-700 transition-all">
              <h4 className="font-semibold text-sky-800 dark:text-sky-300">{template.name}</h4>
              <p className="text-sm text-sky-600 dark:text-sky-400 mt-1">{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <button onClick={nextStep} disabled={selectedBuildingType === null} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          Próximo <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};
