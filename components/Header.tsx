
import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onGenerateReport: () => void;
  onGenerateDocx: () => void;
  onGenerateART: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme, onSaveProject, onLoadProject, onGenerateReport, onGenerateDocx, onGenerateART }) => {
  return (
    <header className="bg-gradient-to-r from-primary-800 to-primary-900 text-white shadow-lg print:hidden">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-white/10 p-3 rounded-xl mr-4">
              <i className="fas fa-tint text-3xl"></i>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Memorial Hidrossanitário PRO</h1>
              <p className="text-primary-200 text-sm">Sistema de Aprovação Municipal - Conforme Normas ABNT</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={onSaveProject} className="btn-action bg-primary-600 hover:bg-primary-700"><i className="fas fa-save mr-2"></i> Salvar</button>
            <button onClick={onLoadProject} className="btn-action bg-white/10 hover:bg-white/20"><i className="fas fa-folder-open mr-2"></i> Carregar</button>
            <button onClick={onGenerateReport} className="btn-action bg-sky-600 hover:bg-sky-700"><i className="fas fa-file-pdf mr-2"></i> Gerar PDF</button>
            <button onClick={onGenerateDocx} className="btn-action bg-blue-700 hover:bg-blue-800"><i className="fas fa-file-word mr-2"></i> Baixar DOCX</button>
            <button onClick={onGenerateART} className="btn-action bg-purple-700 hover:bg-purple-800"><i className="fas fa-file-contract mr-2"></i> Rascunho ART</button>
            <button onClick={toggleTheme} className="btn-action bg-white/10 hover:bg-white/20"><i className={`mr-2 ${isDarkMode ? 'fas fa-sun' : 'fas fa-moon'}`}></i></button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Add a CSS-in-JS style for the button to avoid repeating classes
const styles = `
  .btn-action {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    font-weight: 500;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .btn-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
