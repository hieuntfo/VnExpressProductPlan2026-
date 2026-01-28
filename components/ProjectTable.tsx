import React from 'react';
import { Project, ProjectStatus, ProjectPriority } from '../types';

interface ProjectTableProps {
  projects: Project[];
  selectedYear: number;
  onSelectProject: (project: Project) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, selectedYear, onSelectProject }) => {
  const getStatusBadge = (status: ProjectStatus) => {
    const styles: Record<ProjectStatus, string> = {
      [ProjectStatus.NOT_STARTED]: 'text-slate-400 bg-slate-500/10 border-slate-500/20 shadow-none',
      [ProjectStatus.IN_PROGRESS]: 'text-sky-300 bg-sky-500/10 border-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.3)]',
      [ProjectStatus.DONE]: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
      [ProjectStatus.PENDING]: 'text-amber-300 bg-amber-500/10 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
      [ProjectStatus.RE_OPEN]: 'text-rose-300 bg-rose-500/10 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
      [ProjectStatus.IOS_DONE]: 'text-violet-300 bg-violet-500/10 border-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.3)]',
      [ProjectStatus.ANDROID_DONE]: 'text-lime-300 bg-lime-500/10 border-lime-500/20 shadow-[0_0_8px_rgba(132,204,22,0.3)]',
      [ProjectStatus.CANCELLED]: 'text-slate-500 bg-slate-500/10 border-slate-500/20 line-through shadow-none',
      [ProjectStatus.HAND_OFF]: 'text-pink-300 bg-pink-500/10 border-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.3)]',
      [ProjectStatus.PLANNING]: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    };
     const lightStyles: Record<ProjectStatus, string> = {
      [ProjectStatus.NOT_STARTED]: 'text-slate-500 bg-slate-100 border-slate-200',
      [ProjectStatus.IN_PROGRESS]: 'text-sky-600 bg-sky-100 border-sky-200',
      [ProjectStatus.DONE]: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      [ProjectStatus.PENDING]: 'text-amber-600 bg-amber-100 border-amber-200',
      [ProjectStatus.RE_OPEN]: 'text-rose-600 bg-rose-100 border-rose-200',
      [ProjectStatus.IOS_DONE]: 'text-violet-600 bg-violet-100 border-violet-200',
      [ProjectStatus.ANDROID_DONE]: 'text-lime-600 bg-lime-100 border-lime-200',
      [ProjectStatus.CANCELLED]: 'text-slate-400 bg-slate-100 border-slate-200 line-through',
      [ProjectStatus.HAND_OFF]: 'text-pink-600 bg-pink-100 border-pink-200',
      [ProjectStatus.PLANNING]: 'text-cyan-600 bg-cyan-100 border-cyan-200',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider whitespace-nowrap dark:${styles[status]} ${lightStyles[status]}`}>
        {status}
      </span>
    );
  };
  
  const getPriorityBadge = (priority: ProjectPriority) => {
    if (priority === ProjectPriority.NONE) return null;
    const styles: Record<ProjectPriority, string> = {
      [ProjectPriority.HIGHEST]: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
      [ProjectPriority.HIGH]: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
      [ProjectPriority.MEDIUM]: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
      [ProjectPriority.LOW]: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      [ProjectPriority.NONE]: 'hidden',
    };
    const lightStyles: Record<ProjectPriority, string> = {
      [ProjectPriority.HIGHEST]: 'text-rose-600 bg-rose-100 border-rose-200',
      [ProjectPriority.HIGH]: 'text-amber-600 bg-amber-100 border-amber-200',
      [ProjectPriority.MEDIUM]: 'text-sky-600 bg-sky-100 border-sky-200',
      [ProjectPriority.LOW]: 'text-slate-500 bg-slate-100 border-slate-200',
      [ProjectPriority.NONE]: 'hidden',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider whitespace-nowrap dark:${styles[priority]} ${lightStyles[priority]}`}>
        P{ { [ProjectPriority.HIGHEST]: 0, [ProjectPriority.HIGH]: 1, [ProjectPriority.MEDIUM]: 2, [ProjectPriority.LOW]: 3 }[priority] } - {priority}
      </span>
    );
  };


  const getQuarterBadge = (q: number) => (
    <span className="bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/80 dark:text-slate-200 dark:border-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase border shadow-sm">
      Q{q}
    </span>
  );

  return (
    <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl glow-border overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-300/80 dark:border-slate-700/50">
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] w-16">No.</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Project / Description</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Dept / Type</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">PM / Request</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Status / Priority</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">Timeline</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/40">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 group">
                <td className="px-6 py-5">
                  <span className="font-mono text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">#{project.code}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col max-w-xs">
                    <button onClick={() => onSelectProject(project)} className="text-left text-[15px] font-bold text-slate-800 dark:text-white leading-tight truncate hover:text-vne-primary transition-all focus:outline-none" title="Click to view details">{project.description}</button>
                    <div className="flex gap-2 mt-2 items-center">
                       {getQuarterBadge(project.quarter)}
                       {project.year !== selectedYear && project.status === ProjectStatus.RE_OPEN && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-700">
                            FROM {project.year}
                          </span>
                       )}
                       <span className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{project.phase}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col">
                      <span className="text-sm text-slate-700 dark:text-slate-200 font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{project.department}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{project.type}</span>
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col text-[12px]">
                    <span className="text-slate-700 dark:text-slate-200 font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">PM: {project.pm}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[120px]" title={project.po}>Req: {project.po}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5 items-start">
                    {getStatusBadge(project.status)}
                    {getPriorityBadge(project.priority)}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>HO: {project.techHandoff || '-'}</span>
                    <span className="font-bold text-vne-primary flex items-center gap-1.5 mt-1.5"><span className="w-1.5 h-1.5 rounded-full bg-vne-primary shadow-[0_0_5px_var(--vne-primary)]"></span>Rel: {project.releaseDate || '-'}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button onClick={() => onSelectProject(project)} className="p-2 text-slate-400 hover:text-white hover:bg-vne-primary rounded-xl transition-all shadow-sm border border-transparent hover:shadow-[0_0_15px_var(--vne-glow)] transform hover:scale-105 active:scale-95" title="View Details">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-32 text-center text-slate-400 italic font-medium">
                  <div className="flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 8-8-8" /></svg>
                    <span>No projects found for the selected filters.</span>
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