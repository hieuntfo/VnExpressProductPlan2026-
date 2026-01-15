
import React, { useState, useMemo, useEffect } from 'react';
import { DEPARTMENTS, TEAM_MEMBERS, MOCK_PROJECTS } from './constants';
import { Project, ProjectStatus, ProjectType, ReportItem } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectTable from './components/ProjectTable';
import AIAssistant from './components/AIAssistant';
import MemberHub from './components/MemberHub';

const PLAN_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?output=tsv";
const REPORT_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?gid=55703458&single=true&output=tsv";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'backlog' | 'team'>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Project Plan & Report data concurrently
        const [planRes, reportRes] = await Promise.all([
          fetch(`${PLAN_URL}&t=${Date.now()}`),
          fetch(`${REPORT_URL}&t=${Date.now()}`)
        ]);

        const planTsv = await planRes.text();
        const planRows = planTsv.split('\n').map(row => row.split('\t'));
        
        // Cần show đủ với các trường dữ liệu có data tại trường "Issue Description" (index 1)
        const parsedProjects: Project[] = planRows.slice(1)
          .filter(r => r.length > 2 && r[1] && r[1].trim() !== '') // Lọc theo Issue Description
          .map((row, idx) => {
            const code = (row[0] || '').trim();
            const desc = (row[1] || '').trim();
            const relDate = (row[8] || '').trim();
            const hoDate = (row[7] || '').trim();
            
            let year = 2026;
            if (code.toLowerCase().includes('2025') || 
                relDate.includes('2025') || 
                hoDate.includes('2025') || 
                relDate.endsWith('/25') || 
                hoDate.endsWith('/25')) {
              year = 2025;
            }

            return {
              id: `p-${idx}`,
              year,
              code,
              description: desc,
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
            const rawType = (row[0] || '').trim();
            const projectName = (row[2] || '').trim();
            const year = projectName.includes('2025') ? 2025 : 2026;
            return {
              type: rawType.toUpperCase().includes('ANN') ? 'ANN' : 'NEW',
              designer: (row[1] || '').trim(),
              projectName,
              status: (row[3] || '').trim(),
              year
            };
          });

        setProjects(parsedProjects.length > 0 ? parsedProjects : MOCK_PROJECTS);
        setReports(parsedReports);
      } catch (error) {
        console.error("Error fetching data from Google Sheets:", error);
        setProjects(MOCK_PROJECTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.year === selectedYear && (
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [projects, selectedYear, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#9f224e] w-2 h-2 rounded-full"></span>
              <span className="text-[10px] font-black uppercase text-[#9f224e] tracking-[0.2em]">Hệ thống quản lý 2026</span>
            </div>
            <h1 className="text-3xl font-black text-[#1a1a1a] tracking-tight">
              {activeView === 'dashboard' ? 'Báo Cáo Tổng Quan' : 
               activeView === 'projects' ? 'Kế Hoạch Dự Án' : 
               activeView === 'backlog' ? 'Danh Sách Chờ' : 'Member HUB'}
            </h1>
            <div className="flex bg-slate-200 p-1 rounded-xl mt-4 inline-flex shadow-inner">
              {[2025, 2026].map(yr => (
                <button 
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-8 py-1.5 text-xs font-black rounded-lg transition-all duration-300 ${selectedYear === yr ? 'bg-[#9f224e] text-white shadow-lg scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  NĂM {yr}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái kết nối</span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                LIVE SYNC
              </span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#9f224e] hover:border-[#9f224e] transition-all shadow-sm active:scale-90"
              title="Làm mới dữ liệu từ Sheet"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={() => setIsAddingProject(true)} className="bg-[#9f224e] text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-[#851a40] transition-all active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              TẠO DỰ ÁN
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-slate-100 border-t-[#9f224e] rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center font-black text-[#9f224e] text-xs">VNE</div>
            </div>
            <p className="text-slate-400 font-black mt-6 text-[11px] uppercase tracking-[0.3em] animate-pulse">Đang đồng bộ dữ liệu tòa soạn...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} reports={reports.filter(r => r.year === selectedYear)} />}
            {activeView === 'projects' && (
              <div className="space-y-6">
                 <div className="relative max-w-md">
                    <input 
                      type="text" 
                      placeholder="Tìm mã dự án hoặc tên..." 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#9f224e] outline-none shadow-sm transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <ProjectTable projects={filteredProjects} onSelectProject={setSelectedProject} />
              </div>
            )}
            {activeView === 'team' && <MemberHub projects={projects.filter(p => p.year === selectedYear)} />}
            {activeView === 'backlog' && (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800">Backlog Dự Kiến</h3>
                <p className="text-slate-400 text-sm mt-2">Dữ liệu đang được ánh xạ từ sheet BACKLOG của tòa soạn.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <AIAssistant projects={projects.filter(p => p.year === selectedYear)} />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
