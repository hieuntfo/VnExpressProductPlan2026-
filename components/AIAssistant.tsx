
import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { analyzeProjects } from '../services/geminiService';

interface AIAssistantProps {
  projects: Project[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ projects }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Chào Trưởng phòng, tôi là trợ lý ảo VnExpress Product. Tôi có thể giúp gì cho việc quản lý dự án 2026 hôm nay?' }
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
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#9f224e] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#851a40] transition-all hover:scale-110 z-40"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-slide-in">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#1e1e1e] text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#9f224e] flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="font-bold tracking-tight">VnExpress AI Trợ Lý</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-[#333] rounded transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f9f9f9]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#9f224e] text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#9f224e] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#9f224e] rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-[#9f224e] rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Hỏi về tiến độ dự án..."
                className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-2.5 text-[13px] focus:ring-2 focus:ring-[#9f224e] outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping}
                className="p-2.5 bg-[#9f224e] text-white rounded-lg hover:bg-[#851a40] disabled:opacity-50 transition-all shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center font-bold uppercase tracking-widest">Powered by Gemini 3 Flash</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
