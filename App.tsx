
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

  const normalizeStatus = (statusStr: string): ProjectStatus => {
    const s = (statusStr || '').trim();
    const map: Record<string, ProjectStatus> = {
      'Not Started': ProjectStatus.NOT_STARTED,
      'In Progress': ProjectStatus.IN_PROGRESS,
      'Done': ProjectStatus.DONE,
      'Pending': ProjectStatus.PENDING,
      'Re-Open': ProjectStatus.RE_OPEN,
      'iOS Done': ProjectStatus.IOS_DONE,
      'Android Done': ProjectStatus.ANDROID_DONE,
      'Cancelled': ProjectStatus.CANCELLED,
      'Hand-Off': ProjectStatus.HAND_OFF,
      'Planning': ProjectStatus.PLANNING,
    };
    return map[s] || (s ? ProjectStatus.PLANNING : ProjectStatus.NOT_STARTED);
  };

  const normalizeType = (typeStr: string): ProjectType => {
    const t = (typeStr || '').toUpperCase().trim();
    if (t.includes('ANN') || t.includes('THƯỜNG NIÊN')) return ProjectType.ANNUAL;
    if (t.includes('CHIẾN LƯỢC') || t.includes('STRATEGIC')) return ProjectType.STRATEGIC;
    return ProjectType.NEW;
  };

  const parseQuarter = (qStr: string): number => {
    const q = (qStr || '').toUpperCase();
    if (q.includes('Q1')) return 1;
    if (q.includes('Q2')) return 2;
    if (q.includes('Q3')) return 3;
    if (q.includes('Q4')) return 4;
    return 1;
  };

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const cacheBuster = `t=${Date.now()}`;
      const fetchOptions = { cache: 'no-store' as RequestCache };

      const response = await fetch(`${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}${cacheBuster}`, fetchOptions);

      if (!response.ok) {
        throw new Error("Failed to fetch data from Google Sheets");
      }

      const tsvText = await response.text();
      
      // Check if response is actually HTML (Google Sheets sometimes returns HTML on error)
      if (tsvText.trim().startsWith('<!DOCTYPE html') || tsvText.includes('<html')) {
        throw new Error("Received HTML instead of TSV");
      }

      const rows = tsvText.split('\n').map(row => row.split('\t'));

      // Filter and Map
      const parsedProjects: Project[] = rows
        .filter(r => {
           // Improved Filter:
           // 1. Must have enough columns (at least 3: No, Type, Desc)
           if (r.length < 3) return false;
           
           // 2. Column A (Index) must be a number. 
           // We use this to distinguish data rows from headers or category rows.
           const colA = (r[0] || '').trim();
           if (!colA || isNaN(Number(colA))) return false;

           // 3. Must have a description
           const desc = (r[2] || '').trim();
           return desc.length > 0;
        })
        .map((row, idx) => {
          // Safe access to columns
          const getCol = (i: number) => (row[i] || '').trim();

          const indexNum = getCol(0);
          const typeStr = getCol(1);
          const description = getCol(2);
          const phase = getCol(3);
          const department = getCol(4);
          const requestOwner = getCol(5);
          const techHandoff = getCol(6);
          // Col 7 is empty/padding
          const releaseDate = getCol(8);
          // Col 9 is empty/padding
          const quarterStr = getCol(10);
          const pm = getCol(11);
          const designer = getCol(12);
          const statusStr = getCol(13);
          
          let year = 2026;
          // Improved Year Detection
          const dateStr = (releaseDate + techHandoff + quarterStr).toUpperCase();
          
          if (dateStr.includes('/25') || dateStr.includes('2025') || quarterStr.startsWith('25')) {
             year = 2025;
          } else if (dateStr.includes('/26') || dateStr.includes('2026') || quarterStr.startsWith('26')) {
             year = 2026;
          } else {
             // Fallback logic
             year = 2026; 
          }
          
          return {
            id: `p-${indexNum}-${idx}`,
            code: indexNum,
            year,
            description,
            type: normalizeType(typeStr),
            department: department || 'General',
            status: normalizeStatus(statusStr),
            phase,
            quarter: parseQuarter(quarterStr),
            techHandoff,
            releaseDate,
            pm,
            designer,
            po: requestOwner,
            kpi: '', 
            dashboardUrl: '',
            notes: ''
          };
        });

      if (parsedProjects.length > 0) {
        setProjects(parsedProjects);
        const now = new Date();
        setLastUpdated(now);
        localStorage.setItem(CACHE_KEY_PROJECTS, JSON.stringify(parsedProjects));
        localStorage.setItem(CACHE_KEY_LAST_UPDATED, now.toISOString());
      } else {
        console.warn("Parsed 0 projects. Format might have changed.");
        // If we really find nothing, keep existing or fallback if empty
        if (projects.length === 0) {
             const cached = localStorage.getItem(CACHE_KEY_PROJECTS);
             if (cached) setProjects(JSON.parse(cached));
             else setProjects(MOCK_PROJECTS); // Last resort
        }
      }

    } catch (error) {
      console.error("Data sync error:", error);
      // Fallback on error
      if (projects.length === 0) {
          const cachedProjects = localStorage.getItem(CACHE_KEY_PROJECTS);
          if (cachedProjects) {
              setProjects(JSON.parse(cachedProjects));
          } else {
              setProjects(MOCK_PROJECTS);
          }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projects.length]);

  useEffect(() => {
    // Initial Load
    fetchData();

    // Auto Refresh
    const timer = setInterval(() => {
      fetchData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.year === selectedYear && (
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.designer.toLowerCase().includes(searchQuery.toLowerCase())
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
    alert('Project added temporarily. Please update Google Sheets to save permanently.');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-[#9f224e]'}`}></span>
              <span className="text-[10px] font-black uppercase text-[#9f224e] tracking-[0.2em]">
                {isRefreshing ? 'Syncing Sheet...' : 'VnExpress P&T System'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#1a1a1a]">
              {activeView === 'dashboard' ? `Report ${selectedYear}` : 
               activeView === 'projects' ? 'Product Plan' : 'Member Hub'}
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
              {lastUpdated && (
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    Last updated
                    </span>
                    <span className="text-[11px] font-black text-slate-600">
                    {lastUpdated.toLocaleTimeString('en-US')}
                    </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => fetchData()} 
              disabled={isRefreshing}
              className={`p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#9f224e] transition-all shadow-sm active:scale-90 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh Data"
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
            <p className="text-slate-400 font-black mt-6 text-[11px] uppercase tracking-[0.3em] animate-pulse">Fetching from Sheet...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} />}
            
            {(activeView === 'projects') && (
              <div className="space-y-6">
                 <div className="relative max-w-md">
                    <input 
                      type="text" 
                      placeholder="Search projects..." 
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
                 <p>Note: This will add the project temporarily. To save permanently, please update Google Sheets.</p>
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
                <button type="submit" className="px-10 py-3 bg-[#9f224e] text-white rounded-xl font-black shadow-lg hover:bg-[#851a40] transform active:scale-95 transition-all">ADD TEMP</button>
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
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Personnel</p>
                    <p className="text-sm font-bold text-slate-800">PM: {selectedProject.pm} | PO: {selectedProject.po}</p>
                    <p className="text-xs text-slate-400 mt-1">Designer: {selectedProject.designer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Release Timeline</p>
                    <p className="text-sm font-black text-emerald-600">{selectedProject.releaseDate || 'TBA'}</p>
                    <p className="text-xs text-slate-400 mt-1">Tech HO: {selectedProject.techHandoff}</p>
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
