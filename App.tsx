import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { Footer } from './components/Footer';
import { Step1BuildingType } from './components/steps/Step1BuildingType';
import { Step2ProjectData } from './components/steps/Step2ProjectData';
import { Step3Systems } from './components/steps/Step3Systems';
import { Step4Calculations } from './components/steps/Step4Calculations';
import { Step5Uploads } from './components/steps/Step5Uploads';
import { Step6FinalReport } from './components/steps/Step6FinalReport';
import { ProjectState, System, Module } from './types';
import { buildingTypes, initialProjectState } from './constants';
import { getReportHtml, generateART, generateDocx, generateReport } from './services/reportingService';
import { calculateModule } from './services/calculationService';

const App: React.FC = () => {
  const [state, setState] = useState<ProjectState>(initialProjectState);
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGenerationProgress, setPdfGenerationProgress] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newIsDark = !prev;
      if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newIsDark;
    });
  };

  const handleStateChange = (updates: Partial<ProjectState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };
  
  const enabledModules = useMemo((): Module[] => {
    return state.modules.filter((_, index) => state.systems[index]?.enabled);
  }, [state.systems, state.modules]);

  const completedModulesCount = useMemo(() => {
    return enabledModules.filter(m => m.results.length > 0).length;
  }, [enabledModules]);

  const progress = useMemo(() => {
    if (enabledModules.length === 0) return 0;
    return (completedModulesCount / enabledModules.length) * 100;
  }, [completedModulesCount, enabledModules.length]);


  const goToStep = (step: number) => {
    if (step <= maxStepReached) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < 6) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      if (newStep > maxStepReached) {
        setMaxStepReached(newStep);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSaveProject = () => {
    const dataToSave = { ...state };
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memorial-hidrossanitario-${state.projectInfo.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const data = JSON.parse(event.target?.result as string);
                  // Basic validation
                  if (data.projectInfo && data.systems) {
                      setState(data);
                      alert("Projeto carregado com sucesso!");
                  } else {
                      alert("Arquivo de projeto inválido.");
                  }
              } catch (error) {
                  alert("Erro ao carregar o projeto: " + (error as Error).message);
              }
          };
          reader.readAsText(file);
      };
      input.click();
  };

  const prepareReportData = () => {
      const buildingTypeName = buildingTypes[state.selectedBuildingType].name;
      // Recalculate all modules to ensure data is fresh and consistent
      const freshModules = state.modules.map((module, index) => {
          if (state.systems[index]?.enabled) {
              return calculateModule(module, state, buildingTypeName);
          }
          return module;
      });

      const freshEnabledModules = freshModules.filter((_, index) => state.systems[index]?.enabled);
      const updatedState = { ...state, modules: freshModules };

      return { updatedState, freshEnabledModules };
  };
  
  const handleGenerateReport = async () => {
    setIsGeneratingPdf(true);
    setPdfGenerationProgress(0);
    const { updatedState, freshEnabledModules } = prepareReportData();
    
    const progressCallback = (progress: number) => {
        setPdfGenerationProgress(progress);
    };

    try {
      await generateReport({ ...updatedState, buildingTypes, enabledModules: freshEnabledModules }, progressCallback);
    } catch(error) {
       console.error("PDF generation failed:", error);
       alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const handleGenerateDocx = () => {
    const { updatedState, freshEnabledModules } = prepareReportData();
    const html = getReportHtml({ ...updatedState, buildingTypes, enabledModules: freshEnabledModules });
    generateDocx(html, updatedState.projectInfo.name);
  };

  const handleGenerateART = () => {
    const html = generateART({ ...state, buildingTypes, enabledModules });
    // This function returns HTML, we need to create a simple viewer or download it.
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  };


  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BuildingType state={state} onStateChange={handleStateChange} nextStep={nextStep} />;
      case 2:
        return <Step2ProjectData state={state} onStateChange={handleStateChange} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3Systems systems={state.systems} onStateChange={handleStateChange} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <Step4Calculations state={state} onStateChange={handleStateChange} nextStep={nextStep} prevStep={prevStep} enabledModules={enabledModules} />;
      case 5:
        return <Step5Uploads state={state} onStateChange={handleStateChange} nextStep={nextStep} prevStep={prevStep} />;
      case 6:
        return <Step6FinalReport state={state} onStateChange={handleStateChange} prevStep={prevStep} progress={progress} enabledModules={enabledModules} completedModulesCount={completedModulesCount} handleGenerateDocx={handleGenerateDocx} handleGenerateReport={handleGenerateReport} />;
      default:
        return <div>Etapa não encontrada</div>;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen relative font-sans">
      <Header
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onGenerateReport={handleGenerateReport}
        onGenerateDocx={handleGenerateDocx}
        onGenerateART={handleGenerateART}
      />
      
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5">
        <div 
          className="bg-gradient-to-r from-primary-600 to-primary-500 h-1.5 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <StepIndicator currentStep={currentStep} maxStepReached={maxStepReached} goToStep={goToStep} />
      </div>

      <main className="container mx-auto px-4 py-8">
        {renderStep()}
      </main>

      <Footer />
      
      {isGeneratingPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl text-center w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Gerando Memorial PDF...</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Isso pode levar alguns segundos. Por favor, aguarde.</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 relative overflow-hidden">
              <div 
                className="bg-primary-600 h-4 rounded-full transition-all duration-300 ease-linear" 
                style={{ width: `${pdfGenerationProgress}%` }}
              ></div>
            </div>
            <p className="mt-4 font-semibold text-lg text-primary-700 dark:text-primary-300">{Math.round(pdfGenerationProgress)}%</p>
          </div>
        </div>
      )}

      <div className="watermark hidden md:block fixed bottom-5 right-5 opacity-5 font-black text-8xl text-primary-900 dark:text-primary-500/10 pointer-events-none z-0 transform -rotate-12">
        PRO
      </div>
    </div>
  );
};

export default App;
