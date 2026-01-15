
import React from 'react';
import { Project, ProjectStatus } from '../types';

interface ProjectTableProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onSelectProject }) => {
  const getStatusBadge = (status: ProjectStatus) => {
    const styles: Record<ProjectStatus, string> = {
      [ProjectStatus.NOT_STARTED]: 'bg-slate-100 text-slate-600 border-slate-200',
      [ProjectStatus.IN_PROGRESS]: 'bg-blue-50 text-blue-700 border-blue-100',
      [ProjectStatus.DONE]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      [ProjectStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-100',
      [ProjectStatus.RE_OPEN]: 'bg-red-50 text-red-700 border-red-100',
      [ProjectStatus.IOS_DONE]: 'bg-purple-50 text-purple-700 border-purple-100',
      [ProjectStatus.ANDROID_DONE]: 'bg-green-50 text-green-700 border-green-100',
      [ProjectStatus.CANCELLED]: 'bg-slate-900 text-slate-100 border-slate-800',
      [ProjectStatus.HAND_OFF]: 'bg-[#9f224e] text-white border-[#9f224e]',
      [ProjectStatus.PLANNING]: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    };
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider whitespace-nowrap ${styles[status] || 'bg-slate-50 text-slate-500'}`}>
        {status}
      </span>
    );
  };

  const getQuarterBadge = (q: number) => (
    <span className="bg-[#222] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
      Q{q}
    </span>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mã / Dự án</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Chuyên mục</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">PM / PO</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Mốc thời gian</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col max-w-xs">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{project.code}</span>
                    <span className="font-bold text-slate-900 leading-tight truncate" title={project.description}>{project.description}</span>
                    <div className="flex gap-2 mt-1.5 items-center">
                       {getQuarterBadge(project.quarter)}
                       <span className="text-[10px] text-slate-400 italic font-medium truncate">{project.phase || project.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">{project.department}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-[12px]">
                    <span className="text-slate-800 font-bold">PM: {project.pm}</span>
                    <span className="text-slate-400 font-medium">PO: {project.po}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    {getStatusBadge(project.status)}
                    {project.phase && (
                      <span className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-[100px]" title={project.phase}>
                        {project.phase}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                      HO: {project.techHandoff || 'TBA'}
                    </span>
                    <span className="font-bold text-[#9f224e] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9f224e]"></span>
                      Rel: {project.releaseDate || 'TBA'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onSelectProject(project)}
                    className="p-2 text-slate-400 hover:text-[#9f224e] hover:bg-[#fff0f3] rounded-lg transition-all shadow-sm border border-transparent hover:border-[#9f224e]/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 8-8-8" /></svg>
                    <span>Không tìm thấy dự án nào phù hợp với bộ lọc cho năm này.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;
