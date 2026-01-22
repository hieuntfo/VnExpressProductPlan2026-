
import React from 'react';
import { Document } from '../types';

interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm z-[1000]" onClick={onClose}>
      <div 
        className="fixed top-0 right-0 h-full w-full md:w-1/2 bg-white dark:bg-[#111827] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
             <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate" title={document.name}>{document.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Description</h3>
            <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
            {document.description}
            </p>
        </main>
        <footer className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
          <button onClick={onClose} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors border border-slate-300 dark:border-slate-600">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DocumentDetail;