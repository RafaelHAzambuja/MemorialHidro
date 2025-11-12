
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-10 mt-12 print:hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold flex items-center">
              <i className="fas fa-tint mr-3"></i> Memorial Hidrossanitário
            </h3>
            <p className="text-slate-400 mt-2">Sistema de Aprovação Municipal - Conforme Normas ABNT</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-slate-400 hover:text-white transition text-2xl"><i className="fab fa-github"></i></a>
            <a href="#" className="text-slate-400 hover:text-white transition text-2xl"><i className="fab fa-linkedin"></i></a>
            <a href="#" className="text-slate-400 hover:text-white transition text-2xl"><i className="fas fa-envelope"></i></a>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Memorial Hidrossanitário. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
