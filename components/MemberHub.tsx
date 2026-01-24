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
      <span className="w-1/3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      {href ? (
        <a href={href} className="flex-1 font-bold text-vne-accent hover:brightness-125">{value}</a>
      ) : (
        <span className="flex-1 font-bold text-slate-700 dark:text-slate-200">{value || 'N/A'}</span>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => onSelectMember(null)}>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl w-full max-w-4xl h-[90vh] max-h-[700px] rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex glow-border" onClick={e => e.stopPropagation()}>
            <div className="w-1/3 bg-slate-100/50 dark:bg-slate-800/30 p-8 flex flex-col items-center justify-center text-center border-r border-slate-300/50 dark:border-slate-800/50">
              <img src={selectedMember.avatar} alt={selectedMember.fullName} className="w-32 h-32 rounded-full shadow-2xl mb-6 border-4 border-white dark:border-slate-900/80" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedMember.fullName}</h2>
              <p className="font-bold text-vne-primary uppercase text-xs tracking-widest mt-2 drop-shadow-[0_0_5px_var(--vne-glow)]">{selectedMember.position}</p>
              <div className="flex gap-4 mt-8">
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-500">{selectedMember.active}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-700"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-700 dark:text-slate-300">{selectedMember.total}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>

            <div className="w-2/3 flex flex-col">
              <div className="p-6 border-b border-slate-300/50 dark:border-slate-800/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-vne-primary uppercase tracking-widest bg-vne-primary/10 px-3 py-1 rounded-full border border-vne-primary/20">
                    Member Profile
                  </span>
                </div>
                <button onClick={() => onSelectMember(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Member Details</h3>
                  <div className="text-sm">
                    <InfoRow label="Email" value={selectedMember.email} href={`mailto:${selectedMember.email}`} />
                    <InfoRow label="Phone" value={selectedMember.phone} href={`tel:${selectedMember.phone.replace(/[^0-9+]/g, '')}`} />
                    <InfoRow label="Start Date" value={selectedMember.startDate} />
                    <InfoRow label="Date of Birth" value={selectedMember.dob} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Involved Projects</h3>
                  {involvedProjects.length > 0 ? (
                    <div className="space-y-3">
                      {involvedProjects.map(p => (
                        <div key={p.id} className="bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl flex items-center justify-between transition-all hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{p.description}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{p.department} - Q{p.quarter}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${p.status === ProjectStatus.DONE ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-blue-100 text-blue-600 border-blue-200'} dark:bg-opacity-30 dark:border-opacity-30`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-slate-400 text-sm font-medium italic border-2 border-dashed border-slate-300/80 dark:border-slate-700/50 rounded-2xl p-8">
                      No projects assigned yet.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-300/50 dark:border-slate-800/50 flex justify-end bg-slate-100/30 dark:bg-slate-800/20 shrink-0">
                <button onClick={() => onSelectMember(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors border border-slate-300 dark:border-slate-600">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberHub;
