import React, { useMemo } from 'react';
import { Project, ProjectStatus, Member, MemberWithStats } from '../types';

interface MemberHubProps {
  projects: Project[];
  members: Member[];
  selectedMember: MemberWithStats | null;
  onSelectMember: (member: MemberWithStats | null) => void;
}

const MemberHub: React.FC<MemberHubProps> = ({ projects, members, onSelectMember, selectedMember }) => {
  
  const getMemberStats = (memberList: Member[], roleLabel: string): (MemberWithStats & {role: string})[] => {
    return memberList.map(member => {
      const name = member.name.toLowerCase();
      const projectsAsPM = projects.filter(p => p.pm?.toLowerCase().includes(name));
      const projectsAsDesigner = projects.filter(p => p.designer?.toLowerCase().includes(name));
      const projectsAsPO = projects.filter(p => p.po?.toLowerCase().includes(name));
      
      const involvedProjectIds = new Set([
        ...projectsAsPM.map(p => p.id),
        ...projectsAsDesigner.map(p => p.id),
        ...projectsAsPO.map(p => p.id)
      ]);
      const totalInvolved = involvedProjectIds.size;
      
      const activeProjects = projects.filter(p => 
        involvedProjectIds.has(p.id) &&
        [ProjectStatus.IN_PROGRESS, ProjectStatus.PLANNING, ProjectStatus.RE_OPEN].includes(p.status)
      ).length;

      return { ...member, role: roleLabel, total: totalInvolved, active: activeProjects };
    }).sort((a, b) => b.active - a.active || b.total - a.total);
  };
  
  const leaderStats = useMemo(() => {
    const leaders = members.filter(m => m.position?.toLowerCase().includes('leader'));
    return getMemberStats(leaders, 'Product Leader');
  }, [projects, members]);

  const designStats = useMemo(() => {
    const designers = members.filter(m => ['ui', 'ux'].includes(m.position?.toLowerCase()));
    return getMemberStats(designers, 'UI/UX Team');
  }, [projects, members]);

  const specialistStats = useMemo(() => {
     const specialists = members.filter(m => ['seo', 'data'].includes(m.position?.toLowerCase()));
     return getMemberStats(specialists, 'Specialist');
  }, [projects, members]);
  
  const involvedProjects = useMemo(() => {
    if (!selectedMember) return [];
    const name = selectedMember.name.toLowerCase();
    return projects.filter(p => 
      p.pm?.toLowerCase().includes(name) ||
      p.designer?.toLowerCase().includes(name) ||
      p.po?.toLowerCase().includes(name)
    );
  }, [selectedMember, projects]);

  const renderSection = (title: string, stats: ReturnType<typeof getMemberStats>, colorClass: string, icon: React.ReactNode) => {
    if (!stats || stats.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-300/80 dark:border-slate-700/60 pb-6">
          <div className={`p-3 rounded-2xl ${colorClass} text-white shadow-[0_0_15px_var(--vne-glow)]`}>
            {icon}
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight drop-shadow-sm">{title}</h3>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-300 dark:border-slate-600">{stats.length} Members</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stats.map((member) => (
            <div key={member.name} onClick={() => onSelectMember(member)} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-700/50 hover:border-vne-primary/50 dark:hover:border-vne-primary/50 hover:shadow-[0_0_20px_var(--vne-glow)] transition-all group cursor-pointer active:scale-95 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={member.avatar} alt={member.fullName} className="w-12 h-12 rounded-full shadow-lg border-2 border-white/50 dark:border-slate-800/50" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-vne-primary transition-colors">{member.fullName}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-300">{member.position}</p>
                  </div>
                </div>
                {member.active > 0 && (
                  <div className="flex flex-col items-center bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 px-3 py-1 rounded-lg border dark:border-emerald-700">
                    <span className="text-base font-black">{member.active}</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider">Active</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase"><span>Workload</span><span className="text-slate-700 dark:text-white">{member.total} Total Projects</span></div>
                   <div className="w-full bg-slate-200/80 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-300/50 dark:border-slate-700/50">
                      <div className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${member.active > 3 ? 'bg-rose-500 text-rose-500' : 'bg-vne-primary text-vne-primary'}`} style={{ width: `${Math.min((member.total / 8) * 100, 100)}%` }}></div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const InfoRow = ({ label, value, href }: { label: string; value: string; href?: string }) => (
    <div className="flex items-center py-3 border-b border-slate-200 dark:border-slate-800">
      <span className="w-1/3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      {href ? (
        <a href={href} className="flex-1 font-bold text-vne-primary hover:text-vne-secondary text-sm transition-colors underline-offset-4 hover:underline">{value}</a>
      ) : (
        <span className="flex-1 font-bold text-slate-800 dark:text-slate-200 text-sm">{value || 'N/A'}</span>
      )}
    </div>
  );

  const allMembersCategorized = [...leaderStats, ...designStats, ...specialistStats];

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-10">
        {allMembersCategorized.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-300/80 dark:border-slate-700/50 p-8">
                <svg className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4.354a4 4 0 110 15.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">Không tìm thấy dữ liệu thành viên</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    Không thể tải thông tin thành viên từ Google Sheet. Vui lòng kiểm tra lại nguồn dữ liệu hoặc kết nối mạng.
                </p>
            </div>
        )}
        {renderSection('Product Leaders', leaderStats, 'bg-vne-accent', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>)}
        {renderSection('UI/UX Team', designStats, 'bg-vne-primary', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>)}
        {renderSection('Specialists', specialistStats, 'bg-emerald-600', <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" /></svg>)}
      </div>
      
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => onSelectMember(null)}>
          <div className="bg-white dark:bg-slate-950 w-full max-w-4xl h-[85vh] max-h-[720px] rounded-[2rem] overflow-hidden shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] animate-scale-in flex glow-border border-white/10" onClick={e => e.stopPropagation()}>
            {/* Left Profile Sidebar - FIXED WIDTH FOR COMPACTNESS */}
            <div className="w-72 bg-slate-50 dark:bg-slate-900/50 p-8 flex flex-col items-center justify-center text-center border-r border-slate-200 dark:border-slate-800 shrink-0">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-vne-primary/20 blur-2xl rounded-full animate-pulse"></div>
                <img src={selectedMember.avatar} alt={selectedMember.fullName} className="relative w-32 h-32 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 object-cover" />
                <div className="absolute bottom-0 right-3 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 shadow-lg"></div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{selectedMember.fullName}</h2>
              <p className="font-black text-vne-primary uppercase text-[10px] tracking-[0.2em] mt-3 bg-vne-primary/5 px-4 py-1.5 rounded-full border border-vne-primary/20">{selectedMember.position}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-10 w-full">
                <div className="text-center bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                  <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400">{selectedMember.active}</p>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Active</p>
                </div>
                <div className="text-center bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-300">{selectedMember.total}</p>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Total</p>
                </div>
              </div>
            </div>

            {/* Right Detailed Content */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-vne-primary uppercase tracking-[0.25em] bg-vne-primary/5 px-4 py-2 rounded-xl border border-vne-primary/10">
                    Personnel dossier
                  </span>
                </div>
                <button onClick={() => onSelectMember(null)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-7 space-y-10">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-3">
                    <span className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800"></span> Contact Details
                  </h3>
                  <div className="space-y-0.5">
                    <InfoRow label="Mail" value={selectedMember.email} href={`mailto:${selectedMember.email}`} />
                    <InfoRow label="Phone" value={selectedMember.phone} href={`tel:${selectedMember.phone.replace(/[^0-9+]/g, '')}`} />
                    <InfoRow label="Join Date" value={selectedMember.startDate} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-4 flex items-center gap-3">
                    <span className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800"></span> Current Missions
                  </h3>
                  {involvedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {involvedProjects.map(p => (
                        <div key={p.id} className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 group/item">
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover/item:text-vne-primary transition-colors truncate">{p.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{p.department}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                               <span className="text-[9px] font-black text-vne-accent">Q{p.quarter}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shrink-0 ml-4 ${
                            p.status === ProjectStatus.DONE 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30' 
                            : 'bg-vne-primary/5 text-vne-primary border-vne-primary/20 dark:bg-vne-primary/10 dark:text-vne-secondary dark:border-vne-primary/30'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-10 bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-600 italic">No project data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/30 dark:bg-slate-900/20 shrink-0">
                <button onClick={() => onSelectMember(null)} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg uppercase tracking-widest text-[10px] border border-transparent">
                  Close dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberHub;
