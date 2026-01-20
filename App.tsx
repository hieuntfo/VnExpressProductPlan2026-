
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DEPARTMENTS, TEAM_MEMBERS, MOCK_PROJECTS, GOOGLE_SCRIPT_URL } from './constants';
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
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterPM, setFilterPM] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterQuarter, setFilterQuarter] = useState<string>('All');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle ESC Key to close modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setIsAddingProject(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
      
      if (tsvText.trim().startsWith('<') || tsvText.includes('<!DOCTYPE html')) {
        throw new Error("Received HTML instead of TSV data");
      }

      const rows = tsvText.split(/\r?\n/).map(row => row.split('\t'));

      let headerRowIndex = -1;
      const colMap: Record<string, number> = {};

      for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const rowLower = rows[i].map(c => c.toLowerCase().trim());
        if (
          (rowLower.some(c => c.includes('tên') || c.includes('project') || c.includes('mô tả') || c.includes('description') || c.includes('issue'))) && 
          (rowLower.some(c => c.includes('pm') || c.includes('quản trị') || c.includes('product') || c.includes('request') || c.includes('owner')))
        ) {
          headerRowIndex = i;
          rows[i].forEach((cell, idx) => {
             const c = cell.toLowerCase().trim();
             if (c.includes('stt') || c === 'no' || c === '#') colMap['code'] = idx;
             if (c.includes('loại') || c.includes('type')) colMap['type'] = idx;
             if (c.includes('issue') || c.includes('description') || c === 'mô tả' || c === 'project name') colMap['description'] = idx;
             else if (!colMap['description'] && c.includes('tên dự án')) colMap['description'] = idx;
             if (c.includes('giai đoạn') || c.includes('phase')) colMap['phase'] = idx;
             if (c.includes('bộ phận') || c.includes('dept') || c.includes('folder')) colMap['department'] = idx;
             if (c.includes('yêu cầu') || c.includes('owner') || c.includes('request')) colMap['po'] = idx;
             if (c.includes('tech') || c.includes('handoff')) colMap['techHandoff'] = idx;
             if (c.includes('release') || c.includes('golive') || c.includes('ngày') || c.includes('date')) colMap['releaseDate'] = idx;
             if (c.includes('quý') || c.includes('quarter')) colMap['quarter'] = idx;
             if (c === 'product' || c === 'pm' || c.includes('product manager') || c.includes('quản trị')) colMap['pm'] = idx;
             if (c.includes('designer') || c.includes('ui') || c.includes('ux')) colMap['designer'] = idx;
             if (c.includes('trạng thái') || c.includes('status')) colMap['status'] = idx;
             if (c.includes('kpi') || c.includes('okr')) colMap['kpi'] = idx;
          });
          break;
        }
      }

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
        colMap['pm'] = 12; 
        colMap['designer'] = 13;
        colMap['status'] = 14; 
        colMap['kpi'] = 18; 
        headerRowIndex = 0;
      }

      const parsedProjects: Project[] = rows
        .slice(headerRowIndex + 1)
        .filter(r => {
           const desc = (r[colMap['description']] || '').trim();
           const code = (r[colMap['code']] || '').trim();
           const lowerDesc = desc.toLowerCase();
           const lowerCode = code.toLowerCase();
           if (
             lowerDesc === 'issue description' || 
             lowerDesc === 'description' || 
             lowerDesc === 'mô tả' || 
             lowerDesc === 'tên dự án' || 
             lowerDesc === 'project name' ||
             lowerCode === 'no' || 
             lowerCode === 'stt' ||
             lowerCode === 'code' ||
             lowerDesc === 'project plan'
           ) {
             return false;
           }
           return desc.length > 0 || (code.length > 0 && code !== 'Total');
        })
        .map((row, idx) => {
          const getVal = (key: string) => (row[colMap[key]] || '').trim();
          const releaseDate = getVal('releaseDate');
          const techHandoff = getVal('techHandoff');
          const quarterStr = getVal('quarter');
          let year = 2026;
          const dateStr = (releaseDate + techHandoff + quarterStr).toUpperCase();
          if (dateStr.includes('/25') || dateStr.includes('2025') || quarterStr.includes('25')) {
             year = 2025;
          } else if (dateStr.includes('/24') || dateStr.includes('2024')) {
             year = 2024;
          } 
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
        setProjects(parsedProjects);
        const now = new Date();
        setLastUpdated(now);
        localStorage.setItem(CACHE_KEY_PROJECTS, JSON.stringify(parsedProjects));
        localStorage.setItem(CACHE_KEY_LAST_UPDATED, now.toISOString());
      } else {
        const cached = localStorage.getItem(CACHE_KEY_PROJECTS);
        if (cached) setProjects(JSON.parse(cached));
        else setProjects(MOCK_PROJECTS);
      }

    } catch (error) {
      console.error("Data sync error:", error);
      const cached = localStorage.getItem(CACHE_KEY_PROJECTS);
      if (cached) setProjects(JSON.parse(cached));
      else setProjects(MOCK_PROJECTS);
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

  // --- Unique Lists for Filters ---
  const { uniqueDepts, uniquePMs, uniqueStatuses } = useMemo(() => {
    const currentProjects = projects.filter(p => p.year === selectedYear);
    const depts = Array.from(new Set(currentProjects.map(p => p.department))).filter(Boolean).sort();
    const pms = Array.from(new Set(currentProjects.map(p => p.pm))).filter(Boolean).sort();
    const statuses = Object.values(ProjectStatus);
    return { uniqueDepts: depts, uniquePMs: pms, uniqueStatuses: statuses };
  }, [projects, selectedYear]);

  // --- Filter Logic ---
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // 1. Year Filter
      if (p.year !== selectedYear) return false;

      // 2. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          p.description.toLowerCase().includes(q) || 
          p.code.toLowerCase().includes(q) ||
          p.pm.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 3. Dropdown Filters
      if (filterDept !== 'All' && p.department !== filterDept) return false;
      if (filterType !== 'All' && p.type !== filterType) return false;
      if (filterPM !== 'All' && p.pm !== filterPM) return false;
      if (filterStatus !== 'All' && p.status !== filterStatus) return false;
      if (filterQuarter !== 'All' && p.quarter !== parseInt(filterQuarter)) return false;

      return true;
    });
  }, [projects, selectedYear, searchQuery, filterDept, filterType, filterPM, filterStatus, filterQuarter]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 1. Optimistic UI Update (Local)
    const projectToAdd: Project = {
      ...newProject,
      id: `local-${Date.now()}`,
      year: selectedYear,
    } as Project;
    
    setProjects(prev => [projectToAdd, ...prev]);

    // 2. Push to Google Sheet
    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: newProject.code,
            type: newProject.type,
            description: newProject.description,
            department: newProject.department,
            pm: newProject.pm
          })
        });
        alert('Đã gửi yêu cầu thêm dự án lên Google Sheet thành công! Dữ liệu sẽ xuất hiện sau ít phút.');
      } catch (error) {
        console.error("Failed to push to Google Sheet", error);
        alert('Lỗi kết nối tới Google Sheet. Dự án chỉ được lưu tạm thời trên trình duyệt.');
      }
    } else {
      alert('Dự án đã được thêm cục bộ. Để lưu vĩnh viễn, hãy cấu hình GOOGLE_SCRIPT_URL trong constants.ts.');
    }

    setIsSubmitting(false);
    setIsAddingProject(false);
  };

  const resetFilters = () => {
    setFilterDept('All');
    setFilterType('All');
    setFilterPM('All');
    setFilterStatus('All');
    setFilterQuarter('All');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#151e32] flex font-sans text-slate-200 selection:bg-[#9f224e] selection:text-white relative overflow-hidden">
      {/* GLOBAL LIGHTING EFFECT */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#334155,transparent_70%)] opacity-40 pointer-events-none z-0"></div>
      
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 ml-64 p-10 relative z-10 transition-all duration-300">
        {/* Ambient Glows - Lightened and Softer */}
        <div className="fixed top-0 left-64 right-0 h-96 bg-gradient-to-b from-[#9f224e]/10 to-transparent pointer-events-none z-0"></div>
        <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <header className="flex items-center justify-between mb-10 pb-6 relative z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-[#9f224e] shadow-[0_0_8px_#9f224e]'}`}></span>
              <span className="text-[10px] font-black uppercase text-[#9f224e] tracking-[0.3em]">
                {isRefreshing ? 'Syncing...' : 'Live System'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              {activeView === 'dashboard' ? `Report ${selectedYear}` : 
               activeView === 'projects' ? 'Project Plan' : 'Member Hub'}
            </h1>
            
            <div className="flex items-center gap-6 mt-6">
              <div className="flex bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 p-1 rounded-xl inline-flex shadow-sm">
                {[2025, 2026].map(yr => (
                  <button 
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-8 py-2 text-xs font-black rounded-lg transition-all ${selectedYear === yr ? 'bg-[#9f224e] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
              <div className="flex flex-col border-l border-slate-700/50 pl-6">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Projects
                  </span>
                  <span className="text-sm font-black text-white">
                  {projects.filter(p => p.year === selectedYear).length} <span className="text-slate-400 text-xs font-normal">Records</span>
                  </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => fetchData()} 
              disabled={isRefreshing}
              className={`p-4 bg-[#1e293b]/40 backdrop-blur-md border border-slate-700/50 rounded-2xl text-slate-300 hover:text-[#9f224e] hover:border-[#9f224e]/50 transition-all shadow-lg active:scale-95 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}`}
              title="Force Refresh"
            >
              <svg className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => setIsAddingProject(true)} className="bg-gradient-to-r from-[#9f224e] to-[#db2777] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_4px_20px_rgba(159,34,78,0.4)] flex items-center gap-2 hover:brightness-110 hover:-translate-y-1 transition-all transform active:scale-95 active:translate-y-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              NEW PROJECT
            </button>
          </div>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-700 border-t-[#9f224e] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#9f224e]/20 rounded-full blur-xl animate-pulse"></div>
                </div>
            </div>
            <p className="text-slate-400 font-black mt-8 text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Google Sheets...</p>
          </div>
        ) : (
          <div className="animate-fade-in relative z-10">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} />}
            
            {(activeView === 'projects') && (
              <div className="space-y-6">
                 {/* SEARCH & FILTERS CONTAINER - Lighter Glass Effect */}
                 <div className="bg-[#1e293b]/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-xl space-y-4 hover:bg-[#1e293b]/50 transition-colors duration-500">
                    {/* Search Bar */}
                    <div className="relative w-full group">
                        <input 
                          type="text" 
                          placeholder="Search projects, PM, Department..." 
                          className="w-full pl-12 pr-4 py-4 bg-[#0f172a]/60 border border-slate-600/40 rounded-2xl text-sm outline-none shadow-inner focus:ring-2 focus:ring-[#9f224e] focus:border-[#9f224e] text-white placeholder-slate-400 transition-all group-hover:border-slate-500/60" 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                        <svg className="w-5 h-5 absolute left-4 top-4 text-slate-400 group-focus-within:text-[#9f224e] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        
                        {(searchQuery || filterDept !== 'All' || filterPM !== 'All' || filterStatus !== 'All' || filterType !== 'All' || filterQuarter !== 'All') && (
                          <button 
                            onClick={resetFilters}
                            className="absolute right-4 top-3 text-[10px] font-bold text-[#9f224e] hover:text-white uppercase tracking-wider bg-[#9f224e]/10 hover:bg-[#9f224e] px-3 py-1.5 rounded-lg transition-all"
                          >
                            Clear Filters
                          </button>
                        )}
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                       {/* Dept Filter */}
                       <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 group-hover:text-slate-300 transition-colors">Department</label>
                          <select 
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="bg-[#1e293b]/80 text-slate-200 text-xs font-bold border border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] hover:border-slate-500/60 transition-all cursor-pointer shadow-sm"
                          >
                            <option value="All">All Departments</option>
                            {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>

                       {/* Type Filter */}
                       <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 group-hover:text-slate-300 transition-colors">Type</label>
                          <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-[#1e293b]/80 text-slate-200 text-xs font-bold border border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] hover:border-slate-500/60 transition-all cursor-pointer shadow-sm"
                          >
                            <option value="All">All Types</option>
                            {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                       </div>

                       {/* PM Filter */}
                       <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 group-hover:text-slate-300 transition-colors">PM</label>
                          <select 
                            value={filterPM}
                            onChange={(e) => setFilterPM(e.target.value)}
                            className="bg-[#1e293b]/80 text-slate-200 text-xs font-bold border border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] hover:border-slate-500/60 transition-all cursor-pointer shadow-sm"
                          >
                            <option value="All">All PMs</option>
                            {uniquePMs.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                          </select>
                       </div>

                       {/* Status Filter */}
                       <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 group-hover:text-slate-300 transition-colors">Status</label>
                          <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-[#1e293b]/80 text-slate-200 text-xs font-bold border border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] hover:border-slate-500/60 transition-all cursor-pointer shadow-sm"
                          >
                            <option value="All">All Statuses</option>
                            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>

                        {/* Quarter Filter */}
                        <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 group-hover:text-slate-300 transition-colors">Quarter</label>
                          <select 
                            value={filterQuarter}
                            onChange={(e) => setFilterQuarter(e.target.value)}
                            className="bg-[#1e293b]/80 text-slate-200 text-xs font-bold border border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] hover:border-slate-500/60 transition-all cursor-pointer shadow-sm"
                          >
                            <option value="All">All Quarters</option>
                            <option value="1">Quarter 1</option>
                            <option value="2">Quarter 2</option>
                            <option value="3">Quarter 3</option>
                            <option value="4">Quarter 4</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* PROJECT TABLE */}
                 <div className="relative">
                    {/* Record count indicator floating above table on desktop, or inline on mobile */}
                    <div className="flex justify-end mb-2 px-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         Showing <span className="text-white">{filteredProjects.length}</span> of {projects.filter(p => p.year === selectedYear).length} projects
                       </span>
                    </div>
                    <ProjectTable projects={filteredProjects} onSelectProject={setSelectedProject} />
                 </div>
              </div>
            )}
            
            {activeView === 'team' && <MemberHub projects={projects.filter(p => p.year === selectedYear)} />}
          </div>
        )}
      </main>

      <AIAssistant projects={projects.filter(p => p.year === selectedYear)} />

      {/* MODAL: ADD PROJECT */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-[#000]/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-[#1e293b] z-10">
              <h2 className="text-2xl font-black text-white">Initialize Project {selectedYear}</h2>
              <button onClick={() => setIsAddingProject(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div className={`bg-amber-900/20 border ${GOOGLE_SCRIPT_URL ? 'border-emerald-500/20 bg-emerald-900/20 text-emerald-200' : 'border-amber-500/20 text-amber-200'} p-4 rounded-xl text-sm font-medium flex items-start gap-3`}>
                 <svg className={`w-5 h-5 shrink-0 mt-0.5 ${GOOGLE_SCRIPT_URL ? 'text-emerald-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>
                    {GOOGLE_SCRIPT_URL 
                      ? "System ready: Data will be synced directly to Google Sheet."
                      : "Warning: GOOGLE_SCRIPT_URL not configured. Data will only save locally."}
                 </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Project No. (Col A)</label>
                  <input required type="text" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#9f224e] outline-none hover:border-slate-500 transition-all" placeholder="Ex: 5" onChange={e => setNewProject({...newProject, code: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Type (Col B)</label>
                  <select className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#9f224e] outline-none hover:border-slate-500 transition-all" onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})}>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description (Col D)</label>
                  <input required type="text" className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#9f224e] outline-none hover:border-slate-500 transition-all" placeholder="Detailed project name..." onChange={e => setNewProject({...newProject, description: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Department (Col F)</label>
                  <select className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#9f224e] outline-none hover:border-slate-500 transition-all" onChange={e => setNewProject({...newProject, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Product Manager (Col M)</label>
                  <select className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-[#9f224e] outline-none hover:border-slate-500 transition-all" onChange={e => setNewProject({...newProject, pm: e.target.value})}>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-700/50">
                <button type="button" onClick={() => setIsAddingProject(false)} className="px-6 py-3 font-black text-slate-400 hover:text-white transition-colors">CANCEL</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 bg-[#9f224e] text-white rounded-xl font-black shadow-[0_0_15px_rgba(159,34,78,0.5)] hover:bg-[#b92b5b] transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      SAVING...
                    </>
                  ) : 'ADD PROJECT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROJECT DETAIL */}
      {selectedProject && (
        <div className="fixed inset-0 bg-[#000]/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-[#9f224e] uppercase tracking-widest bg-[#9f224e]/10 px-3 py-1 rounded-full border border-[#9f224e]/20">Project Review</span>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block">Press ESC to close</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-3 leading-tight">{selectedProject.description}</h2>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Project No.</p>
                    <p className="font-mono text-base font-bold text-white">#{selectedProject.code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Type</p>
                    <p className="text-base font-black text-white">{selectedProject.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                    <p className="text-base font-black text-[#9f224e] drop-shadow-[0_0_5px_rgba(159,34,78,0.5)]">{selectedProject.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Phase</p>
                    <p className="text-sm font-bold text-slate-200">{selectedProject.phase || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">KPI / Goals</p>
                    <p className="text-sm font-bold text-slate-200">{selectedProject.kpi || 'Not set'}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Personnel</p>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-300">PM: <span className="text-white">{selectedProject.pm}</span></p>
                      <p className="text-sm font-bold text-slate-300">PO: <span className="text-white">{selectedProject.po}</span></p>
                      <p className="text-sm text-slate-400">Designer: <span className="text-slate-300">{selectedProject.designer}</span></p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Release Timeline</p>
                    <p className="text-sm font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{selectedProject.releaseDate || 'TBA'}</p>
                    <p className="text-xs text-slate-500 mt-1">Tech HO: {selectedProject.techHandoff}</p>
                    <p className="text-xs text-slate-500">Quarter: Q{selectedProject.quarter}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-sm text-slate-300 leading-relaxed shadow-inner">
                  <span className="block text-[10px] font-black text-slate-500 uppercase mb-2">Department / Folder</span>
                  {selectedProject.department}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
