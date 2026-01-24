
import React, { useState } from 'react';
import { Document } from '../types';

interface DocumentHubProps {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
}

const DocumentItem: React.FC<{ document: Document; onSelect: () => void; }> = ({ document, onSelect }) => {
  return (
    <div className="grid grid-cols-[minmax(0,_1fr)_minmax(0,_2fr)] border-b border-slate-200 dark:border-slate-700/50 group">
      <div className="py-4 px-6 font-medium text-slate-700 dark:text-slate-200 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/20 transition-colors duration-200 flex items-start gap-3">
        <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <span className="cursor-pointer hover:text-[#9f224e]" onClick={onSelect}>{document.name}</span>
      </div>
      <div className="py-4 px-6 text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700/50 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/20 transition-colors duration-200">
        <div
          className="rich-text-content line-clamp-3"
          dangerouslySetInnerHTML={{ __html: document.description }}
        />
        <button onClick={onSelect} className="text-sm font-bold text-[#9f224e] hover:underline mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          See more &raquo;
        </button>
      </div>
    </div>
  );
};


const DocumentHub: React.FC<DocumentHubProps> = ({ documents, onSelectDocument }) => {
  const [visibleCount, setVisibleCount] = useState(15);

  return (
    <div className="bg-white/80 dark:bg-[#1e293b]/50 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-fade-in">
      <div className="grid grid-cols-[minmax(0,_1fr)_minmax(0,_2fr)] border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#1e293b]/80 sticky top-0 z-10">
        <div className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
          <span className="font-mono text-lg">Aa</span> Name
        </div>
        <div className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] border-l border-slate-300 dark:border-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          Description
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        {documents.slice(0, visibleCount).map(doc => (
          <DocumentItem key={doc.id} document={doc} onSelect={() => onSelectDocument(doc)} />
        ))}
        {visibleCount < documents.length && (
         <div className="p-4 flex justify-center bg-gradient-to-t from-white/80 dark:from-[#1e293b]/80 to-transparent sticky bottom-0">
           <button onClick={() => setVisibleCount(c => c + 10)} className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             See more
           </button>
         </div>
        )}
      </div>
    </div>
  );
};

export default DocumentHub;
