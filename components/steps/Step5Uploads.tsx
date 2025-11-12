
import React from 'react';
import { ProjectState, Plantas, PlantasBase64 } from '../../types';
import { fileToBase64 } from '../../services/utils';

interface Step5Props {
  state: ProjectState;
  onStateChange: (updates: Partial<ProjectState>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DropZone: React.FC<{
  title: string;
  icon: string;
  file: File | null;
  base64: string | null;
  onFileChange: (file: File) => void;
  onFileRemove: () => void;
}> = ({ title, icon, file, base64, onFileChange, onFileRemove }) => {

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if(e.dataTransfer.files && e.dataTransfer.files[0]){
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <h3 className="font-semibold mb-3 text-slate-700 dark:text-slate-300">{title}</h3>
      <div 
        className="h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center relative transition hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        {base64 ? (
          <>
            <img src={base64} className="w-full h-full object-contain rounded-lg p-2" alt="Preview" />
            <button onClick={onFileRemove} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"><i className="fas fa-times"></i></button>
          </>
        ) : (
          <label className="text-center cursor-pointer">
            <i className={`${icon} text-4xl text-primary-500 mb-3`}></i>
            <p className="font-medium text-slate-700 dark:text-slate-300">Arraste e solte ou clique para carregar</p>
            <p className="text-sm text-slate-500 mt-1">Formatos aceitos: JPG, PNG</p>
            <input type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} className="hidden" />
          </label>
        )}
      </div>
    </div>
  );
};


export const Step5Uploads: React.FC<Step5Props> = ({ state, onStateChange, nextStep, prevStep }) => {
  const { plantas, plantasBase64 } = state;

  const handleFileChange = async (key: keyof Plantas, file: File) => {
    const base64 = await fileToBase64(file);
    onStateChange({
      plantas: { ...plantas, [key]: file },
      plantasBase64: { ...plantasBase64, [key]: base64 },
    });
  };

  const handleFileRemove = (key: keyof Plantas) => {
    onStateChange({
      plantas: { ...plantas, [key]: null },
      plantasBase64: { ...plantasBase64, [key]: null },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Plantas e Detalhamentos</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Inclua as plantas e detalhamentos necessários para o projeto.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <DropZone title="Planta Baixa Típica" icon="fas fa-drafting-compass" file={plantas.plantaBaixa} base64={plantasBase64.plantaBaixa} onFileChange={(f) => handleFileChange('plantaBaixa', f)} onFileRemove={() => handleFileRemove('plantaBaixa')} />
        <DropZone title="Cortes e Detalhes" icon="fas fa-cut" file={plantas.cortes} base64={plantasBase64.cortes} onFileChange={(f) => handleFileChange('cortes', f)} onFileRemove={() => handleFileRemove('cortes')} />
        <DropZone title="Drenagem Pluvial" icon="fas fa-cloud-rain" file={plantas.drenagem} base64={plantasBase64.drenagem} onFileChange={(f) => handleFileChange('drenagem', f)} onFileRemove={() => handleFileRemove('drenagem')} />
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
