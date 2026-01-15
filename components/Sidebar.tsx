
import React from 'react';

interface SidebarProps {
  activeView: 'dashboard' | 'projects' | 'backlog' | 'team';
  setActiveView: (view: 'dashboard' | 'projects' | 'backlog' | 'team') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: 'projects', label: 'Dự án', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
    )},
    { id: 'backlog', label: 'Backlog', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    )},
    { id: 'team', label: 'Member Hub', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 15.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
  ];

  return (
    <div className="w-64 bg-[#1a1a1a] text-white flex flex-col h-screen fixed left-0 top-0 border-r border-[#333] z-50">
      <div className="p-6 border-b border-[#333]">
        <div className="flex items-center gap-3">
          <div className="bg-[#9f224e] w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-xl">V</div>
          <span className="font-bold text-lg tracking-tight">VnExpress Product</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 mt-6">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                  activeView === item.id 
                    ? 'bg-[#9f224e] text-white shadow-lg transform scale-105' 
                    : 'text-slate-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#333] bg-[#222]">
        <div className="flex items-center gap-3 px-2">
          <div className="relative">
            <img src="https://picsum.photos/seed/hieunt/40/40" className="w-9 h-9 rounded-full border-2 border-[#9f224e]" alt="Member" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#222]"></div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">HieuNT (Member)</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Product Lead</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
