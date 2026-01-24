import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { analyzeProjects } from '../services/geminiService';

interface AIAssistantProps {
  projects: Project[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ projects }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello, I am the VnExpress Product Assistant. How can I help you with the 2026 project plan today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    const aiResponse = await analyzeProjects(projects, userMsg);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-vne-primary to-vne-secondary text-white rounded-full shadow-[0_0_25px_var(--vne-glow)] flex items-center justify-center hover:scale-110 transition-all z-40 border-2 border-white/20">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl z-[100] flex flex-col border-l border-slate-300/50 dark:border-slate-700/50 animate-slide-in-right glow-border">
          <div className="p-4 border-b border-slate-300/50 dark:border-slate-700/50 flex items-center justify-between bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-vne-primary to-vne-accent flex items-center justify-center shadow-[0_0_15px_var(--vne-glow)] border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="font-bold tracking-tight text-slate-800 dark:text-white">AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-vne-primary to-vne-secondary text-white rounded-tr-none shadow-[0_5px_15px_var(--vne-glow)]' 
                    : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-lg'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5">
                  <span className="w-2 h-2 bg-vne-primary rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-vne-primary rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-vne-primary rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-300/50 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
            <div className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about projects..." className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-vne-primary outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
              <button onClick={handleSend} disabled={isTyping} className="p-3 bg-gradient-to-r from-vne-primary to-vne-secondary text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_var(--vne-glow)] border border-white/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-3 text-center font-bold uppercase tracking-widest">Powered by Gemini 3 Flash</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
