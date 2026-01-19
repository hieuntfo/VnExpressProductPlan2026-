
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DEPARTMENTS, TEAM_MEMBERS, MOCK_PROJECTS } from './constants';
import { Project, ProjectStatus, ProjectType, ReportItem, BacklogItem } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectTable from './components/ProjectTable';
import AIAssistant from './components/AIAssistant';
import MemberHub from './components/MemberHub';
import BacklogList from './components/BacklogList';

const PLAN_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?output=tsv";
const REPORT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?gid=55703458&single=true&output=tsv";
const BACKLOG_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?gid=0&single=true&output=tsv";

const REFRESH_INTERVAL = 120000; // 2 minutes auto-refresh

// Cache keys
const CACHE_KEY_PROJECTS = 'vne_pms_projects';
const CACHE_KEY_REPORTS = 'vne_pms_reports';
const CACHE_KEY_BACKLOG = 'vne_pms_backlog';
const CACHE_KEY_LAST_UPDATED = 'vne_pms_last_updated';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'backlog' | 'team'>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
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
    phase: 'Khởi tạo',
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
    return map[s] || ProjectStatus.NOT_STARTED;
  };

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const cacheBuster = `t=${Date.now()}`;
      const fetchOptions = { cache: 'no-store' as RequestCache };

      const [planRes, reportRes, backlogRes] = await Promise.all([
        fetch(`${PLAN_URL}${PLAN_URL.includes('?') ? '&' : '?'}${cacheBuster}`, fetchOptions),
        fetch(`${REPORT_URL}${REPORT_URL.includes('?') ? '&' : '?'}${cacheBuster}`, fetchOptions),
        fetch(`${BACKLOG_URL}${BACKLOG_URL.includes('?') ? '&' : '?'}${cacheBuster}`, fetchOptions)
      ]);

      if (!planRes.ok || !reportRes.ok || !backlogRes.ok) {
        throw new Error("Failed to fetch data from Google Sheets");
      }

      const planTsv = await planRes.text();
      const planRows = planTsv.split('\n').map(row => row.split('\t'));
      const parsedProjects: Project[] = planRows.slice(1)
        .filter(r => r.length > 2 && r[1] && r[1].trim() !== '')
        .map((row, idx) => {
          const code = (row[0] || '').trim();
          const relDate = (row[8] || '').trim();
          const hoDate = (row[7] || '').trim();
          let year = 2026;
          // Logic xác định năm dựa trên Code hoặc Date
          if (code.toLowerCase().includes('2025') || relDate.includes('2025') || hoDate.includes('2025') || relDate.endsWith('/25') || hoDate.endsWith('/25')) year = 2025;
          
          return {
            id: `p-${idx}`,
            year,
            code,
            description: (row[1] || '').trim(),
            type: ((row[2] || '').trim() as ProjectType) || ProjectType.ANNUAL,
            department: (row[3] || '').trim(),
            status: normalizeStatus(row[4] || ''),
            phase: (row[5] || '').trim(),
            quarter: parseInt(row[6]) || 1,
            techHandoff: hoDate,
            releaseDate: relDate,
            pm: (row[9] || '').trim(),
            designer: (row[10] || '').trim(),
            po: (row[11] || '').trim(),
            kpi: (row[12] || '').trim(),
            dashboardUrl: (row[13] || '').trim(),
            notes: (row[14] || '').trim()
          };
        });

      const reportTsv = await reportRes.text();
      const reportRows = reportTsv.split('\n').map(row => row.split('\t'));
      const parsedReports: ReportItem[] = reportRows.slice(1)
        .filter(r => r.length > 2 && r[2] && r[2].trim() !== '')
        .map(row => {
          const projectName = (row[2] || '').trim();
          return {
            type: (row[0] || '').toUpperCase().includes('ANN') ? 'ANN' : 'NEW',
            designer: (row[1] || '').trim(),
            projectName,
            status: (row[3] || '').trim(),
            year: projectName.includes('2025') ? 2025 : 2026
          };
        });

      const backlogTsv = await backlogRes.text();
      const backlogRows = backlogTsv.split('\n').map(row => row.split('\t'));
      const parsedBacklog: BacklogItem[] = backlogRows.slice(1)
        .filter(r => r.length > 1 && r[1] && r[1].trim() !== '')
        .map((row, idx) => ({
          id: `bl-${idx}`,
          code: (row[0] || '').trim(),
          description: (row[1] || '').trim(),
          type: (row[2] || '').trim(),
          department: (row[3] || '').trim(),
          status: (row[4] || 'Pending').trim(),
          priority: (row[5] || 'Medium').trim(),
          quarter: (row[6] || '').trim(),
          techHandoff: (row[7] || '').trim(),
          releaseDate: (row[8] || '').trim(),
          pm: (row[9] || '').trim(),
          designer: (row[10] || '').trim(),
          po: (row[11] || '').trim(),
          notes: (row[14] || '').trim()
        }));

      // Update state
      setProjects(parsedProjects);
      setReports(parsedReports);
      setBacklogItems(parsedBacklog);
      
      const now = new Date();
      setLastUpdated(now);

      // Save to Cache
      localStorage.setItem(CACHE_KEY_PROJECTS, JSON.stringify(parsedProjects));
      localStorage.setItem(CACHE_KEY_REPORTS, JSON.stringify(parsedReports));
      localStorage.setItem(CACHE_KEY_BACKLOG, JSON.stringify(parsedBacklog));
      localStorage.setItem(CACHE_KEY_LAST_UPDATED, now.toISOString());

    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
      // Nếu không có cache và lỗi mạng, mới dùng Mock. Nếu có cache, giữ nguyên cache.
      if (projects.length === 0) {
          const cachedProjects = localStorage.getItem(CACHE_KEY_PROJECTS);
          if (!cachedProjects) {
              setProjects(MOCK_PROJECTS);
          }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [projects.length]);

  // Load from cache on mount immediately
  useEffect(() => {
    const cachedProjects = localStorage.getItem(CACHE_KEY_PROJECTS);
    const cachedReports = localStorage.getItem(CACHE_KEY_REPORTS);
    const cachedBacklog = localStorage.getItem(CACHE_KEY_BACKLOG);
    const cachedTime = localStorage.getItem(CACHE_KEY_LAST_UPDATED);

    if (cachedProjects) setProjects(JSON.parse(cachedProjects));
    if (cachedReports) setReports(JSON.parse(cachedReports));
    if (cachedBacklog) setBacklogItems(JSON.parse(cachedBacklog));
    if (cachedTime) setLastUpdated(new Date(cachedTime));

    // Then fetch fresh data
    fetchData();

    // Setup auto-refresh
    const timer = setInterval(() => {
      fetchData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.year === selectedYear && (
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [projects, selectedYear, searchQuery]);

  const filteredBacklog = useMemo(() => {
    return backlogItems.filter(item => 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [backlogItems, searchQuery]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const projectToAdd: Project = {
      ...newProject,
      id: `local-${Date.now()}`,
      year: selectedYear,
    } as Project;
    setProjects(prev => [projectToAdd, ...prev]);
    setIsAddingProject(false);
    alert('Dự án đã được thêm tạm thời. Hãy cập nhật vào Google Sheet để lưu trữ lâu dài.');
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
                {isRefreshing ? 'Đang đồng bộ Sheet...' : 'Hệ thống VnExpress P&T'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#1a1a1a]">
              {activeView === 'dashboard' ? 'Báo cáo 2026' : 
               activeView === 'projects' ? 'Kế hoạch Sản phẩm' : 
               activeView === 'backlog' ? 'Danh sách Backlog' : 'Member HUB'}
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
                    Dữ liệu cập nhật lúc
                    </span>
                    <span className="text-[11px] font-black text-slate-600">
                    {lastUpdated.toLocaleTimeString('vi-VN')}
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
              title="Làm mới dữ liệu từ Google Sheets"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button onClick={() => setIsAddingProject(true)} className="bg-[#9f224e] text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-[#851a40] transition-all transform active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              DỰ ÁN MỚI
            </button>
          </div>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-[#9f224e] rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-[#9f224e] text-[10px]">VNE</div>
            </div>
            <p className="text-slate-400 font-black mt-6 text-[11px] uppercase tracking-[0.3em] animate-pulse">Đang tải dữ liệu mới nhất...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} reports={reports.filter(r => r.year === selectedYear)} />}
            
            {(activeView === 'projects' || activeView === 'backlog') && (
              <div className="space-y-6">
                 <div className="relative max-w-md">
                    <input 
                      type="text" 
                      placeholder={`Tìm ${activeView === 'backlog' ? 'backlog' : 'dự án'}...`} 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-[#9f224e]/20 transition-all" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                    <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 
                 {activeView === 'projects' ? (
                   <ProjectTable projects={filteredProjects} onSelectProject={setSelectedProject} />
                 ) : (
                   <BacklogList items={filteredBacklog} />
                 )}
              </div>
            )}
            
            {activeView === 'team' && <MemberHub projects={projects.filter(p => p.year === selectedYear)} />}
          </div>
        )}
      </main>

      <AIAssistant projects={projects.filter(p => p.year === selectedYear)} />

      {/* MODAL: TẠO DỰ ÁN */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-black text-slate-900">Khởi tạo dự án {selectedYear}</h2>
              <button onClick={() => setIsAddingProject(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
                 <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>Lưu ý: Chức năng này sẽ thêm dự án vào giao diện tạm thời. Để lưu trữ vĩnh viễn, vui lòng thêm dòng mới vào file Google Sheets của bạn. Hệ thống sẽ tự động cập nhật sau ít phút.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Mã dự án (Code)</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Vd: VNE2026_01" onChange={e => setNewProject({...newProject, code: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Loại hình</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})}>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Mô tả dự án</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Nhập tên dự án chi tiết..." onChange={e => setNewProject({...newProject, description: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Bộ phận</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => setNewProject({...newProject, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">PM Phụ trách</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" onChange={e => setNewProject({...newProject, pm: e.target.value})}>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t">
                <button type="button" onClick={() => setIsAddingProject(false)} className="px-6 py-3 font-black text-slate-400 hover:text-slate-600">HỦY BỎ</button>
                <button type="submit" className="px-10 py-3 bg-[#9f224e] text-white rounded-xl font-black shadow-lg hover:bg-[#851a40] transform active:scale-95 transition-all">THÊM TẠM THỜI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHI TIẾT DỰ ÁN */}
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
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Mã dự án</p>
                    <p className="font-mono text-base font-bold text-slate-800">{selectedProject.code}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Trạng thái</p>
                    <p className="text-base font-black text-[#9f224e]">{selectedProject.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">KPI Mục tiêu</p>
                    <p className="text-sm font-bold text-slate-700">{selectedProject.kpi || 'Chưa thiết lập'}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nhân sự thực hiện</p>
                    <p className="text-sm font-bold text-slate-800">PM: {selectedProject.pm} | PO: {selectedProject.po}</p>
                    <p className="text-xs text-slate-400 mt-1">Designer: {selectedProject.designer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lộ trình Release</p>
                    <p className="text-sm font-black text-emerald-600">{selectedProject.releaseDate || 'TBA'}</p>
                    <p className="text-xs text-slate-400 mt-1">Tech HO: {selectedProject.techHandoff}</p>
                  </div>
                </div>
              </div>
              
              {selectedProject.notes && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm text-slate-600 leading-relaxed">
                  "{selectedProject.notes}"
                </div>
              )}

              {selectedProject.dashboardUrl && (
                <div className="pt-4 border-t">
                  <a href={selectedProject.dashboardUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-[#1a1a1a] text-white rounded-2xl text-sm font-black hover:bg-[#333] transition-all shadow-lg shadow-slate-200 transform active:scale-[0.98]">
                    XEM REAL-TIME DASHBOARD
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </div>
              )}
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
