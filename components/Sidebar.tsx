
import React from 'react';

interface SidebarProps {
  activeView: 'dashboard' | 'projects' | 'team';
  setActiveView: (view: 'dashboard' | 'projects' | 'team') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: 'projects', label: 'Projects', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    )},
    { id: 'team', label: 'Member Hub', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 15.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
  ];

  return (
    <div className="w-64 bg-[#111827] text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-700/50 z-50 shadow-2xl">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#9f224e] to-[#db2777] w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(159,34,78,0.5)]">
            V
          </div>
          <div className="flex flex-col">
             <span className="font-black text-xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">VnExpress</span>
             <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">Product 2026</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 mt-8">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  activeView === item.id 
                    ? 'text-white shadow-lg shadow-[#9f224e]/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {activeView === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9f224e] to-[#801b3f] opacity-100 z-0"></div>
                )}
                <div className="relative z-10 flex items-center gap-3">
                    <span className={`${activeView === item.id ? 'text-white' : 'group-hover:text-[#9f224e] transition-colors'}`}>
                        {item.icon}
                    </span>
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-[#1f293a] to-[#111827] border border-slate-700/50 shadow-lg cursor-pointer hover:border-slate-600 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9f224e] to-purple-500 p-[2px] group-hover:scale-110 transition-transform">
              <img src="https://picsum.photos/seed/hieunt/40/40" className="w-full h-full rounded-full border-2 border-[#1e293b]" alt="Member" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1e293b] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white group-hover:text-[#9f224e] transition-colors">HieuNT</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Product Lead</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
