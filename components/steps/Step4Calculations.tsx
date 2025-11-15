import React, { useState, useEffect } from 'react';
import { Module, ProjectState, Trecho, PecaRecalque, EsgotoItem, AreaPluvial, TrechoGas, Caminho, RamalVentilacao, CaminhoGas, ComplianceItem, ColetorPluvial, AparelhoConsumo, Bomba, Aquecedor, PecaConexao } from '../../types';
import { calculateModule } from '../../services/calculationService';
import { buildingTypes, CONEXOES_AGUA_DB, APARELHOS_SANITARIOS_UHC, APARELHOS_PRESSAO_MINIMA, MANNING_COEFFICIENTS, TANQUES_COMERCIAIS, HIDROMETROS_DB, CHECKLIST_ITEMS, APARELHOS_DESCARGA_DB, APARELHOS_PESOS } from '../../constants';
import { calculateDemandaReuso } from '../../services/utils';


interface Step4Props {
  state: ProjectState;
  onStateChange: (updates: Partial<ProjectState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  enabledModules: Module[];
}

// Helper Components
const Input = ({ label, name, value, onChange, type = 'number', step = 'any', min = 0, className = "" }: any) => (
    <div className={`relative ${className}`}>
        <label className="absolute -top-2.5 left-2 px-1 bg-white dark:bg-slate-800 text-xs text-primary-600 dark:text-primary-400">{label}</label>
        <input {...{ name, value, onChange, type, step, min }} className="w-full px-3 py-2 bg-transparent border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 transition text-slate-900 dark:text-slate-100" />
    </div>
);
const Select = ({ label, name, value, onChange, children, className = "" }: any) => (
    <div className={`relative ${className}`}>
        <label className="absolute -top-2.5 left-2 px-1 bg-white dark:bg-slate-800 text-xs text-primary-600 dark:text-primary-400">{label}</label>
        <select {...{ name, value, onChange }} className="w-full px-3 py-2 bg-transparent border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 transition appearance-none text-slate-900 dark:text-slate-100">
            {children}
        </select>
    </div>
);
const Checkbox = ({ label, name, checked, onChange }: any) => (
    <label className="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500" />
        <span className="text-sm">{label}</span>
    </label>
);
const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
        <h4 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">{title}</h4>
        {children}
    </div>
);
const ActionButton: React.FC<{ onClick: () => void, children: React.ReactNode, variant?: 'add' | 'remove' | 'default' }> = ({ onClick, children, variant = 'add' }) => {
    let variantClasses = '';
    switch(variant) {
        case 'add': variantClasses = "bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900/50 dark:text-primary-200 dark:hover:bg-primary-900"; break;
        case 'remove': variantClasses = "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900"; break;
        default: variantClasses = "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600";
    }
    return <button type="button" onClick={onClick} className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition ${variantClasses}`}>{children}</button>;
};

const Modal: React.FC<{ title: string, onClose: () => void, children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4 dark:border-slate-700">
                <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">{title}</h3>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <div className="overflow-y-auto flex-grow">{children}</div>
        </div>
    </div>
);

const ConexoesModal: React.FC<{
  trecho: Trecho;
  onSave: (conexoes: PecaConexao[]) => void;
  onClose: () => void;
}> = ({ trecho, onSave, onClose }) => {
    const [localConexoes, setLocalConexoes] = useState<PecaConexao[]>([]);

    useEffect(() => {
        setLocalConexoes(JSON.parse(JSON.stringify(trecho.conexoes || [])));
    }, [trecho]);


    const handleQtyChange = (nomePeca: string, quantidade: number) => {
        setLocalConexoes(prev => {
            const newConexoes = [...prev];
            const existing = newConexoes.find(p => p.nome === nomePeca);
            if (existing) {
                existing.quantidade = quantidade;
            } else if (quantidade > 0) {
                newConexoes.push({ nome: nomePeca, quantidade });
            }
            return newConexoes.filter(p => p.quantidade > 0);
        });
    };
    
    const getQty = (nomePeca: string) => localConexoes.find(p => p.nome === nomePeca)?.quantidade || 0;

    return (
        <Modal title={`Editar Conexões do Trecho: ${trecho.descricao}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(CONEXOES_AGUA_DB).map(nomePeca => (
                    <div key={nomePeca} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <label className="text-sm font-medium">{nomePeca}</label>
                        <Input 
                            label="Qtd" 
                            type="number" 
                            min="0"
                            value={getQty(nomePeca)}
                            onChange={(e: any) => handleQtyChange(nomePeca, parseInt(e.target.value, 10) || 0)}
                            className="w-24"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t dark:border-slate-700">
                <button onClick={onClose} className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button onClick={() => onSave(localConexoes)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">Salvar</button>
            </div>
        </Modal>
    );
};

const AparelhosModal: React.FC<{
  trecho: Trecho;
  onSave: (aparelhos: AparelhoConsumo[]) => void;
  onClose: () => void;
}> = ({ trecho, onSave, onClose }) => {
    const [localAparelhos, setLocalAparelhos] = useState<AparelhoConsumo[]>([]);

    useEffect(() => {
        setLocalAparelhos(JSON.parse(JSON.stringify(trecho.aparelhos || [])));
    }, [trecho]);

    const handleQtyChange = (nomeAparelho: string, quantidade: number) => {
        setLocalAparelhos(prev => {
            const newAparelhos = [...prev];
            const existing = newAparelhos.find(p => p.nome === nomeAparelho);
            if (existing) {
                existing.quantidade = quantidade;
            } else if (quantidade > 0) {
                newAparelhos.push({ nome: nomeAparelho, quantidade });
            }
            return newAparelhos.filter(p => p.quantidade > 0);
        });
    };
    
    const getQty = (nomeAparelho: string) => localAparelhos.find(p => p.nome === nomeAparelho)?.quantidade || 0;

    return (
        <Modal title={`Editar Aparelhos do Trecho: ${trecho.descricao}`} onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(APARELHOS_PESOS).map(([nomeAparelho, peso]) => (
                    <div key={nomeAparelho} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <label className="text-sm font-medium">{nomeAparelho} <span className="text-xs text-slate-400">({peso})</span></label>
                        <Input 
                            label="Qtd" 
                            type="number" 
                            min="0"
                            value={getQty(nomeAparelho)}
                            onChange={(e: any) => handleQtyChange(nomeAparelho, parseInt(e.target.value, 10) || 0)}
                            className="w-24"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t dark:border-slate-700">
                <button onClick={onClose} className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button onClick={() => onSave(localAparelhos)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">Salvar</button>
            </div>
        </Modal>
    );
};


const CompliancePanel: React.FC<{ state: ProjectState, onClose: () => void }> = ({ state, onClose }) => {
    const checkStatus = (check: (state: ProjectState) => boolean | undefined): ComplianceItem['status'] => {
        try {
            const result = check(state);
            if (result === undefined || result === null) return 'na';
            return result ? 'atendido' : 'pendente';
        } catch (error) {
            return 'na';
        }
    };

    const allChecks: ComplianceItem[] = Object.entries(CHECKLIST_ITEMS).flatMap(([normaKey, items]) => 
        items.map(item => {
            const status = checkStatus(item.check as any);
            let justificativa = '';
            if (status === 'atendido') justificativa = 'Parâmetro verificado e em conformidade.';
            else if (status === 'pendente') justificativa = 'Parâmetro fora dos limites normativos. Verifique os dados de entrada.';
            else justificativa = 'Não aplicável ou dados insuficientes para verificação.';

            return {
                id: item.id,
                norma: normaKey,
                item: item.item,
                status: status,
                justificativa,
            };
        })
    );

    const getStatusIcon = (status: ComplianceItem['status']) => {
        switch (status) {
            case 'atendido': return <i className="fas fa-check-circle text-emerald-500"></i>;
            case 'pendente': return <i className="fas fa-exclamation-triangle text-amber-500"></i>;
            case 'na': return <i className="fas fa-minus-circle text-slate-400"></i>;
        }
    };

    return (
        <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform translate-x-0 p-4 flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4 dark:border-slate-700">
                <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">Checklist Normativo</h3>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <div className="overflow-y-auto flex-grow">
                {allChecks.map(check => (
                    <div key={check.id} className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="text-xl mt-1">{getStatusIcon(check.status)}</div>
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{check.item}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{check.justificativa}</p>
                                <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded mt-1 inline-block">{check.norma}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const Step4Calculations: React.FC<Step4Props> = ({ state, onStateChange, nextStep, prevStep, enabledModules }) => {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(0);
  const [showCompliancePanel, setShowCompliancePanel] = useState(false);
  const [editingAparelhos, setEditingAparelhos] = useState<{ moduleName: 'aguaFria' | 'aguaQuente', cIndex: number, tIndex: number } | null>(null);
  const [editingConexoes, setEditingConexoes] = useState<{ moduleName: 'aguaFria' | 'aguaQuente', cIndex: number, tIndex: number } | null>(null);
  const [editingBomba, setEditingBomba] = useState<Bomba | null>(null);
  const [editingAquecedor, setEditingAquecedor] = useState<Aquecedor | null>(null);

  const handleCalculate = (index: number) => {
      const moduleToCalculate = enabledModules[index];
      if (!moduleToCalculate) return;
      const buildingTypeName = buildingTypes[state.selectedBuildingType].name;
      const updatedModule = calculateModule(moduleToCalculate, state, buildingTypeName);
      
      const newModules = state.modules.map(m => m.name === updatedModule.name ? updatedModule : m);
      onStateChange({ modules: newModules });
  };

  useEffect(() => {
    if (selectedModuleIndex >= enabledModules.length) {
        setSelectedModuleIndex(enabledModules.length > 0 ? 0 : -1);
    }
  }, [enabledModules, selectedModuleIndex]);

  useEffect(() => {
    if(selectedModuleIndex >= 0 && selectedModuleIndex < enabledModules.length) {
        handleCalculate(selectedModuleIndex);
    }
  }, [state, selectedModuleIndex, enabledModules]);


  const handleStatePathChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, path: (string | number)[]) => {
      const { name, value, type } = e.target;
      let val: string | number | boolean;
      if (type === 'checkbox') {
        val = (e.target as HTMLInputElement).checked;
      } else if (type === 'number' && value !== '') {
        val = parseFloat(value);
      } else {
        val = value;
      }

      const newState = JSON.parse(JSON.stringify(state)); // Deep copy
      let current: any = newState;
      for (let i = 0; i < path.length; i++) {
          if (i === path.length - 1) {
              current[path[i]] = { ...current[path[i]], [name]: val };
          } else {
              current = current[path[i]];
          }
      }
      onStateChange(newState);
  };
  
  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, path: (string | number)[]) => {
      const { name, value, type } = e.target;
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' && value !== '' ? parseFloat(value) : value);

      const newState = JSON.parse(JSON.stringify(state)); // Deep copy
      let current: any = newState;
      let finalKey = path[path.length - 1];
      for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
      }
      current[finalKey][name] = val;
      onStateChange(newState);
  };
  
  const addArrayItem = (path: (string|number)[], newItem: any) => {
      const newState = JSON.parse(JSON.stringify(state));
      let current = newState;
      for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
      }
      current[path[path.length - 1]].push(newItem);
      onStateChange(newState);
  };
  
  const removeArrayItem = (path: (string|number)[], index: number) => {
      const newState = JSON.parse(JSON.stringify(state));
      let current = newState;
      for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
      }
      current[path[path.length - 1]].splice(index, 1);
      onStateChange(newState);
  };

  const handleSaveConexoes = (newConexoes: PecaConexao[]) => {
    if (!editingConexoes) return;
    const { moduleName, cIndex, tIndex } = editingConexoes;
    
    const newState = JSON.parse(JSON.stringify(state));
    const trechoToUpdate = newState[moduleName].caminhos[cIndex].trechos[tIndex];
    trechoToUpdate.conexoes = newConexoes.filter(p => p.quantidade > 0);
    onStateChange(newState);

    setEditingConexoes(null);
  };
  
  const handleSaveAparelhos = (newAparelhos: AparelhoConsumo[]) => {
    if (!editingAparelhos) return;
    const { moduleName, cIndex, tIndex } = editingAparelhos;
    
    const newState = JSON.parse(JSON.stringify(state));
    const trechoToUpdate = newState[moduleName].caminhos[cIndex].trechos[tIndex];
    trechoToUpdate.aparelhos = newAparelhos;
    onStateChange(newState);

    setEditingAparelhos(null);
  };
  
  const selectedModule = enabledModules[selectedModuleIndex];
  
  const fNum = (num: number | undefined | null, p = 2) => {
      if (num === undefined || num === null || isNaN(num)) return "-";
      return num.toLocaleString("pt-BR", { minimumFractionDigits: p, maximumFractionDigits: p });
  };
  
  const handlePrev = () => {
    if (selectedModuleIndex > 0) {
        setSelectedModuleIndex(selectedModuleIndex - 1);
    } else {
        prevStep();
    }
  };

  const handleNext = () => {
      if (selectedModuleIndex < enabledModules.length - 1) {
          setSelectedModuleIndex(selectedModuleIndex + 1);
      } else {
          nextStep();
      }
  };


  const renderModuleForm = () => {
    if (!selectedModule) return <p>Selecione um módulo para começar.</p>;
    
    switch(selectedModule.name) {
        case 'Água Fria':
            const volSupCalc = parseFloat(String(selectedModule.results.find(r => r.label.includes('Calculado Superior'))?.value).split(' ')[0] ?? '0');
            const volInfCalc = parseFloat(String(selectedModule.results.find(r => r.label.includes('Calculado Inferior'))?.value).split(' ')[0] ?? '0');
            
            return (
                 <div className="space-y-6">
                    <Section title="Consumo e Reservatórios">
                         <div className="grid md:grid-cols-4 gap-4">
                            <Input label="Consumo Per Capita (L/d)" name="consumoPerCapita" value={state.projectData.consumoPerCapita} onChange={(e:any) => handleStatePathChange(e, ['projectData'])} />
                            <Input label="Dias de Reserva" name="diasReserva" value={state.projectData.diasReserva} onChange={(e:any) => handleStatePathChange(e, ['projectData'])} />
                            <Input label="Reserva de Incêndio (L)" name="reservaIncendio" value={state.reservatorios.reservaIncendio} onChange={(e:any) => handleStatePathChange(e, ['reservatorios'])} />
                            <Input label="Nº Reserv. Superiores" name="numSuperiores" value={state.reservatorios.numSuperiores} onChange={(e:any) => handleStatePathChange(e, ['reservatorios'])} />
                            <Input label="Nº Reserv. Inferiores" name="numInferiores" value={state.reservatorios.numInferiores} onChange={(e:any) => handleStatePathChange(e, ['reservatorios'])} />
                            <Input label="% Volume Superior" name="percentualSuperior" type="number" step="5" min="0" max="100" value={state.reservatorios.percentualSuperior} onChange={(e:any) => handleStatePathChange(e, ['reservatorios'])} />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t dark:border-slate-700">
                           <Select label="Integração da RTI" name="integracaoIncendio" value={state.reservatorios.integracaoIncendio} onChange={(e: any) => handleStatePathChange(e, ['reservatorios'])}>
                                <option value="somar">Somar ao Volume de Consumo</option>
                                <option value="integrada">Integrada no Volume de Consumo</option>
                           </Select>
                           <Input label="% RTI no Reserv. Superior" name="percentualIncendioSuperior" type="number" step="5" min="0" max="100" value={state.reservatorios.percentualIncendioSuperior} onChange={(e: any) => handleStatePathChange(e, ['reservatorios'])} />
                        </div>
                        {volSupCalc > 0 && (
                            <div className="col-span-full mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">
                                <h5 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Seleção de Reservatório Comercial</h5>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm">Superior: Volume calculado <strong>{volSupCalc.toLocaleString('pt-BR')} L</strong></p>
                                        <Select label="Adotar Reservatório Superior" name="volumeSuperiorComercial" value={state.reservatorios.volumeSuperiorComercial} onChange={(e: any) => handleStatePathChange(e, ['reservatorios'])}>
                                            {TANQUES_COMERCIAIS.map(v => <option key={v} value={v}>{v} L</option>)}
                                        </Select>
                                    </div>
                                    {state.reservatorios.numInferiores > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm">Inferior: Volume calculado <strong>{volInfCalc.toLocaleString('pt-BR')} L</strong></p>
                                            <Select label="Adotar Reservatório Inferior" name="volumeInferiorComercial" value={state.reservatorios.volumeInferiorComercial} onChange={(e: any) => handleStatePathChange(e, ['reservatorios'])}>
                                                {TANQUES_COMERCIAIS.map(v => <option key={v} value={v}>{v} L</option>)}
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Section>
                    {state.reservatorios.numInferiores > 0 && (
                       <>
                        <Section title="Bombeamento">
                            <div className="grid md:grid-cols-4 gap-4 mb-4">
                                <Input label="Altura Sucção (m)" name="alturaSuccao" value={state.bombeamento.alturaSuccao} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Input label="Altura Recalque (m)" name="alturaRecalque" value={state.bombeamento.alturaRecalque} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Input label="Comp. Real (m)" name="comprimentoReal" value={state.bombeamento.comprimentoReal} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Input label="Horas Funcionamento/dia" name="horasFuncionamento" value={state.bombeamento.horasFuncionamento} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Input label="Rendimento (%)" name="rendimento" value={state.bombeamento.rendimento} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Input label="Temp. Água (°C)" name="temperaturaAgua" value={state.bombeamento.temperaturaAgua} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Input label="P. Atm. (mca)" name="pressaoAtmosferica" value={state.bombeamento.pressaoAtmosferica} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                                <Select label="Material Recalque" name="material" value={state.bombeamentoDetalhes.material} onChange={(e:any) => handleStatePathChange(e, ['bombeamentoDetalhes'])}>
                                    <option value="pvc">PVC</option>
                                    <option value="aco">Aço</option>
                                </Select>
                                <Input label="Diâmetro Recalque (mm)" name="diametro" value={state.bombeamentoDetalhes.diametro} onChange={(e:any) => handleStatePathChange(e, ['bombeamentoDetalhes'])} />
                            </div>
                            <h5 className="font-semibold text-md mb-2">Peças de Recalque</h5>
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {state.bombeamentoDetalhes.pecas.map((peca, index) => (
                                            <tr key={peca.id} className="align-top">
                                                <td className="p-1"><Select name="nome" value={peca.nome} onChange={(e: any) => handleArrayChange(e, ['bombeamentoDetalhes', 'pecas', index])} >{Object.keys(CONEXOES_AGUA_DB).map(p => <option key={p} value={p}>{p}</option>)}</Select></td>
                                                <td className="p-1"><Input label="Qtd" name="quantidade" value={peca.quantidade} onChange={(e:any) => handleArrayChange(e, ['bombeamentoDetalhes', 'pecas', index])} /></td>
                                                <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['bombeamentoDetalhes', 'pecas'], index)}><i className="fas fa-trash"></i></ActionButton></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <ActionButton onClick={() => addArrayItem(['bombeamentoDetalhes', 'pecas'], { id: Date.now(), nome: "Cotovelo 90°", quantidade: 1 })}><i className="fas fa-plus"></i> Adicionar Peça</ActionButton>
                        </Section>
                        {state.bombeamento.suggestedPumps && state.bombeamento.suggestedPumps.length > 0 && (
                            <Section title="Sugestões de Bombas Comerciais">
                                <p className="text-sm mb-2">Com base no ponto de operação (Q: {fNum(selectedModule.results.find(r=>r.label === 'Vazão da Bomba')?.value as number)} L/s, AMT: {fNum(selectedModule.results.find(r=>r.label === 'Altura Manométrica Total')?.value as number)} mca), estas são algumas opções:</p>
                                <div className="space-y-2">
                                    {state.bombeamento.suggestedPumps.map(pump => (
                                        <div key={pump.nome} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold">{pump.nome}</span>
                                                <span className="text-xs text-slate-500 block">Fabricante: {pump.fabricante}</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${pump.status.includes('OK') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{pump.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                        <Section title="Seleção de Bomba Comercial e Análise de Transiente Hidráulico">
                            <div className="grid md:grid-cols-2 gap-4">
                               <Select label="Modelo da Bomba" name="bombaSelecionada" value={state.bombeamento.bombaSelecionada} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])}>
                                    {state.bombasDB.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)}
                                </Select>
                               <Input label="Tempo Fechamento Válvula (s)" name="tempoFechamentoValvula" value={state.bombeamento.tempoFechamentoValvula} onChange={(e:any) => handleStatePathChange(e, ['bombeamento'])} />
                            </div>
                        </Section>
                       </>
                    )}
                    <Section title="Controle de Pressão (NBR 5626)">
                        {state.aguaFria.sugestaoVRP?.necessaria && (
                             <div className="p-4 bg-amber-50 dark:bg-amber-900/50 rounded-lg mb-4 border border-amber-300 dark:border-amber-700">
                                <h5 className="font-bold text-amber-800 dark:text-amber-200 flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i>Alerta de Pressão Estática</h5>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    Pressão estática calculada de <strong>{fNum(state.aguaFria.sugestaoVRP.pressaoEstaticaCalculada)} mca</strong> excede o limite de 40 mca.
                                    Recomenda-se instalar VRP na prumada, próximo ao <strong>pavimento {state.aguaFria.sugestaoVRP.pavimentoSugerido}</strong>.
                                </p>
                            </div>
                        )}
                        <Checkbox label="Utilizar VRP (para edifícios altos)" name="habilitado" checked={state.aguaFria.vrp.habilitado} onChange={(e:any) => handleStatePathChange(e, ['aguaFria', 'vrp'])} />
                        {state.aguaFria.vrp.habilitado && (
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <Input label="Pressão de Entrada (mca)" name="pressaoMontante" value={state.aguaFria.vrp.pressaoMontante} onChange={(e:any) => handleStatePathChange(e, ['aguaFria', 'vrp'])} />
                                <Input label="Pressão de Saída Desejada (mca)" name="pressaoJusanteDesejada" value={state.aguaFria.vrp.pressaoJusanteDesejada} onChange={(e:any) => handleStatePathChange(e, ['aguaFria', 'vrp'])} />
                            </div>
                        )}
                    </Section>
                     <Section title="Alimentador Predial (Ramal de Entrada)">
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input label="Comprimento (m)" name="comprimento" value={state.aguaFria.alimentadorPredial.comprimento} onChange={(e:any) => handleStatePathChange(e, ['aguaFria', 'alimentadorPredial'])} />
                             <Select label="Material" name="material" value={state.aguaFria.alimentadorPredial.material} onChange={(e:any) => handleStatePathChange(e, ['aguaFria', 'alimentadorPredial'])}>
                                <option value="pvc">PVC</option><option value="pead">PEAD</option>
                            </Select>
                            <Input label="Velocidade Máx. (m/s)" name="velocidadeMaxima" value={state.aguaFria.alimentadorPredial.velocidadeMaxima} onChange={(e:any) => handleStatePathChange(e, ['aguaFria', 'alimentadorPredial'])} />
                        </div>
                    </Section>
                    <Section title="Dimensionamento de Perda de Carga">
                         <div className="grid md:grid-cols-3 gap-4 mb-4">
                           <Select label="Material Tubulação" name="material" value={state.aguaFria.material} onChange={(e:any) => handleStatePathChange(e, ['aguaFria'])}>
                                <option value="pvc">PVC</option>
                                <option value="ppr">PPR</option>
                            </Select>
                             <Select label="Método de Cálculo" name="metodoCalculo" value={state.aguaFria.metodoCalculo} onChange={(e:any) => handleStatePathChange(e, ['aguaFria'])}>
                                <option value="hazen-williams">Hazen-Williams</option>
                                <option value="darcy-weisbach">Darcy-Weisbach</option>
                            </Select>
                            {state.aguaFria.metodoCalculo === 'hazen-williams' ?
                                <Input label="Coeficiente HW" name="coeficienteHW" value={state.aguaFria.coeficienteHW} onChange={(e:any) => handleStatePathChange(e, ['aguaFria'])} /> :
                                <Input label="Rugosidade (m)" name="rugosidade" value={state.aguaFria.rugosidade} onChange={(e:any) => handleStatePathChange(e, ['aguaFria'])} />
                            }
                        </div>
                        {state.aguaFria.caminhos.map((caminho, cIndex) => (
                            <div key={caminho.id} className="p-3 border rounded-md mb-4 bg-slate-50 dark:bg-slate-800/50">
                               <div className="flex justify-between items-center mb-2 gap-2">
                                    <Input label="Nome do Ponto Desfavorável" className="flex-grow" type="text" name="nome" value={caminho.nome} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex])} />
                                    <Input label="Pressão Inicial (mca)" className="w-40" name="pressaoInicial" value={caminho.pressaoInicial} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex])} />
                                    {state.aguaFria.caminhos.length > 1 && <ActionButton variant="remove" onClick={() => removeArrayItem(['aguaFria', 'caminhos'], cIndex)}><i className="fas fa-trash"></i> Remover</ActionButton>}
                               </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {caminho.trechos.map((trecho, tIndex) => (
                                            <tr key={trecho.id} className="align-top">
                                                <td className="p-1 w-40"><Input label="Descrição" type="text" name="descricao" value={trecho.descricao} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-32"><ActionButton variant="default" onClick={() => setEditingAparelhos({ moduleName: 'aguaFria', cIndex, tIndex })}>Aparelhos ({fNum(trecho.somaPesos, 1)})</ActionButton></td>
                                                <td className="p-1 w-24"><Input label="Comp(m)" name="comprimentoReal" value={trecho.comprimentoReal} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-24"><Input label="H inicial(m)" name="alturaInicial" value={trecho.alturaInicial} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-24"><Input label="H final(m)" name="alturaFinal" value={trecho.alturaFinal} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-32">
                                                    <ActionButton variant="default" onClick={() => setEditingConexoes({ moduleName: 'aguaFria', cIndex, tIndex })}>
                                                        Conexões ({trecho.conexoes?.reduce((a,c) => a + c.quantidade, 0) || 0})
                                                    </ActionButton>
                                                </td>
                                                <td className="p-1 w-40"><Select label="Aparelho Final" name="aparelho" value={trecho.aparelho} onChange={(e:any) => handleArrayChange(e, ['aguaFria', 'caminhos', cIndex, 'trechos', tIndex])}>{Object.keys(APARELHOS_PRESSAO_MINIMA).map(ap => <option key={ap} value={ap}>{ap}</option>)}</Select></td>
                                                <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['aguaFria', 'caminhos', cIndex, 'trechos'], tIndex)}><i className="fas fa-trash"></i></ActionButton></td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                <ActionButton onClick={() => addArrayItem(['aguaFria', 'caminhos', cIndex, 'trechos'], {id: Date.now(), descricao: "Novo Trecho", somaPesos: 0, aparelhos: [], comprimentoReal: 1, alturaInicial: 0, alturaFinal: 0, conexoes: [], aparelho: "Chuveiro"})}><i className="fas fa-plus"></i> Adicionar Trecho</ActionButton>
                                {caminho.sugestoesOtimizacao && caminho.sugestoesOtimizacao.length > 0 && (
                                    <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-900/50 rounded-lg">
                                        <h5 className="font-semibold text-sky-800 dark:text-sky-200 text-sm mb-2"><i className="fas fa-lightbulb mr-2"></i>Sugestões de Otimização de Diâmetro</h5>
                                        <ul className="list-disc list-inside text-sm space-y-1 text-sky-700 dark:text-sky-300">
                                            {caminho.sugestoesOtimizacao.map(s => (
                                                <li key={s.trechoId}><strong>{s.descricao}:</strong> Sugerido DN {s.novoDiametro}mm ({s.justificativa}).</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                         <ActionButton onClick={() => addArrayItem(['aguaFria', 'caminhos'], { id: Date.now(), nome: `Novo Ponto ${state.aguaFria.caminhos.length + 1}`, pressaoInicial: 0, trechos: [] })}><i className="fas fa-plus"></i> Adicionar Ponto Desfavorável</ActionButton>
                    </Section>
                 </div>
            );
         case 'Água Quente':
              return (
                <div className="space-y-6">
                    <Section title="Aquecimento">
                        <div className="grid md:grid-cols-4 gap-4">
                            <Select label="Tipo de Sistema" name="tipoSistema" value={state.aguaQuente.tipoSistema} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente'])}>
                                <option value="individual">Individual</option>
                                <option value="central">Central</option>
                            </Select>
                            <Input label="Temp. Água Fria (°C)" name="tempAguaFria" value={state.aguaQuente.tempAguaFria} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente'])} />
                            <Input label="Temp. Água Quente (°C)" name="tempAguaQuente" value={state.aguaQuente.tempAguaQuente} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente'])} />
                            <Input label="Tempo Aquecimento (h)" name="tempoAquecimento" value={state.aguaQuente.tempoAquecimento} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente'])} />
                        </div>
                    </Section>
                    {state.aguaQuente.tipoSistema === 'central' && (
                        <>
                            <Section title="Sistema de Recirculação">
                                <Checkbox label="Habilitar sistema de recirculação" name="habilitado" checked={state.aguaQuente.recirculacao.habilitado} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'recirculacao'])} />
                                {state.aguaQuente.recirculacao.habilitado && (
                                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                                        <Input label="Comprimento Anel (m)" name="comprimentoAnel" value={state.aguaQuente.recirculacao.comprimentoAnel} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'recirculacao'])} />
                                        <Input label="Diâmetro Anel (mm)" name="diametro" value={state.aguaQuente.recirculacao.diametro} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'recirculacao'])} />
                                        <Select label="Material" name="material" value={state.aguaQuente.recirculacao.material} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'recirculacao'])}>
                                            <option value="cpvc">CPVC</option><option value="ppr">PPR</option><option value="cobre">Cobre</option>
                                        </Select>
                                    </div>
                                )}
                            </Section>
                            <Section title="Vaso de Expansão Térmica">
                                <Checkbox label="Habilitar vaso de expansão" name="habilitado" checked={state.aguaQuente.vasoExpansao.habilitado} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'vasoExpansao'])} />
                                {state.aguaQuente.vasoExpansao.habilitado && (
                                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                                        <Input label="Pressão Mínima (bar)" name="pressaoMinimaRede" value={state.aguaQuente.vasoExpansao.pressaoMinimaRede} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'vasoExpansao'])} />
                                        <Input label="Pressão Máxima (bar)" name="pressaoMaximaRede" value={state.aguaQuente.vasoExpansao.pressaoMaximaRede} onChange={(e: any) => handleStatePathChange(e, ['aguaQuente', 'vasoExpansao'])} />
                                    </div>
                                )}
                            </Section>
                        </>
                    )}
                    <Section title="Dimensionamento de Perda de Carga (AQ)">
                         {state.aguaQuente.caminhos.map((caminho, cIndex) => (
                            <div key={caminho.id} className="p-3 border rounded-md mb-4 bg-slate-50 dark:bg-slate-800/50">
                               <div className="flex justify-between items-center mb-2 gap-2">
                                   <Input label="Nome do Ponto Desfavorável" className="flex-grow" type="text" name="nome" value={caminho.nome} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex])} />
                                   <Input label="Pressão Inicial (mca)" className="w-40" name="pressaoInicial" value={caminho.pressaoInicial} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex])} />
                                   {state.aguaQuente.caminhos.length > 1 && <ActionButton variant="remove" onClick={() => removeArrayItem(['aguaQuente', 'caminhos'], cIndex)}><i className="fas fa-trash"></i> Remover</ActionButton>}
                               </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {caminho.trechos.map((trecho, tIndex) => (
                                            <tr key={trecho.id} className="align-top">
                                                <td className="p-1 w-40"><Input label="Descrição" type="text" name="descricao" value={trecho.descricao} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-32"><ActionButton variant="default" onClick={() => setEditingAparelhos({ moduleName: 'aguaQuente', cIndex, tIndex })}>Aparelhos ({fNum(trecho.somaPesos, 1)})</ActionButton></td>
                                                <td className="p-1 w-24"><Input label="Comp(m)" name="comprimentoReal" value={trecho.comprimentoReal} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-24"><Input label="H inicial(m)" name="alturaInicial" value={trecho.alturaInicial} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-24"><Input label="H final(m)" name="alturaFinal" value={trecho.alturaFinal} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-32">
                                                    <ActionButton variant="default" onClick={() => setEditingConexoes({ moduleName: 'aguaQuente', cIndex, tIndex })}>
                                                        Conexões ({trecho.conexoes?.reduce((a,c) => a + c.quantidade, 0) || 0})
                                                    </ActionButton>
                                                </td>
                                                <td className="p-1 w-40"><Select label="Aparelho Final" name="aparelho" value={trecho.aparelho} onChange={(e:any) => handleArrayChange(e, ['aguaQuente', 'caminhos', cIndex, 'trechos', tIndex])}>{Object.keys(APARELHOS_PRESSAO_MINIMA).map(ap => <option key={ap} value={ap}>{ap}</option>)}</Select></td>
                                                <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['aguaQuente', 'caminhos', cIndex, 'trechos'], tIndex)}><i className="fas fa-trash"></i></ActionButton></td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                <ActionButton onClick={() => addArrayItem(['aguaQuente', 'caminhos', cIndex, 'trechos'], {id: Date.now(), descricao: "Novo Trecho", somaPesos: 0, aparelhos: [], comprimentoReal: 1, alturaInicial: 0, alturaFinal: 0, conexoes: [], aparelho: "Chuveiro"})}><i className="fas fa-plus"></i> Adicionar Trecho</ActionButton>
                            </div>
                        ))}
                        <ActionButton onClick={() => addArrayItem(['aguaQuente', 'caminhos'], { id: Date.now(), nome: `Novo Ponto ${state.aguaQuente.caminhos.length + 1}`, pressaoInicial: 0, trechos: [] })}><i className="fas fa-plus"></i> Adicionar Ponto Desfavorável</ActionButton>
                    </Section>
                </div>
            );
         case 'Esgoto Sanitário':
            return (
                <div className="space-y-6">
                    <Section title="Parâmetros Gerais e Coletor Predial">
                        <div className="grid md:grid-cols-4 gap-4">
                            <Select label="Método de Cálculo" name="metodoCalculo" value={state.esgotoSanitario.metodoCalculo} onChange={(e:any) => handleStatePathChange(e, ['esgotoSanitario'])}>
                                <option value="uhc">UHC (Residencial)</option>
                                <option value="probabilistico">Probabilístico (Comercial)</option>
                            </Select>
                            <Input label="Nº de Tubos de Queda" name="numTubosQueda" value={state.esgotoSanitario.numTubosQueda} onChange={(e: any) => handleStatePathChange(e, ['esgotoSanitario'])} />
                            <Input label="Nº Colunas Ventilação" name="numColunasVentilacao" value={state.esgotoSanitario.numColunasVentilacao} onChange={(e: any) => handleStatePathChange(e, ['esgotoSanitario'])} />
                            <Input label="Comp. Coletor Predial (m)" name="comprimentoColetor" value={state.esgotoSanitario.comprimentoColetor} onChange={(e: any) => handleStatePathChange(e, ['esgotoSanitario'])} />
                            <Input label="Nº Curvas 90° no Coletor" name="numCurvas90" value={state.esgotoSanitario.numCurvas90} onChange={(e: any) => handleStatePathChange(e, ['esgotoSanitario'])} />
                            <Input label="Nº Curvas 45° no Coletor" name="numCurvas45" value={state.esgotoSanitario.numCurvas45} onChange={(e: any) => handleStatePathChange(e, ['esgotoSanitario'])} />
                        </div>
                    </Section>
                    <Section title="Aparelhos por Unidade">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr><th className="text-left p-1">Aparelho ({state.esgotoSanitario.metodoCalculo === 'uhc' ? 'UHC' : 'UD'})</th><th className="text-left p-1">Quantidade</th><th></th></tr></thead>
                                <tbody>
                                    {state.esgotoItens.map((item, index) => (
                                        <tr key={index}>
                                            <td className="p-1">
                                                <Select name="aparelho" value={item.aparelho} onChange={(e: any) => handleArrayChange(e, ['esgotoItens', index])}>
                                                    {Object.entries(state.esgotoSanitario.metodoCalculo === 'uhc' ? APARELHOS_SANITARIOS_UHC : APARELHOS_DESCARGA_DB).map(([nome, val]) => <option key={nome} value={nome}>{`${nome} (${val})`}</option>)}
                                                </Select>
                                            </td>
                                            <td className="p-1"><Input label="Qtd" name="quantidade" value={item.quantidade} onChange={(e:any) => handleArrayChange(e, ['esgotoItens', index])} /></td>
                                            <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['esgotoItens'], index)}><i className="fas fa-trash"></i></ActionButton></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ActionButton onClick={() => addArrayItem(['esgotoItens'], { aparelho: 'Lavatório', quantidade: 1 })}><i className="fas fa-plus"></i> Adicionar Aparelho</ActionButton>
                    </Section>
                    <Section title="Ramais de Ventilação">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                               <tbody>
                                 {state.esgotoSanitario.ramaisVentilacao.map((ramal, index) => (
                                     <tr key={ramal.id}>
                                         <td className="p-1"><Input label="Descrição" type="text" name="descricao" value={ramal.descricao} onChange={(e:any) => handleArrayChange(e, ['esgotoSanitario', 'ramaisVentilacao', index])} /></td>
                                         <td className="p-1"><Input label="UHC Atendido" name="uhc" value={ramal.uhc} onChange={(e:any) => handleArrayChange(e, ['esgotoSanitario', 'ramaisVentilacao', index])} /></td>
                                         <td className="p-1"><Input label="Comprimento (m)" name="comprimento" value={ramal.comprimento} onChange={(e:any) => handleArrayChange(e, ['esgotoSanitario', 'ramaisVentilacao', index])} /></td>
                                         <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['esgotoSanitario', 'ramaisVentilacao'], index)}><i className="fas fa-trash"></i></ActionButton></td>
                                     </tr>
                                 ))}
                               </tbody>
                            </table>
                         </div>
                         <ActionButton onClick={() => addArrayItem(['esgotoSanitario', 'ramaisVentilacao'], { id: Date.now(), descricao: "Novo Ramal", uhc: 0, comprimento: 1 })}><i className="fas fa-plus"></i> Adicionar Ramal</ActionButton>
                    </Section>
                    <Section title="Estação Elevatória de Esgoto">
                        <Checkbox label="Habilitar elevatória de esgoto" name="habilitado" checked={state.esgotoSanitario.elevatoria?.habilitado} onChange={(e: any) => handleStatePathChange(e, ['esgotoSanitario', 'elevatoria'])} />
                        {state.esgotoSanitario.elevatoria?.habilitado && (
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <Input label="Altura Recalque (m)" name="alturaRecalque" value={state.esgotoSanitario.elevatoria.alturaRecalque} onChange={(e:any) => handleStatePathChange(e, ['esgotoSanitario', 'elevatoria'])} />
                                <Input label="Comp. Recalque (m)" name="comprimentoRecalque" value={state.esgotoSanitario.elevatoria.comprimentoRecalque} onChange={(e:any) => handleStatePathChange(e, ['esgotoSanitario', 'elevatoria'])} />
                                <Select label="Material Recalque" name="materialRecalque" value={state.esgotoSanitario.elevatoria.materialRecalque} onChange={(e:any) => handleStatePathChange(e, ['esgotoSanitario', 'elevatoria'])}>
                                    <option value="pvc">PVC</option><option value="ferro">Ferro Fundido</option>
                                </Select>
                            </div>
                        )}
                    </Section>
                    <Section title="Tratamento Individual">
                        <Checkbox label="Habilitar tratamento" name="habilitado" checked={state.esgotoTratamento.habilitado} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                        {state.esgotoTratamento.habilitado && (
                            <div className="grid md:grid-cols-4 gap-4 mt-4">
                                <Input label="Contribuição Esgoto (L/p.dia)" name="contribuicaoEsgoto" value={state.esgotoTratamento.contribuicaoEsgoto} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                                <Input label="Intervalo Limpeza (anos)" name="intervaloLimpeza" value={state.esgotoTratamento.intervaloLimpeza} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                                <Input label="Taxa Infiltração (L/m²/dia)" name="taxaInfiltracao" value={state.esgotoTratamento.taxaInfiltracao} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                                <Select label="Disposição Final" name="tipoDisposicaoFinal" value={state.esgotoTratamento.tipoDisposicaoFinal} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])}>
                                    <option value="sumidouro">Sumidouro</option><option value="valaInfiltracao">Vala de Infiltração</option>
                                </Select>
                                <Input label="Nº de Fossas" name="numFossas" value={state.esgotoTratamento.numFossas} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                                <Input label="Nº de Filtros" name="numFiltros" value={state.esgotoTratamento.numFiltros} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                                <Input label="Nº de Sumidouros" name="numSumidouros" value={state.esgotoTratamento.numSumidouros} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />
                                {state.esgotoTratamento.tipoDisposicaoFinal === 'valaInfiltracao' && <Input label="Largura da Vala (m)" name="valaLargura" value={state.esgotoTratamento.valaLargura} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento'])} />}
                                <div className="md:col-span-1 flex items-center">
                                    <Checkbox label="Leito de Secagem" name="habilitado" checked={state.esgotoTratamento.leitoSecagem.habilitado} onChange={(e:any) => handleStatePathChange(e, ['esgotoTratamento', 'leitoSecagem'])} />
                                </div>
                            </div>
                        )}
                    </Section>
                </div>
            );
        case 'Esgoto Gorduroso':
            const isMultifamiliar = buildingTypes[state.selectedBuildingType].name === 'Multifamiliar';
            const isResidencial = ['Unifamiliar', 'Multifamiliar'].includes(buildingTypes[state.selectedBuildingType].name);

            return (
                <Section title="Caixa de Gordura">
                    {isMultifamiliar && (
                        <div className="mb-4">
                            <Select 
                                label="Tipo de Instalação" 
                                name="tipoInstalacao" 
                                value={state.gorduraData.tipoInstalacao} 
                                onChange={(e: any) => handleStatePathChange(e, ['gorduraData'])}
                            >
                                <option value="central">Central (uma caixa para o prédio)</option>
                                <option value="individual">Individual (uma caixa por apartamento)</option>
                            </Select>
                        </div>
                    )}

                    {isResidencial ? (
                        state.gorduraData.tipoInstalacao === 'individual' && isMultifamiliar ? (
                             <p className="text-sm p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                Para a instalação individual, será dimensionada uma Caixa de Gordura Simples (CS) com volume de 18L para cada apartamento, conforme a NBR 8160.
                             </p>
                        ) : (
                             <Input 
                                label="Nº Total de Cozinhas" 
                                name="numeroCozinhas" 
                                value={state.gorduraData.numeroCozinhas} 
                                onChange={(e: any) => handleStatePathChange(e, ['gorduraData'])} 
                                />
                        )
                    ) : ( // Comercial/Industrial
                        <Input 
                            label="Nº de Refeições/dia" 
                            name="numeroRefeicoes" 
                            value={state.gorduraData.numeroRefeicoes} 
                            onChange={(e: any) => handleStatePathChange(e, ['gorduraData'])} 
                        />
                    )}

                    <div className="mt-4">
                        <Input label="Nº Tubos Queda Gordura" name="numTubosQuedaGordura" value={state.gorduraData.numTubosQuedaGordura} onChange={(e: any) => handleStatePathChange(e, ['gorduraData'])} />
                    </div>
                </Section>
            );
        case 'Drenagem Pluvial':
            return (
                 <div className="space-y-6">
                    <Section title="Parâmetros de Chuva e Calhas">
                         <div className="grid md:grid-cols-3 gap-4">
                            <Select label="Período de Retorno (Anos)" name="periodoRetorno" value={state.drenagem.periodoRetorno} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])}>
                                <option value="2">2 anos</option><option value="5">5 anos</option><option value="10">10 anos</option><option value="25">25 anos</option>
                            </Select>
                            <div>
                                <Input label="Intensidade (mm/h)" name="intensidade" value={state.drenagem.intensidade} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                                <p className="text-xs text-slate-500 mt-1">Ajuste a intensidade conforme o período de retorno para sua cidade.</p>
                            </div>
                            <Select label="Tipo de Calha" name="tipoCalha" value={state.drenagem.tipoCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])}>
                                <option value="retangular">Retangular</option>
                                <option value="semicircular">Semicircular</option>
                                <option value="trapezoidal">Trapezoidal</option>
                            </Select>
                            {state.drenagem.tipoCalha === 'retangular' && <>
                                <Input label="Largura da Calha (m)" name="larguraCalha" value={state.drenagem.larguraCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                                <Input label="Altura da Calha (m)" name="alturaCalha" value={state.drenagem.alturaCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                            </>}
                            {state.drenagem.tipoCalha === 'semicircular' && <>
                                <Input label="Diâmetro da Calha (m)" name="diametroCalha" value={state.drenagem.diametroCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                            </>}
                            {state.drenagem.tipoCalha === 'trapezoidal' && <>
                                <Input label="Base Maior (m)" name="larguraCalha" value={state.drenagem.larguraCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                                <Input label="Base Menor (m)" name="baseMenorCalha" value={state.drenagem.baseMenorCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                                <Input label="Altura da Calha (m)" name="alturaCalha" value={state.drenagem.alturaCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                            </>}
                            <Input label="Declividade Calha (%)" name="declividadeCalha" value={state.drenagem.declividadeCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} />
                            <Select label="Material Calha" name="materialCalha" value={state.drenagem.materialCalha} onChange={(e:any) => handleStatePathChange(e, ['drenagem'])} >
                                {Object.keys(MANNING_COEFFICIENTS).map(mat => <option key={mat} value={mat}>{mat.toUpperCase()}</option>)}
                            </Select>
                         </div>
                    </Section>
                    <Section title="Tanque de Retenção">
                        <Checkbox label="Habilitar tanque de retenção" name="habilitado" checked={state.drenagem.tanqueRetencao.habilitado} onChange={(e:any) => handleStatePathChange(e, ['drenagem', 'tanqueRetencao'])} />
                        {state.drenagem.tanqueRetencao.habilitado && (
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                <Input label="Tempo de Chuva (min)" name="tempoChuva" value={state.drenagem.tanqueRetencao.tempoChuva} onChange={(e:any) => handleStatePathChange(e, ['drenagem', 'tanqueRetencao'])} />
                            </div>
                        )}
                    </Section>
                    <Section title="Áreas de Captação (Condutores Verticais)">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    {state.areasPluviais.map((area, index) => (
                                        <tr key={area.id}>
                                            <td className="p-1"><Input label="Área (m²)" name="area" value={area.area} onChange={(e:any) => handleArrayChange(e, ['areasPluviais', index])} /></td>
                                            <td className="p-1"><Input label="Coef. Runoff" name="coeficiente" value={area.coeficiente} onChange={(e:any) => handleArrayChange(e, ['areasPluviais', index])} /></td>
                                            <td className="p-1"><Input label="Nº Tubos" name="tubosQueda" value={area.tubosQueda} onChange={(e:any) => handleArrayChange(e, ['areasPluviais', index])} /></td>
                                            <td className="p-1"><Checkbox label="Usar p/ Reúso" name="usarParaReuso" checked={area.usarParaReuso} onChange={(e:any) => handleArrayChange(e, ['areasPluviais', index])} /></td>
                                            <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['areasPluviais'], index)}><i className="fas fa-trash"></i></ActionButton></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ActionButton onClick={() => addArrayItem(['areasPluviais'], { id: Date.now(), area: 100, coeficiente: 0.95, tubosQueda: 1, usarParaReuso: true })}><i className="fas fa-plus"></i> Adicionar Área</ActionButton>
                    </Section>
                     <Section title="Coletores Horizontais (Análise Hidráulica)">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    {state.drenagem.coletores.map((coletor, index) => (
                                        <tr key={coletor.id}>
                                            <td className="p-1"><Input label="Descrição" type="text" name="descricao" value={coletor.descricao} onChange={(e:any) => handleArrayChange(e, ['drenagem', 'coletores', index])} /></td>
                                            <td className="p-1"><Input label="Área Servida (m²)" name="areaServida" value={coletor.areaServida} onChange={(e:any) => handleArrayChange(e, ['drenagem', 'coletores', index])} /></td>
                                            <td className="p-1"><Input label="Declividade (%)" name="declividade" value={coletor.declividade} onChange={(e:any) => handleArrayChange(e, ['drenagem', 'coletores', index])} /></td>
                                            <td className="p-1"><Input label="DN (mm)" name="diametro" value={coletor.diametro} onChange={(e:any) => handleArrayChange(e, ['drenagem', 'coletores', index])} /></td>
                                            <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['drenagem', 'coletores'], index)}><i className="fas fa-trash"></i></ActionButton></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ActionButton onClick={() => addArrayItem(['drenagem', 'coletores'], { id: Date.now(), descricao: 'Novo Coletor', areaServida: 100, comprimento: 10, declividade: 1, diametro: 100 })}><i className="fas fa-plus"></i> Adicionar Coletor</ActionButton>
                    </Section>
                 </div>
            );
        case 'Reúso de Água Pluvial':
            const handleSuggestReusoData = () => {
                const buildingTypeName = buildingTypes[state.selectedBuildingType].name;
                const { demanda, area } = calculateDemandaReuso(state.buildingData, buildingTypeName, state.reusoPluvial, state.areasPluviais);
                onStateChange({
                  reusoPluvial: {
                    ...state.reusoPluvial,
                    demandaNaoPotavel: demanda,
                    areaCaptacao: area,
                  }
                });
            };
            return (
                <div className="space-y-6">
                    <div className="p-4 bg-sky-50 dark:bg-sky-900/50 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-sky-700 dark:text-sky-300">Não tem certeza dos valores? Use nossa sugestão baseada nos dados da edificação.</p>
                        <button onClick={handleSuggestReusoData} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><i className="fas fa-magic"></i> Sugerir Dados</button>
                    </div>
                    <Section title="Parâmetros de Captação e Demanda (NBR 15527)">
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input label="Área de Captação (m²)" name="areaCaptacao" value={state.reusoPluvial.areaCaptacao} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Input label="Coeficiente de Runoff" name="coeficienteRunoff" value={state.reusoPluvial.coeficienteRunoff} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} step="0.01" />
                            <Input label="Precipitação Média Anual (mm)" name="precipitacaoMedia" value={state.reusoPluvial.precipitacaoMedia} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Input label="Demanda Não Potável (L/dia)" name="demandaNaoPotavel" value={state.reusoPluvial.demandaNaoPotavel} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Input label="Eficiência do Filtro (%)" name="eficienciaFiltro" value={state.reusoPluvial.eficienciaFiltro} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                        </div>
                    </Section>
                    <Section title="Dimensionamento do Reservatório">
                        <div className="grid md:grid-cols-2 gap-4">
                           <Select label="Método de Dimensionamento" name="metodoDimensionamentoReservatorio" value={state.reusoPluvial.metodoDimensionamentoReservatorio} onChange={(e: any) => handleStatePathChange(e, ['reusoPluvial'])}>
                               <option value="automatico">Automático (Sugerir Volume)</option>
                               <option value="manual">Manual (Informar Volume)</option>
                           </Select>
                           {state.reusoPluvial.metodoDimensionamentoReservatorio === 'automatico' ? (
                               <Input label="Período de Armazenamento (dias)" name="periodoArmazenamento" value={state.reusoPluvial.periodoArmazenamento} onChange={(e: any) => handleStatePathChange(e, ['reusoPluvial'])} />
                           ) : (
                               <Input label="Volume do Reservatório Adotado (L)" name="volumeReservatorioAdotado" value={state.reusoPluvial.volumeReservatorioAdotado} onChange={(e: any) => handleStatePathChange(e, ['reusoPluvial'])} />
                           )}
                        </div>
                    </Section>
                     <Section title="Análise Financeira (Payback)">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Custo da Água Potável (R$/m³)" name="custoAguaPotavel" value={state.reusoPluvial.custoAguaPotavel} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Input label="Custo Manutenção Anual (R$)" name="manutencaoAnual" value={state.reusoPluvial.manutencaoAnual} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">O cálculo de payback assume um custo de investimento de R$ 2,00 por litro de reservatório (incluindo equipamentos). Este é um valor estimado para análise preliminar.</p>
                    </Section>
                    <Section title="Demandas (Usos Não Potáveis)">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Checkbox label="Irrigação de Jardins" name="usoIrrigacao" checked={state.reusoPluvial.usoIrrigacao} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Checkbox label="Limpeza de Pisos e Veículos" name="usoLimpeza" checked={state.reusoPluvial.usoLimpeza} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Checkbox label="Descarga em Vasos Sanitários" name="usoDescarga" checked={state.reusoPluvial.usoDescarga} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                            <Checkbox label="Combate a Incêndio (Reserva)" name="usoCombateIncendio" checked={state.reusoPluvial.usoCombateIncendio} onChange={(e:any) => handleStatePathChange(e, ['reusoPluvial'])} />
                        </div>
                    </Section>
                </div>
            );
        case 'Gás Combustível':
            return(
                <div className="space-y-6">
                    <Section title="Configuração da Central e Rede">
                        <div className="grid md:grid-cols-4 gap-4">
                            <Select label="Tipo de Gás" name="tipo" value={state.gas.tipo} onChange={(e:any) => handleStatePathChange(e, ['gas'])}><option value="glp">GLP</option><option value="gn">GN</option></Select>
                            <Select label="Tipo de Central" name="tipoCentral" value={state.gas.tipoCentral} onChange={(e:any) => handleStatePathChange(e, ['gas'])}><option value="individual">Individual</option><option value="central">Central</option></Select>
                            {state.gas.tipo === 'glp' && state.gas.tipoCentral === 'central' && <>
                                <Select label="Tipo de Cilindro" name="tipoCilindro" value={state.gas.tipoCilindro} onChange={(e:any) => handleStatePathChange(e, ['gas'])}>
                                    <option value="P13">P13</option>
                                    <option value="P45">P45</option>
                                    <option value="P190">P190</option>
                                </Select>
                                <Input label="Nº de Cilindros" name="numCilindros" value={state.gas.numCilindros} onChange={(e:any) => handleStatePathChange(e, ['gas'])} />
                            </>}
                             <Input label="Pressão Saída (bar)" name="pressaoSaida" value={state.gas.pressaoSaida} onChange={(e:any) => handleStatePathChange(e, ['gas'])} />
                        </div>
                    </Section>
                     {state.gas.abrigo && (
                        <Section title="Abrigo de Gás (NBR 15526)">
                            <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                <p className="text-sm">Dimensões Mínimas: <strong>{state.gas.abrigo.dimensoes}</strong></p>
                                <p className="text-sm">Requisitos de Ventilação: <strong>{state.gas.abrigo.ventilacao}</strong></p>
                            </div>
                        </Section>
                    )}
                    <Section title="Dimensionamento da Rede de Gás">
                        {state.gas.caminhos.map((caminho, cIndex) => (
                            <div key={caminho.id} className="p-3 border rounded-md mb-4 bg-slate-50 dark:bg-slate-800/50">
                               <div className="flex justify-between items-center mb-2">
                                    <Input label="Nome do Ponto Desfavorável" className="flex-grow" type="text" name="nome" value={caminho.nome} onChange={(e:any) => handleArrayChange(e, ['gas', 'caminhos', cIndex])} />
                                    {state.gas.caminhos.length > 1 && <ActionButton variant="remove" onClick={() => removeArrayItem(['gas', 'caminhos'], cIndex)}><i className="fas fa-trash"></i> Remover Ponto</ActionButton>}
                               </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {caminho.trechos.map((trecho, tIndex) => (
                                            <tr key={trecho.id} className="align-top">
                                                <td className="p-1"><Input label="Descrição" type="text" name="descricao" value={trecho.descricao} onChange={(e:any) => handleArrayChange(e, ['gas', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-24"><Input label="Comp(m)" name="comprimento" value={trecho.comprimento} onChange={(e:any) => handleArrayChange(e, ['gas', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1 w-24"><Input label="Potência(kW)" name="potencia" value={trecho.potencia} onChange={(e:any) => handleArrayChange(e, ['gas', 'caminhos', cIndex, 'trechos', tIndex])} /></td>
                                                <td className="p-1"><ActionButton variant="remove" onClick={() => removeArrayItem(['gas', 'caminhos', cIndex, 'trechos'], tIndex)}><i className="fas fa-trash"></i></ActionButton></td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                <ActionButton onClick={() => addArrayItem(['gas', 'caminhos', cIndex, 'trechos'], {id: Date.now(), descricao: "Novo Trecho", comprimento: 1, potencia: 10 })}><i className="fas fa-plus"></i> Adicionar Trecho</ActionButton>
                            </div>
                        ))}
                         <ActionButton onClick={() => addArrayItem(['gas', 'caminhos'], { id: Date.now(), nome: `Novo Ponto ${state.gas.caminhos.length + 1}`, trechos: [] })}><i className="fas fa-plus"></i> Adicionar Ponto Desfavorável</ActionButton>
                    </Section>
                </div>
            );
        case 'Lixeira':
            return (
                <Section title="Dimensionamento do Abrigo de Resíduos Sólidos">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select label="Tipo de Coleta" name="tipoColeta" value={state.lixeira.tipoColeta} onChange={(e:any) => handleStatePathChange(e, ['lixeira'])}>
                            <option value="seletiva">Seletiva</option>
                            <option value="indiferenciada">Indiferenciada</option>
                        </Select>
                        <div>
                             <Input label="Contribuição Diária (L/hab.dia)" name="contribuicaoDiaria" value={state.lixeira.contribuicaoDiaria} onChange={(e:any) => handleStatePathChange(e, ['lixeira'])} />
                            <p className="text-xs text-slate-500 mt-1">Sugestão: 2.5 (Resid.), 1.5 (Comerc.)</p>
                        </div>
                        <Input label="Frequência de Coleta (dias)" name="frequenciaColeta" value={state.lixeira.frequenciaColeta} onChange={(e:any) => handleStatePathChange(e, ['lixeira'])} />
                        <div>
                            <Input label="Taxa de Acumulação" name="taxaAcumulacao" value={state.lixeira.taxaAcumulacao} step="0.01" onChange={(e:any) => handleStatePathChange(e, ['lixeira'])} />
                            <p className="text-xs text-slate-500 mt-1">Ex: 1.25 para 25% de folga</p>
                        </div>
                    </div>
                </Section>
            );
        default:
             return <p className="text-sm text-slate-600 dark:text-slate-400">Parâmetros para este módulo são configurados em outras seções ou calculados automaticamente.</p>;
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Cálculos dos Sistemas</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Selecione um sistema, ajuste os parâmetros e veja os resultados atualizados em tempo real.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {enabledModules.map((module, index) => (
          <div
            key={module.name}
            onClick={() => setSelectedModuleIndex(index)}
            className={`p-4 rounded-xl cursor-pointer transition-all border-2 transform hover:-translate-y-1 ${
              selectedModuleIndex === index 
                ? 'bg-primary-600 text-white border-primary-600 ring-4 ring-primary-500/30'
                : module.results.length > 0
                ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
            }`}
          >
            <div className="flex items-center"><i className={`${module.icon} text-xl mr-3`}></i><h3 className="font-bold">{module.name}</h3></div>
          </div>
        ))}
      </div>

       <button 
          onClick={() => setShowCompliancePanel(true)}
          className="fixed bottom-24 right-6 bg-gradient-to-br from-primary-600 to-emerald-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl z-40 hover:scale-110 transition-transform">
          <i className="fas fa-clipboard-check"></i>
      </button>

      {showCompliancePanel && <CompliancePanel state={state} onClose={() => setShowCompliancePanel(false)} />}
      
      {editingConexoes && (
          <ConexoesModal 
            trecho={state[editingConexoes.moduleName].caminhos[editingConexoes.cIndex].trechos[editingConexoes.tIndex]}
            onSave={handleSaveConexoes}
            onClose={() => setEditingConexoes(null)}
          />
      )}
      
      {editingAparelhos && (
          <AparelhosModal 
            trecho={state[editingAparelhos.moduleName].caminhos[editingAparelhos.cIndex].trechos[editingAparelhos.tIndex]}
            onSave={handleSaveAparelhos}
            onClose={() => setEditingAparelhos(null)}
          />
      )}

      {selectedModule && (
          <div className="mt-8 space-y-6">
              {renderModuleForm()}
              
              {/* TABELAS DETALHADAS */}
              {selectedModule.caminhos && selectedModule.caminhos.length > 0 && (
                <div className="overflow-x-auto mt-6">
                    <h4 className="font-semibold text-lg my-4">Tabela de Perda de Carga Detalhada</h4>
                    {selectedModule.caminhos.map((c, cIndex) => (
                    <div key={c.id}>
                        <h5 className="font-semibold mt-2 mb-1">{c.nome}</h5>
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="p-2 text-slate-600 dark:text-slate-300">Trecho</th>
                                    <th className="p-2 text-slate-600 dark:text-slate-300">Veloc. (m/s)</th>
                                    <th className="p-2 text-slate-600 dark:text-slate-300">Pressão Dinâmica (mca)</th>
                                    <th className="p-2 text-slate-600 dark:text-slate-300">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700 dark:text-slate-300">
                                {c.trechos.map(t => (
                                    <tr key={t.id} className="border-b dark:border-slate-700">
                                        <td className="p-2">{t.descricao}</td>
                                        <td className={`p-2 ${t.velocidadeExcessiva ? 'text-red-500 font-bold' : ''}`}>{fNum(t.velocidade)} {t.velocidadeExcessiva ? '⚠️' : ''}</td>
                                        <td className="p-2">{fNum(t.pressaoFinal)}</td>
                                        <td className={`p-2 ${t.pressaoMinimaAtendida ? 'text-emerald-500' : 'text-red-500'}`}><i className={`fas ${t.pressaoMinimaAtendida ? 'fa-check-circle' : 'fa-times-circle'}`}></i> {t.pressaoMinimaAtendida ? 'OK' : 'Falha'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    ))}
                </div>
              )}
              {selectedModule.caminhosGas && selectedModule.caminhosGas.length > 0 && (
                 <div className="overflow-x-auto mt-6">
                    <h4 className="font-semibold text-lg my-4">Tabela de Dimensionamento de Gás</h4>
                     {selectedModule.caminhosGas.map(c => (
                        <div key={c.id}>
                            <h5 className="font-semibold mt-2 mb-1">{c.nome}</h5>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 dark:bg-slate-700">
                                    <tr>
                                        <th className="p-2 text-slate-600 dark:text-slate-300">Trecho</th>
                                        <th className="p-2 text-slate-600 dark:text-slate-300">Pot. Acum.(kW)</th>
                                        <th className="p-2 text-slate-600 dark:text-slate-300">Vazão(m³/h)</th>
                                        <th className="p-2 text-slate-600 dark:text-slate-300">DN(mm)</th>
                                        <th className="p-2 text-slate-600 dark:text-slate-300">PD(mbar)</th>
                                        <th className="p-2 text-slate-600 dark:text-slate-300">PD Acum.(mbar)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-700 dark:text-slate-300">
                                    {c.trechos.map(t => (
                                        <tr key={t.id} className="border-b dark:border-slate-700">
                                            <td className="p-2">{t.descricao}</td><td className="p-2">{fNum(t.potenciaAcumulada)}</td><td className="p-2">{fNum(t.vazao, 3)}</td><td className="p-2">{t.diametro}</td><td className="p-2">{fNum(t.perdaCarga, 3)}</td><td className="p-2">{fNum(t.perdaCargaAcumulada, 3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                 </div>
              )}

              {selectedModule.results.length > 0 && (
                  <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Resultados</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {selectedModule.results.map(res => (
                              <div key={res.label} className="p-4 bg-primary-50 dark:bg-primary-900/50 rounded-lg border border-primary-200 dark:border-primary-800">
                                  <label className="text-xs text-primary-800 dark:text-primary-300">{res.label}</label>
                                  <p className="text-lg font-bold text-primary-900 dark:text-primary-100">{res.value} <span className="text-sm font-normal">{res.unit}</span></p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      <div className="flex justify-between mt-8">
        <button onClick={handlePrev} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center transition">
          <i className="fas fa-arrow-left mr-2"></i> 
          {selectedModuleIndex === 0 ? 'Anterior (Sistemas)' : 'Módulo Anterior'}
        </button>
        <button onClick={handleNext} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center shadow-lg transition">
          {selectedModuleIndex === enabledModules.length - 1 ? 'Próximo (Plantas)' : 'Próximo Módulo'}
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};