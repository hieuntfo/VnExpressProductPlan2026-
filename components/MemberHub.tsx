
import React, { useMemo } from 'react';
import { Project, ProjectStatus } from '../types';
import { TEAM_MEMBERS } from '../constants';

interface MemberHubProps {
  projects: Project[];
}

const MemberHub: React.FC<MemberHubProps> = ({ projects }) => {
  const memberStats = useMemo(() => {
    return TEAM_MEMBERS.map(name => {
      const projectsAsPM = projects.filter(p => p.pm === name);
      const projectsAsPO = projects.filter(p => p.po === name);
      const projectsAsDesigner = projects.filter(p => p.designer === name);
      
      const totalInvolved = new Set([...projectsAsPM, ...projectsAsPO, ...projectsAsDesigner]).size;
      const activeProjects = projects.filter(p => 
        (p.pm === name || p.po === name || p.designer === name) && 
        (p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.RE_OPEN)
      ).length;

      return {
        name,
        total: totalInvolved,
        active: activeProjects,
        pmCount: projectsAsPM.length,
        poCount: projectsAsPO.length,
        role: name === 'HieuNT' ? 'Product Lead' : 'Product Manager'
      };
    }).sort((a, b) => b.total - a.total);
  }, [projects]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {memberStats.map((member) => (
          <div key={member.name} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-[#9f224e] transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-50 flex items-center justify-center font-bold text-[#9f224e] text-lg shadow-inner group-hover:bg-[#fff0f3] group-hover:border-[#9f224e]/20 transition-colors">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">{member.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{member.role}</p>
                </div>
              </div>
              {member.active > 0 && (
                <span className="bg-[#9f224e] text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {member.active} ACTIVE
                </span>
              )}
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-500 font-medium">Tổng dự án:</span>
                <span className="font-bold text-slate-900">{member.total}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#9f224e] h-full transition-all duration-500" 
                  style={{ width: `${Math.min((member.total / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Làm PM</p>
                  <p className="text-sm font-bold text-slate-700">{member.pmCount}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Làm PO</p>
                  <p className="text-sm font-bold text-slate-700">{member.poCount}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberHub;
