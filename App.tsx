
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DEPARTMENTS, TEAM_MEMBERS, MOCK_PROJECTS } from './constants';
import { Project, ProjectStatus, ProjectType } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectTable from './components/ProjectTable';
import AIAssistant from './components/AIAssistant';
import MemberHub from './components/MemberHub';

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?output=tsv";

const REFRESH_INTERVAL = 120000; // 2 minutes auto-refresh

// Cache keys
const CACHE_KEY_PROJECTS = 'vne_pms_projects';
const CACHE_KEY_LAST_UPDATED = 'vne_pms_last_updated';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'team'>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  // New Project Form State
  const [newProject, setNewProject] = useState<Partial<Project>>({
    year: 2026,
    type: ProjectType.NEW,
    status: ProjectStatus.PLANNING,
    phase: 'Initialization',
    quarter: 1,
    department: DEPARTMENTS[0],
    pm: TEAM_MEMBERS[0],
    po: TEAM_MEMBERS[1],
    designer: TEAM_MEMBERS[2],
    code: '',
    description: '',
    kpi: '',
    techHandoff: '',
    releaseDate: '',
    notes: ''
  });

  // --- Normalization Helpers ---

  const normalizeStatus = (statusStr: string): ProjectStatus => {
    const s = (statusStr || '').toLowerCase().trim();
    
    // English Mapping
    if (s.includes('not started')) return ProjectStatus.NOT_STARTED;
    if (s.includes('in progress')) return ProjectStatus.IN_PROGRESS;
    if (s.includes('done')) return ProjectStatus.DONE;
    if (s.includes('pending')) return ProjectStatus.PENDING;
    if (s.includes('re-open')) return ProjectStatus.RE_OPEN;
    if (s.includes('ios done')) return ProjectStatus.IOS_DONE;
    if (s.includes('android done')) return ProjectStatus.ANDROID_DONE;
    if (s.includes('cancelled')) return ProjectStatus.CANCELLED;
    if (s.includes('hand-off')) return ProjectStatus.HAND_OFF;
    if (s.includes('planning')) return ProjectStatus.PLANNING;
    
    // Vietnamese Mapping
    if (s.includes('đang làm') || s.includes('đang thực hiện') || s.includes('đang chạy')) return ProjectStatus.IN_PROGRESS;
    if (s.includes('hoàn thành') || s.includes('đã xong') || s.includes('xong')) return ProjectStatus.DONE;
    if (s.includes('chờ') || s.includes('tạm dừng')) return ProjectStatus.PENDING;
    if (s.includes('hủy')) return ProjectStatus.CANCELLED;
    if (s.includes('bàn giao')) return ProjectStatus.HAND_OFF;
    if (s.includes('kế hoạch') || s.includes('dự kiến')) return ProjectStatus.PLANNING;
    if (s.includes('chưa')) return ProjectStatus.NOT_STARTED;

    return ProjectStatus.PLANNING; // Default fallback
  };

  const normalizeType = (typeStr: string): ProjectType => {
    const t = (typeStr || '').toUpperCase().trim();
    if (t.includes('ANN') || t.includes('THƯỜNG NIÊN') || t.includes('ANNUAL')) return ProjectType.ANNUAL;
    if (t.includes('CHIẾN LƯỢC') || t.includes('STRATEGIC') || t.includes('STR')) return ProjectType.STRATEGIC;
    return ProjectType.NEW;
  };

  const parseQuarter = (qStr: string): number => {
    const q = (qStr || '').toUpperCase();
    if (q.includes('Q1') || q === '1') return 1;
    if (q.includes('Q2') || q === '2') return 2;
    if (q.includes('Q3') || q === '3') return 3;
    if (q.includes('Q4') || q === '4') return 4;
    return 1;
  };

  // --- Data Fetching ---

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const cacheBuster = `t=${Date.now()}`;
      const response = await fetch(`${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}${cacheBuster}`);

      if (!response.ok) throw new Error("Failed to fetch data");

      const tsvText = await response.text();
      
      // Basic check for HTML error responses
      if (tsvText.trim().startsWith('<') || tsvText.includes('<!DOCTYPE html')) {
        throw new Error("Received HTML instead of TSV data");
      }

      // Robust splitting for different newline formats
      const rows = tsvText.split(/\r?\n/).map(row => row.split('\t'));

      // --- Dynamic Header Detection ---
      // Try to find the header row to map columns dynamically
      let headerRowIndex = -1;
      const colMap: Record<string, number> = {};

      for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const rowLower = rows[i].map(c => c.toLowerCase().trim());
        // Heuristic: Look for row containing typical headers
        if (
          rowLower.some(c => c.includes('tên') || c.includes('project') || c.includes('mô tả')) && 
          rowLower.some(c => c.includes('pm') || c.includes('quản trị') || c.includes('product'))
        ) {
          headerRowIndex = i;
          rows[i].forEach((cell, idx) => {
             const c = cell.toLowerCase().trim();
             if (c.includes('stt') || c === 'no' || c === '#') colMap['code'] = idx;
             if (c.includes('loại') || c.includes('type')) colMap['type'] = idx;
             if (c.includes('tên') || c.includes('project') || c.includes('mô tả') || c.includes('description')) colMap['description'] = idx;
             if (c.includes('giai đoạn') || c.includes('phase')) colMap['phase'] = idx;
             if (c.includes('bộ phận') || c.includes('dept') || c.includes('folder')) colMap['department'] = idx;
             if (c.includes('yêu cầu') || c.includes('owner') || c.includes('request')) colMap['po'] = idx;
             if (c.includes('tech') || c.includes('handoff')) colMap['techHandoff'] = idx;
             if (c.includes('release') || c.includes('golive') || c.includes('ngày')) colMap['releaseDate'] = idx;
             if (c.includes('quý') || c.includes('quarter')) colMap['quarter'] = idx;
             if (c.includes('pm') || c.includes('product manager')) colMap['pm'] = idx;
             if (c.includes('designer') || c.includes('ui') || c.includes('ux')) colMap['designer'] = idx;
             if (c.includes('trạng thái') || c.includes('status')) colMap['status'] = idx;
             if (c.includes('kpi') || c.includes('okr')) colMap['kpi'] = idx;
          });
          break;
        }
      }

      // Fallback if no header found (Use fixed indices based on user provided sheet structure)
      if (headerRowIndex === -1) {
        colMap['code'] = 0;
        colMap['type'] = 1;
        colMap['description'] = 2;
        colMap['phase'] = 3;
        colMap['department'] = 4;
        colMap['po'] = 5;
        colMap['techHandoff'] = 6;
        colMap['releaseDate'] = 8;
        colMap['quarter'] = 10;
        colMap['pm'] = 11;
        colMap['designer'] = 12;
        colMap['status'] = 13;
        headerRowIndex = 0; // Assume first row is header or data starts shortly after
      }

      // --- Parsing Rows ---
      const parsedProjects: Project[] = rows
        .slice(headerRowIndex + 1) // Skip header
        .filter(r => {
           // Relaxed Filter: 
           // 1. Must have content in Description column
           const desc = (r[colMap['description']] || '').trim();
           // 2. Or must have content in Code column
           const code = (r[colMap['code']] || '').trim();
           
           return desc.length > 0 || (code.length > 0 && code !== 'Total');
        })
        .map((row, idx) => {
          const getVal = (key: string) => (row[colMap[key]] || '').trim();

          const releaseDate = getVal('releaseDate');
          const techHandoff = getVal('techHandoff');
          const quarterStr = getVal('quarter');
          
          // Year Logic
          let year = 2026;
          const dateStr = (releaseDate + techHandoff + quarterStr).toUpperCase();
          
          if (dateStr.includes('/25') || dateStr.includes('2025') || quarterStr.includes('25')) {
             year = 2025;
          } else if (dateStr.includes('/24') || dateStr.includes('2024')) {
             year = 2024;
          } 
          // Default to 2026

          return {
            id: `p-${idx}`,
            code: getVal('code') || `${idx + 1}`,
            year,
            description: getVal('description') || 'Untitled Project',
            type: normalizeType(getVal('type')),
            department: getVal('department') || 'General',
            status: normalizeStatus(getVal('status')),
            phase: getVal('phase'),
            quarter: parseQuarter(quarterStr),
            techHandoff,
            releaseDate,
            pm: getVal('pm'),
            designer: getVal('designer'),
            po: getVal('po'),
            kpi: getVal('kpi'), 
            dashboardUrl: '',
            notes: ''
          };
        });

      if (parsedProjects.length > 0) {
        console.log(`Successfully parsed ${parsedProjects.length} projects.`);
        setProjects(parsedProjects);
        
        const now = new Date();
        setLastUpdated(now);
        localStorage.setItem(CACHE_KEY_PROJECTS, JSON.stringify(parsedProjects));
        localStorage.setItem(CACHE_KEY_LAST_UPDATED, now.toISOString());
      } else {
        console.warn("Fetched data but found 0 valid projects. Falling back to Cache or Mock.");
        // Try to recover from cache if fetch returns empty (rare but possible with network glitches)
        const cached = localStorage.getItem(CACHE_KEY_PROJECTS);
        if (cached) setProjects(JSON.parse(cached));
        else setProjects(MOCK_PROJECTS);
      }

    } catch (error) {
      console.error("Data sync error:", error);
      // Fallback
      const cached = localStorage.getItem(CACHE_KEY_PROJECTS);
      if (cached) {
          setProjects(JSON.parse(cached));
      } else {
          setProjects(MOCK_PROJECTS);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => fetchData(true), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchData]);

  // --- Filtering & Handlers ---

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.year === selectedYear && (
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [projects, selectedYear, searchQuery]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const projectToAdd: Project = {
      ...newProject,
      id: `local-${Date.now()}`,
      year: selectedYear,
    } as Project;
    setProjects(prev => [projectToAdd, ...prev]);
    setIsAddingProject(false);
    alert('Project added locally. Please update the Google Sheet.');
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans text-slate-900">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-[#9f224e]'}`}></span>
              <span className="text-[10px] font-black uppercase text-[#9f224e] tracking-[0.2em]">
                {isRefreshing ? 'Syncing...' : 'VnExpress P&T System'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight">
              {activeView === 'dashboard' ? `Report ${selectedYear}` : 
               activeView === 'projects' ? 'Project Plan' : 'Member Hub'}
            </h1>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex bg-slate-200 p-1 rounded-xl inline-flex">
                {[2025, 2026].map(yr => (
                  <button 
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-8 py-1.5 text-xs font-black rounded-lg transition-all ${selectedYear === yr ? 'bg-[#9f224e] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
              <div className="flex flex-col border-l border-slate-300 pl-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  Total Projects
                  </span>
                  <span className="text-[11px] font-black text-slate-600">
                  {projects.filter(p => p.year === selectedYear).length} Records
                  </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => fetchData()} 
              disabled={isRefreshing}
              className={`p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#9f224e] transition-all shadow-sm active:scale-90 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Force Refresh"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => setIsAddingProject(true)} className="bg-[#9f224e] text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-[#851a40] transition-all transform active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              NEW PROJECT
            </button>
          </div>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#9f224e] rounded-full animate-spin"></div>
            <p className="text-slate-400 font-black mt-6 text-[11px] uppercase tracking-[0.3em] animate-pulse">Syncing Google Sheets...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} />}
            
            {(activeView === 'projects') && (
              <div className="space-y-6">
                 <div className="relative max-w-md">
                    <input 
                      type="text" 
                      placeholder="Search projects, PM, Department..." 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-[#9f224e]/20 transition-all" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                    <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 
                 <ProjectTable projects={filteredProjects} onSelectProject={setSelectedProject} />
              </div>
            )}
            
            {activeView === 'team' && <MemberHub projects={projects.filter(p => p.year === selectedYear)} />}
          </div>
        )}
      </main>

      <AIAssistant projects={projects.filter(p => p.year === selectedYear)} />

      {/* MODAL: ADD PROJECT */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-black text-slate-900">Initialize Project {selectedYear}</h2>
              <button onClick={() => setIsAddingProject(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                 <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>Note: This will add the project locally. To save permanently, please update Google Sheets.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Project No.</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Ex: 5" onChange={e => setNewProject({...newProject, code: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Type</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})}>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Detailed project name..." onChange={e => setNewProject({...newProject, description: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Department (Folder)</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => setNewProject({...newProject, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Product Manager</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => setNewProject({...newProject, pm: e.target.value})}>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t">
                <button type="button" onClick={() => setIsAddingProject(false)} className="px-6 py-3 font-black text-slate-400 hover:text-slate-600">CANCEL</button>
                <button type="submit" className="px-10 py-3 bg-[#9f224e] text-white rounded-xl font-black shadow-lg hover:bg-[#851a40] transform active:scale-95 transition-all">ADD</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROJECT DETAIL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in">
            <div className="p-8 border-b flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-[#9f224e] uppercase tracking-widest bg-[#fff0f3] px-3 py-1 rounded-full">Project Review</span>
                <h2 className="text-2xl font-black text-slate-900 mt-2 leading-tight">{selectedProject.description}</h2>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Project No.</p>
                    <p className="font-mono text-base font-bold text-slate-800">{selectedProject.code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Type</p>
                    <p className="text-base font-black text-slate-800">{selectedProject.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                    <p className="text-base font-black text-[#9f224e]">{selectedProject.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Phase</p>
                    <p className="text-sm font-bold text-slate-700">{selectedProject.phase || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Personnel</p>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">PM: {selectedProject.pm}</p>
                      <p className="text-sm font-bold text-slate-800">PO: {selectedProject.po}</p>
                      <p className="text-sm text-slate-500">Designer: {selectedProject.designer}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Release Timeline</p>
                    <p className="text-sm font-black text-emerald-600">{selectedProject.releaseDate || 'TBA'}</p>
                    <p className="text-xs text-slate-400 mt-1">Tech HO: {selectedProject.techHandoff}</p>
                    <p className="text-xs text-slate-400">Quarter: Q{selectedProject.quarter}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                  <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Department / Folder</span>
                  {selectedProject.department}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
