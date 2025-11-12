import React, { useState, useEffect } from 'react';
import { ProjectState, MemorialVersion } from '../../types';
import { estimatePopulation } from '../../services/utils';
import { fileToBase64 } from '../../services/utils';

interface ValidationState {
    [key: string]: {
        isValid: boolean;
        message: string;
    } | undefined;
}

interface Step2Props {
  state: ProjectState;
  onStateChange: (updates: Partial<ProjectState>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const InputField = ({ label, name, value, onChange, type = "text", min, step, validation, error, success, placeholder }: any) => (
    <div className="relative">
        <label className="absolute -top-2 left-2 px-1 bg-white dark:bg-slate-800 text-xs text-primary-600 dark:text-primary-400">{label}</label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            min={min}
            step={step}
            placeholder={placeholder}
            className={`w-full px-4 py-3 bg-transparent border-2 rounded-lg focus:outline-none focus:border-primary-500 transition ${validation ? (validation.isValid ? 'border-emerald-500' : 'border-red-500') : 'border-slate-200 dark:border-slate-600'}`}
        />
        {validation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <i className={`fas ${validation.isValid ? 'fa-check text-emerald-500' : 'fa-times text-red-500'}`}></i>
            </div>
        )}
         {validation && !validation.isValid && <p className="text-xs text-red-500 mt-1">{validation.message}</p>}
         {validation && validation.isValid && <p className="text-xs text-emerald-500 mt-1">Campo válido</p>}
    </div>
);

const SelectField = ({ label, name, value, onChange, children }: any) => (
    <div className="relative">
        <label className="absolute -top-2 left-2 px-1 bg-white dark:bg-slate-800 text-xs text-primary-600 dark:text-primary-400">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-3 bg-transparent border-2 rounded-lg focus:outline-none focus:border-primary-500 transition border-slate-200 dark:border-slate-600 appearance-none"
        >
            {children}
        </select>
    </div>
);


export const Step2ProjectData: React.FC<Step2Props> = ({ state, onStateChange, nextStep, prevStep }) => {
    const { projectInfo, engenheiro, buildingData, projectData, customLogo } = state;
    const [estimatedPop, setEstimatedPop] = useState(0);
    const [fieldValidation, setFieldValidation] = useState<ValidationState>({});

    const validateField = (fieldName: string, value: any) => {
        const validations = {
            areaTotal: {
                isValid: value > 0,
                message: "Área deve ser maior que zero",
            },
            pessoas: {
                isValid: value > 0 && value <= 1000,
                message: "Número de pessoas deve estar entre 1 e 1000",
            },
        };
        const validation = validations[fieldName as keyof typeof validations];
        if(validation) {
            setFieldValidation(prev => ({...prev, [fieldName]: validation}));
        }
    };

    useEffect(() => {
      if (state.selectedBuildingType === 0) { // Unifamiliar
        setEstimatedPop(estimatePopulation(buildingData.dormitorios));
      }
    }, [buildingData.dormitorios, state.selectedBuildingType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, ...keys: string[]) => {
      const { name, value, type } = e.target;
      const val = type === 'number' && value !== '' ? parseFloat(value) : value;
      
      validateField(name, val);

      const newState = { ...state };
      let current: any = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = { ...current[keys[keys.length-1]], [name]: val };
      onStateChange({ [keys[0]]: newState[keys[0] as keyof ProjectState] });
    };

    const handleDormitoriosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDormitorios = parseInt(e.target.value, 10) || 0;
        const newPop = estimatePopulation(newDormitorios);
        onStateChange({
            buildingData: {
                ...buildingData,
                dormitorios: newDormitorios,
                pessoas: newPop,
            },
        });
        validateField('pessoas', newPop);
    };
    
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            onStateChange({ customLogo: base64 });
        }
    };

    const handleVersionChange = (index: number, field: keyof MemorialVersion, value: string) => {
        const updatedVersions = [...projectInfo.memorialVersions];
        updatedVersions[index] = { ...updatedVersions[index], [field]: value };
        onStateChange({ projectInfo: { ...projectInfo, memorialVersions: updatedVersions } });
    };

    const addVersion = () => {
        const newVersion: MemorialVersion = {
            id: Date.now(),
            version: `R${(projectInfo.memorialVersions.length).toString().padStart(2, '0')}`,
            date: new Date().toISOString().split("T")[0],
            description: '',
            author: engenheiro.nome,
        };
        onStateChange({ projectInfo: { ...projectInfo, memorialVersions: [...projectInfo.memorialVersions, newVersion] } });
    };

    const removeVersion = (index: number) => {
        const updatedVersions = projectInfo.memorialVersions.filter((_, i) => i !== index);
        onStateChange({ projectInfo: { ...projectInfo, memorialVersions: updatedVersions } });
    };

    const renderBuildingForm = () => {
        switch (state.selectedBuildingType) {
            case 0: // Unifamiliar
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputField label="Nº de Pavimentos" name="pavimentos" type="number" min="1" value={buildingData.pavimentos} onChange={(e: any) => handleChange(e, 'buildingData')} />
                        <InputField label="Nº de Pessoas" name="pessoas" type="number" min="1" value={buildingData.pessoas} onChange={(e: any) => handleChange(e, 'buildingData')} validation={fieldValidation.pessoas} />
                         <div>
                            <InputField label="Nº de Dormitórios" name="dormitorios" type="number" min="1" value={buildingData.dormitorios} onChange={handleDormitoriosChange} />
                             <p className="text-xs text-slate-500 mt-1">Sugestão: {estimatedPop} pessoas</p>
                        </div>
                    </div>
                );
            case 1: // Multifamiliar
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField label="Nº de Pisos" name="pisos" type="number" min="1" value={buildingData.pisos} onChange={(e: any) => handleChange(e, 'buildingData')} />
                        <InputField label="Aptos/Andar" name="aptPorAndar" type="number" min="1" value={buildingData.aptPorAndar} onChange={(e: any) => handleChange(e, 'buildingData')} />
                        <InputField label="Pessoas/Apto" name="pessoasPorApt" type="number" min="1" value={buildingData.pessoasPorApt} onChange={(e: any) => handleChange(e, 'buildingData')} />
                    </div>
                );
            default: // Comercial / Industrial
                 return (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nº de Pavimentos" name="pavimentos" type="number" min="1" value={buildingData.pavimentos} onChange={(e: any) => handleChange(e, 'buildingData')} />
                        <InputField label="População (funcionários/dia)" name="pessoas" type="number" min="1" value={buildingData.pessoas} onChange={(e: any) => handleChange(e, 'buildingData')} validation={fieldValidation.pessoas} />
                    </div>
                );
        }
    }


  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Dados do Projeto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="Nome do Projeto" name="name" type="text" value={projectInfo.name} onChange={(e: any) => handleChange(e, 'projectInfo')} />
            <InputField label="Localização" name="location" type="text" value={projectInfo.location} onChange={(e: any) => handleChange(e, 'projectInfo')} />
            <InputField label="Data" name="date" type="date" value={projectInfo.date} onChange={(e: any) => handleChange(e, 'projectInfo')} />
            <InputField label="Área Total (m²)" name="areaTotal" type="number" min="0" value={buildingData.areaTotal} onChange={(e: any) => handleChange(e, 'buildingData')} validation={fieldValidation.areaTotal}/>
            <InputField label="Nome do Proprietário" name="proprietario" type="text" value={projectInfo.proprietario} onChange={(e: any) => handleChange(e, 'projectInfo')} />
            <InputField label="Inscrição Imobiliária (Opcional)" name="inscricaoImobiliaria" type="text" value={projectInfo.inscricaoImobiliaria} onChange={(e: any) => handleChange(e, 'projectInfo')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <SelectField label="Método de Consumo" name="metodoConsumo" value={projectData.metodoConsumo} onChange={(e:any) => handleChange(e, 'projectData')}>
                <option value="perCapita">Por Pessoa (Residencial)</option>
                <option value="area">Por Área (Comercial)</option>
            </SelectField>
            {projectData.metodoConsumo === 'perCapita' ? (
                <InputField label="Consumo per Capita (L/dia)" name="consumoPerCapita" type="number" min="0" value={projectData.consumoPerCapita} onChange={(e: any) => handleChange(e, 'projectData')} />
            ) : (
                <InputField label="Consumo por Área (L/m²/dia)" name="consumoPorArea" type="number" min="0" value={projectData.consumoPorArea} onChange={(e: any) => handleChange(e, 'projectData')} />
            )}
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Dados da Edificação</h3>
        {renderBuildingForm()}
      </div>

       <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Responsável Técnico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Nome Completo" name="nome" type="text" value={engenheiro.nome} onChange={(e: any) => handleChange(e, 'engenheiro')} />
             <InputField label="CREA/CAU" name="crea" type="text" value={engenheiro.crea} placeholder="Ex: CREA-SP 123456/D" onChange={(e: any) => handleChange(e, 'engenheiro')} />
             <InputField label="Nº ART/RRT" name="art" type="text" value={engenheiro.art} onChange={(e: any) => handleChange(e, 'engenheiro')} />
             <InputField label="CPF" name="cpf" type="text" value={engenheiro.cpf} onChange={(e: any) => handleChange(e, 'engenheiro')} />
             <InputField label="Telefone" name="telefone" type="text" value={engenheiro.telefone} onChange={(e: any) => handleChange(e, 'engenheiro')} />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Controle de Versão do Memorial</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 dark:text-slate-400">
                <tr><th className="p-2">Versão</th><th className="p-2">Data</th><th className="p-2">Descrição</th><th className="p-2">Autor</th><th className="p-2">Ações</th></tr>
              </thead>
              <tbody>
                {projectInfo.memorialVersions.map((v, index) => (
                  <tr key={v.id} className="border-t dark:border-slate-700">
                    <td className="p-1"><input value={v.version} onChange={(e) => handleVersionChange(index, 'version', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded p-2 border border-transparent focus:border-primary-500 outline-none"/></td>
                    <td className="p-1"><input type="date" value={v.date} onChange={(e) => handleVersionChange(index, 'date', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded p-2 border border-transparent focus:border-primary-500 outline-none"/></td>
                    <td className="p-1"><input value={v.description} onChange={(e) => handleVersionChange(index, 'description', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded p-2 border border-transparent focus:border-primary-500 outline-none"/></td>
                    <td className="p-1"><input value={v.author} onChange={(e) => handleVersionChange(index, 'author', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded p-2 border border-transparent focus:border-primary-500 outline-none"/></td>
                    <td className="p-1"><button onClick={() => removeVersion(index)} className="px-3 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"><i className="fas fa-trash"></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        <button onClick={addVersion} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><i className="fas fa-plus"></i> Adicionar Versão</button>
      </div>
      
       <div>
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Logo da Empresa (Opcional)</h3>
        <div className="flex items-center space-x-4">
          <label className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg cursor-pointer transition">
            <i className="fas fa-upload mr-2"></i> Selecionar Logo
            <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
          </label>
          {customLogo && (
            <div className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <img src={customLogo} alt="Logo" className="w-12 h-12 object-contain border rounded" />
              <button onClick={() => onStateChange({ customLogo: null })} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
            </div>
          )}
        </div>
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