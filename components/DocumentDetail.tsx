import React, { useState, useRef, useEffect } from 'react';
import { Document } from '../types';

interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
  onUpdate: (originalName: string, updatedData: { name: string; description: string }) => Promise<void>;
  isAdmin: boolean;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({ document, onClose, onUpdate, isAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const originalNameRef = useRef<string>('');
  const descriptionEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsEditing(false);
  }, [document]);
  
  const handleEditClick = () => {
    originalNameRef.current = document.name;
    setEditData({ name: document.name, description: document.description });
    setIsEditing(true);
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditData({ name: '', description: '' });
  };
  
  const handleSaveClick = async () => {
    const newDescription = descriptionEditorRef.current?.innerHTML || editData.description;
    if (!editData.name.trim() || !newDescription.trim()) {
      alert("Name and Description cannot be empty.");
      return;
    }
    
    setIsSubmitting(true);
    await onUpdate(originalNameRef.current, { name: editData.name, description: newDescription });
    setIsSubmitting(false);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]" onClick={!isEditing ? onClose : undefined}>
      <div 
        className="fixed top-0 right-0 h-full w-full md:w-1/2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl flex flex-col animate-slide-in-right glow-border"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-slate-300/50 dark:border-slate-800/50 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
             <svg className="w-5 h-5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"></path></svg>
             {isEditing ? (
                <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="text-lg font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-md outline-none focus:ring-2 focus:ring-vne-primary w-full"
                />
             ) : (
                <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate" title={document.name}>{document.name}</h2>
             )}
          </div>
          <div className="flex items-center gap-2 pl-4">
            {isAdmin && !isEditing && (
              <button onClick={handleEditClick} className="px-3 py-2 bg-vne-accent/10 text-vne-accent rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-vne-accent/20 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                Edit
              </button>
            )}
            <button onClick={isEditing ? handleCancelClick : onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 shrink-0">Description</h3>
            {isEditing ? (
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-vne-primary overflow-hidden h-full flex flex-col">
                <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                  <button type="button" title="Bold" onClick={() => document.execCommand('bold')} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-colors">B</button>
                  <button type="button" title="Italic" onClick={() => document.execCommand('italic')} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 italic text-slate-700 dark:text-slate-200 transition-colors">I</button>
                  <button type="button" title="Underline" onClick={() => document.execCommand('underline')} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 underline text-slate-700 dark:text-slate-200 transition-colors">U</button>
                  <button type="button" title="Insert Link" onClick={() => { const url = prompt('Enter URL:'); if (url) document.execCommand('createLink', false, url); }} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </button>
                </div>
                <div
                  ref={descriptionEditorRef}
                  contentEditable
                  className="w-full p-4 flex-1 overflow-y-auto bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none"
                  dangerouslySetInnerHTML={{ __html: editData.description }}
                  suppressContentEditableWarning={true}
                />
              </div>
            ) : (
              <div 
                className="rich-text-content whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: document.description }}
              />
            )}
        </main>
        <footer className="p-6 border-t border-slate-300/50 dark:border-slate-800/50 flex justify-end gap-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm shrink-0">
          {isEditing ? (
            <>
              <button onClick={handleCancelClick} className="px-6 py-3 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveClick} disabled={isSubmitting} className="px-6 py-3 bg-gradient-to-r from-vne-primary to-vne-secondary text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_var(--vne-glow)] disabled:opacity-50 hover:brightness-110">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors border border-slate-300 dark:border-slate-600">
              Close
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default DocumentDetail;
