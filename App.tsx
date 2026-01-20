
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
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Cache keys
const CACHE_KEY_PROJECTS = 'vne_pms_projects';
const SESSION_KEY_AUTH = 'vne_pms_auth_session';
const SESSION_KEY_ROLE = 'vne_pms_role';
const SESSION_KEY_TIMESTAMP = 'vne_pms_timestamp';

const App: React.FC = () => {
  // --- Theme State (Auto-VN Time) ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    const checkTimeAndSetTheme = () => {
      // Get current time in Vietnam (GMT+7)
      const now = new Date();
      const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const currentHour = vnTime.getHours();

      // Light mode from 6 AM to 6 PM (18:00)
      const isDayTime = currentHour >= 6 && currentHour < 18;
      
      const shouldBeDark = !isDayTime;
      setIsDarkMode(shouldBeDark);
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Check immediately on mount
    checkTimeAndSetTheme();

    // Re-check every minute
    const interval = setInterval(checkTimeAndSetTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  // Manual Toggle (Optional override)
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      if (newVal) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return newVal;
    });
  };

  // --- Authentication State & Logic ---
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY_ROLE) === 'admin';
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth = sessionStorage.getItem(SESSION_KEY_AUTH) === 'true';
    const timestampStr = sessionStorage.getItem(SESSION_KEY_TIMESTAMP);
    
    // If not authenticated or no timestamp, invalid
    if (!auth || !timestampStr) return false;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    // Check if session timed out
    if (now - timestamp > SESSION_TIMEOUT) {
      sessionStorage.clear();
      return false;
    }
    
    return true;
  });

  const [loginTab, setLoginTab] = useState<'user' | 'admin'>('user');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- Main App State ---
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'team'>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  // Edit State (Admin Only)
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});

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
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- Authentication Handler ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const now = Date.now().toString();

    if (loginTab === 'user') {
      if (passwordInput === "123456") {
        setIsAuthenticated(true);
        setIsAdmin(false);
        sessionStorage.setItem(SESSION_KEY_AUTH, 'true');
        sessionStorage.setItem(SESSION_KEY_ROLE, 'user');
        sessionStorage.setItem(SESSION_KEY_TIMESTAMP, now);
      } else {
        setLoginError('Mật khẩu User không đúng (Gợi ý: 123456)');
      }
    } else {
      // Admin Login
      if (passwordInput === "vnexpress") {
        setIsAuthenticated(true);
        setIsAdmin(true);
        sessionStorage.setItem(SESSION_KEY_AUTH, 'true');
        sessionStorage.setItem(SESSION_KEY_ROLE, 'admin');
        sessionStorage.setItem(SESSION_KEY_TIMESTAMP, now);
      } else {
        setLoginError('Mật khẩu Admin không đúng');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    sessionStorage.removeItem(SESSION_KEY_AUTH);
    sessionStorage.removeItem(SESSION_KEY_ROLE);
    sessionStorage.removeItem(SESSION_KEY_TIMESTAMP);
    setLoginTab('user'); // Reset default tab
    setPasswordInput('');
  };

  // --- Auto Logout Effect ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check every minute
    const interval = setInterval(() => {
       const timestampStr = sessionStorage.getItem(SESSION_KEY_TIMESTAMP);
       if (timestampStr) {
         const timestamp = parseInt(timestampStr, 10);
         const now = Date.now();
         if (now - timestamp > SESSION_TIMEOUT) {
           handleLogout();
           alert("Phiên đăng nhập đã hết hạn (30 phút). Vui lòng đăng nhập lại.");
         }
       } else {
         handleLogout(); // Force logout if no timestamp found
       }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // --- Normalization Helpers ---
  const normalizeStatus = (statusStr: string): ProjectStatus => {
    const s = (statusStr || '').toLowerCase().trim();
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
    if (s.includes('đang làm') || s.includes('đang thực hiện') || s.includes('đang chạy')) return ProjectStatus.IN_PROGRESS;
    if (s.includes('hoàn thành') || s.includes('đã xong') || s.includes('xong')) return ProjectStatus.DONE;
    if (s.includes('chờ') || s.includes('tạm dừng')) return ProjectStatus.PENDING;
    if (s.includes('hủy')) return ProjectStatus.CANCELLED;
    if (s.includes('bàn giao')) return ProjectStatus.HAND_OFF;
    if (s.includes('kế hoạch') || s.includes('dự kiến')) return ProjectStatus.PLANNING;
    if (s.includes('chưa')) return ProjectStatus.NOT_STARTED;
    return ProjectStatus.PLANNING;
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

  // --- Helper: Get Next Project Code ---
  const getNextProjectCode = useCallback(() => {
    if (!projects || projects.length === 0) return "1";
    // Filter out non-numeric codes to avoid NaN issues, find max, then add 1
    const maxCode = projects.reduce((max, p) => {
        const num = parseInt(p.code, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return (maxCode + 1).toString();
  }, [projects]);

  // --- Data Fetching ---

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) return;

    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      const cacheBuster = `t=${Date.now()}`;
      const response = await fetch(`${DATA_URL}${DATA_URL.includes('?') ? '&' : '?'}${cacheBuster}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const tsvText = await response.text();
      if (tsvText.trim().startsWith('<') || tsvText.includes('<!DOCTYPE html')) throw new Error("Received HTML instead of TSV data");

      const rows = tsvText.split(/\r?\n/).map(row => row.split('\t'));
      let headerRowIndex = -1;
      const colMap: Record<string, number> = {};

      // Robust Header Detection
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const rowLower = rows[i].map(c => c.toLowerCase().trim());
        if (rowLower.some(c => c.includes('tên') || c.includes('project') || c.includes('mô tả') || c.includes('description') || c.includes('issue') || c.includes('summary'))) {
          headerRowIndex = i;
          rows[i].forEach((cell, idx) => {
             const c = cell.toLowerCase().trim();
             if (c.includes('stt') || c === 'no' || c === '#') colMap['code'] = idx;
             if (c.includes('loại') || c.includes('type')) colMap['type'] = idx;
             if (c.includes('issue') || c.includes('description') || c === 'mô tả' || c === 'tên dự án' || c === 'project name' || c.includes('summary')) colMap['description'] = idx;
             if (c.includes('giai đoạn') || c.includes('phase')) colMap['phase'] = idx;
             if (c.includes('bộ phận') || c.includes('dept') || c.includes('folder')) colMap['department'] = idx;
             if (c.includes('yêu cầu') || c.includes('owner') || c.includes('request') || c.includes('người yêu cầu')) colMap['po'] = idx;
             if (c.includes('tech') || c.includes('handoff') || c.includes('bàn giao')) colMap['techHandoff'] = idx;
             if (c.includes('release') || c.includes('golive') || c.includes('ngày') || c.includes('date')) colMap['releaseDate'] = idx;
             if (c.includes('quý') || c.includes('quarter')) colMap['quarter'] = idx;
             if (c === 'product' || c === 'pm' || c.includes('product manager') || c.includes('quản trị')) colMap['pm'] = idx;
             if (c.includes('designer') || c.includes('ui') || c.includes('ux') || c.includes('thiết kế')) colMap['designer'] = idx;
             if (c.includes('trạng thái') || c.includes('status')) colMap['status'] = idx;
             if (c.includes('kpi') || c.includes('okr') || c.includes('mục tiêu')) colMap['kpi'] = idx;
          });
          break;
        }
      }

      if (headerRowIndex === -1) {
         colMap['code'] = 0; colMap['type'] = 1; colMap['description'] = 2; colMap['phase'] = 3;
         colMap['department'] = 4; colMap['po'] = 5; colMap['techHandoff'] = 6; colMap['releaseDate'] = 8;
         colMap['quarter'] = 10; colMap['pm'] = 12; colMap['designer'] = 13; colMap['status'] = 14; colMap['kpi'] = 18; 
         headerRowIndex = 0;
      }
      
      if (colMap['description'] === undefined) colMap['description'] = 2; 

      const parsedProjects: Project[] = rows.slice(headerRowIndex + 1).filter(r => {
           const desc = (r[colMap['description']] || '').trim();
           return desc.length > 0 && desc.toLowerCase() !== 'description' && desc.toLowerCase() !== 'issue description' && desc.toLowerCase() !== 'tên dự án';
        }).map((row, idx) => {
          const getVal = (key: string) => (row[colMap[key]] || '').trim();
          const releaseDate = getVal('releaseDate');
          const techHandoff = getVal('techHandoff');
          const quarterStr = getVal('quarter');
          
          let year = 2026; 
          const dateStr = (releaseDate + techHandoff + quarterStr).toUpperCase();
          if (dateStr.includes('/25') || dateStr.includes('2025') || quarterStr.includes('25')) year = 2025;
          else if (dateStr.includes('/24') || dateStr.includes('2024')) year = 2024;
          
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
          };
        });

      if (parsedProjects.length > 0) {
        setProjects(parsedProjects);
        localStorage.setItem(CACHE_KEY_PROJECTS, JSON.stringify(parsedProjects));
      } else {
        console.warn("Parsed projects empty. Falling back.");
        throw new Error("Empty parsed data");
      }
    } catch (error) {
      console.error("Data sync error:", error);
      const cached = localStorage.getItem(CACHE_KEY_PROJECTS);
      if (cached) {
          const cachedProjects = JSON.parse(cached);
          if (cachedProjects.length > 0) setProjects(cachedProjects);
          else setProjects(MOCK_PROJECTS);
      } else {
          setProjects(MOCK_PROJECTS);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const timer = setInterval(() => fetchData(true), REFRESH_INTERVAL);
      return () => clearInterval(timer);
    }
  }, [fetchData, isAuthenticated]);

  const { uniqueDepts, uniquePMs, uniqueStatuses } = useMemo(() => {
    const currentProjects = projects.filter(p => p.year === selectedYear);
    return { 
      uniqueDepts: Array.from(new Set(currentProjects.map(p => p.department))).filter(Boolean).sort(),
      uniquePMs: Array.from(new Set(currentProjects.map(p => p.pm))).filter(Boolean).sort(),
      uniqueStatuses: Object.values(ProjectStatus)
    };
  }, [projects, selectedYear]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (p.year !== selectedYear) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.description.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q) && 
            !p.pm.toLowerCase().includes(q) && !p.department.toLowerCase().includes(q)) return false;
      }
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
    setProjects(prev => [{ ...newProject, id: `local-${Date.now()}`, year: selectedYear } as Project, ...prev]);

    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'add',
            project_no: newProject.code, 
            type: newProject.type, 
            description: newProject.description, 
            department: newProject.department, 
            product_manager: newProject.pm 
          })
        });
        alert('Đã gửi yêu cầu thêm dự án thành công!');
      } catch (error) { console.error(error); alert('Lỗi kết nối tới Google Sheet.'); }
    } else { alert('Đã thêm cục bộ.'); }
    setIsSubmitting(false); setIsAddingProject(false);
  };

  const handleUpdateProject = async () => {
    if (!selectedProject || !isEditing) return;
    setIsSubmitting(true);

    const updatedProject = { ...selectedProject, ...editFormData };

    // Update Local State Optimistically
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);

    if (GOOGLE_SCRIPT_URL) {
       try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'update',
            project_no: updatedProject.code,
            status: updatedProject.status,
            release_date: updatedProject.releaseDate,
            kpi: updatedProject.kpi
          })
        });
        alert('Cập nhật thành công! Dữ liệu đang được đồng bộ về Sheet.');
      } catch (error) { 
        console.error(error); 
        alert('Lỗi kết nối khi cập nhật.'); 
        // Revert local state if needed (not implemented for simplicity)
      }
    } else {
      alert('Đã cập nhật cục bộ (Chế độ offline).');
    }

    setIsSubmitting(false);
    setIsEditing(false);
  };

  const resetFilters = () => {
    setFilterDept('All'); setFilterType('All'); setFilterPM('All'); setFilterStatus('All'); setFilterQuarter('All'); setSearchQuery('');
  };

  // --- RENDER LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121] flex items-center justify-center font-sans text-slate-800 dark:text-slate-200 relative overflow-hidden transition-colors duration-700">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#e2e8f0,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_70%)] opacity-50 pointer-events-none z-0"></div>
        
        <div className="relative z-10 w-full max-w-md p-6">
          <div className="bg-white/80 dark:bg-[#1e293b]/60 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] animate-scale-in">
            <div className="text-center mb-10">
               <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#9f224e] to-[#db2777] rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-[0_10px_30px_rgba(159,34,78,0.3)] mb-6 transform hover:scale-110 transition-transform duration-300">
                  V
               </div>
               <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">VnExpress</h1>
               <p className="text-[#9f224e] font-bold text-xs uppercase tracking-[0.3em] mt-2">Product Management 2026</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Role Selection Tabs */}
              <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl flex relative mb-6">
                 <button 
                    type="button" 
                    onClick={() => { setLoginTab('user'); setPasswordInput(''); setLoginError(''); }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all z-10 ${loginTab === 'user' ? 'bg-white dark:bg-[#9f224e] text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                 >
                   User
                 </button>
                 <button 
                    type="button" 
                    onClick={() => { setLoginTab('admin'); setPasswordInput(''); setLoginError(''); }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all z-10 ${loginTab === 'admin' ? 'bg-white dark:bg-[#9f224e] text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                 >
                   Admin
                 </button>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 pl-1">
                  {loginTab === 'user' ? 'Member Password' : 'Administrator Key'}
                </label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50/50 dark:bg-[#0f172a]/50 border border-slate-200 dark:border-slate-600/40 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#9f224e] focus:border-transparent transition-all shadow-inner font-bold tracking-widest"
                  placeholder="••••••"
                  autoFocus
                />
                {loginError && (
                  <p className="text-red-500 dark:text-red-400 text-xs mt-3 flex items-center gap-1 font-bold animate-pulse">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {loginError}
                  </p>
                )}
              </div>
              
              <button 
                type="submit"
                className="w-full py-4 bg-[#9f224e] hover:bg-[#b92b5b] text-white font-black rounded-xl shadow-[0_10px_30px_rgba(159,34,78,0.3)] hover:shadow-[0_15px_40px_rgba(159,34,78,0.4)] transform active:scale-95 transition-all duration-200 uppercase tracking-wider text-sm flex items-center justify-center gap-2 group"
              >
                {loginTab === 'user' ? 'Access Dashboard' : 'Admin Console'}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>

             <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700/50 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Request Access</p>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800/50 flex flex-col items-center group hover:border-[#9f224e]/30 transition-colors cursor-default">
                 <div className="relative mb-3">
                    <img src="https://ui-avatars.com/api/?name=Hieu+Nguyen&background=9f224e&color=fff&size=128" alt="Admin Hieu Nguyen" className="w-12 h-12 rounded-full border-2 border-[#9f224e] shadow-[0_0_15px_rgba(159,34,78,0.3)] object-cover" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-50 dark:border-[#1e293b] animate-pulse"></div>
                 </div>
                 <p className="text-xs font-bold text-slate-800 dark:text-white mb-1">Admin: Hieu Nguyen</p>
                 <div className="space-y-1">
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-[#9f224e] transition-colors cursor-pointer">nguyenhieu@vnexpress.net</p>
                 </div>
              </div>
            </div>
          </div>
          <p className="text-center text-slate-400 dark:text-slate-600 text-[10px] mt-6 font-medium">© 2026 VnExpress Product & Technology</p>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121] flex font-sans text-slate-800 dark:text-slate-200 selection:bg-[#9f224e] selection:text-white relative overflow-hidden transition-colors duration-700">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#e2e8f0,transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_70%)] opacity-40 pointer-events-none z-0"></div>
      
      <Sidebar activeView={activeView} setActiveView={setActiveView} isAdmin={isAdmin} onLogout={handleLogout} />
      
      <main className="flex-1 ml-64 p-10 relative z-10 transition-all duration-500">
        <header className="flex items-center justify-between mb-10 pb-6 relative z-10 animate-fade-in">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-[#9f224e] shadow-[0_0_8px_#9f224e]'}`}></span>
              <span className="text-[10px] font-black uppercase text-[#9f224e] tracking-[0.3em]">
                {isRefreshing ? 'Syncing...' : isAdmin ? 'Admin Mode' : 'Live System'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              {activeView === 'dashboard' ? `Report ${selectedYear}` : 
               activeView === 'projects' ? 'Project Plan' : 'Member Hub'}
            </h1>
            
            <div className="flex items-center gap-6 mt-6">
              <div className="flex bg-white/50 dark:bg-[#1e293b]/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 p-1 rounded-xl inline-flex shadow-sm">
                {[2025, 2026].map(yr => (
                  <button key={yr} onClick={() => setSelectedYear(yr)} className={`px-8 py-2 text-xs font-black rounded-lg transition-all ${selectedYear === yr ? 'bg-[#9f224e] text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/30'}`}>{yr}</button>
                ))}
              </div>
              <div className="flex flex-col border-l border-slate-300 dark:border-slate-700/50 pl-6">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Projects</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{projects.filter(p => p.year === selectedYear).length} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">Records</span></span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Dark Mode Toggle */}
            <button onClick={toggleTheme} className="p-4 bg-white/50 dark:bg-[#1e293b]/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-500 dark:text-slate-300 hover:text-[#9f224e] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 hover:shadow-md" title="Toggle Theme">
               {isDarkMode ? (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               ) : (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
               )}
            </button>

            <button onClick={() => fetchData()} disabled={isRefreshing} className={`p-4 bg-white/50 dark:bg-[#1e293b]/40 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-500 dark:text-slate-300 hover:text-[#9f224e] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 hover:shadow-md ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`} title="Force Refresh">
              <svg className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button 
              onClick={() => {
                setNewProject(prev => ({ ...prev, code: getNextProjectCode() }));
                setIsAddingProject(true);
              }} 
              className="bg-gradient-to-r from-[#9f224e] to-[#db2777] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_10px_20px_rgba(159,34,78,0.3)] flex items-center gap-2 hover:brightness-110 hover:-translate-y-1 transition-all transform active:scale-95 active:translate-y-0 border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              NEW PROJECT
            </button>
          </div>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-300 dark:border-slate-700 border-t-[#9f224e] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#9f224e]/20 rounded-full blur-xl animate-pulse"></div>
                </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-black mt-8 text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Google Sheets...</p>
          </div>
        ) : (
          <div className="animate-fade-in relative z-10">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} />}
            
            {(activeView === 'projects') && (
              <div className="space-y-8">
                 {/* SEARCH & FILTERS CONTAINER - STICKY */}
                 <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0b1121]/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 shadow-[0_4px_30px_-4px_rgba(0,0,0,0.05)] space-y-4 hover:bg-white/95 dark:hover:bg-[#0b1121]/95 transition-all duration-300">
                    <div className="relative w-full group">
                        <input type="text" placeholder="Search projects, PM, Department..." className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-600/40 rounded-2xl text-sm outline-none shadow-inner focus:ring-2 focus:ring-[#9f224e] focus:border-[#9f224e] text-slate-900 dark:text-white placeholder-slate-400 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <svg className="w-5 h-5 absolute left-4 top-4 text-slate-400 group-focus-within:text-[#9f224e] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        
                        {(searchQuery || filterDept !== 'All' || filterPM !== 'All' || filterStatus !== 'All' || filterType !== 'All' || filterQuarter !== 'All') && (
                          <button onClick={resetFilters} className="absolute right-4 top-3 text-[10px] font-bold text-[#9f224e] hover:text-white uppercase tracking-wider bg-[#9f224e]/10 hover:bg-[#9f224e] px-3 py-1.5 rounded-lg transition-all">Clear Filters</button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                       {/* Reusable Select Component Logic */}
                       {[
                         { label: 'Department', val: filterDept, set: setFilterDept, opts: uniqueDepts, all: 'All Departments' },
                         { label: 'Type', val: filterType, set: setFilterType, opts: Object.values(ProjectType), all: 'All Types' },
                         { label: 'PM', val: filterPM, set: setFilterPM, opts: uniquePMs, all: 'All PMs' },
                         { label: 'Status', val: filterStatus, set: setFilterStatus, opts: Object.values(ProjectStatus), all: 'All Statuses' },
                       ].map((f, i) => (
                        <div key={i} className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">{f.label}</label>
                          <select value={f.val} onChange={(e) => f.set(e.target.value)} className="bg-slate-50/50 dark:bg-[#1e293b]/80 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] transition-all cursor-pointer shadow-sm">
                            <option value="All">{f.all}</option>
                            {f.opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                          </select>
                       </div>
                       ))}
                       <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Quarter</label>
                          <select value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)} className="bg-slate-50/50 dark:bg-[#1e293b]/80 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-600/40 rounded-xl px-3 py-3 outline-none focus:border-[#9f224e] focus:ring-1 focus:ring-[#9f224e] transition-all cursor-pointer shadow-sm">
                            <option value="All">All Quarters</option>
                            {[1,2,3,4].map(q => <option key={q} value={q}>Quarter {q}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="relative">
                    <div className="flex justify-end mb-2 px-2">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Showing <span className="text-slate-900 dark:text-white">{filteredProjects.length}</span> of {projects.filter(p => p.year === selectedYear).length} projects</span>
                    </div>
                    <ProjectTable projects={filteredProjects} onSelectProject={(p) => { setSelectedProject(p); setIsEditing(false); }} />
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
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1e293b] z-10">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Initialize Project {selectedYear}</h2>
              <button onClick={() => setIsAddingProject(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div className={`border p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${GOOGLE_SCRIPT_URL ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-200'}`}>
                 <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p>{GOOGLE_SCRIPT_URL ? "System ready: Data will be synced directly to Google Sheet." : "Warning: GOOGLE_SCRIPT_URL not configured. Data will only save locally."}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Project No.</label>
                  <input required type="text" value={newProject.code || ''} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#9f224e] outline-none transition-all" placeholder="Auto-generated" onChange={e => setNewProject({...newProject, code: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Type</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#9f224e] outline-none transition-all" onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})}>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#9f224e] outline-none transition-all" placeholder="Detailed project name..." onChange={e => setNewProject({...newProject, description: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Department</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none" onChange={e => setNewProject({...newProject, department: e.target.value})}>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">PM</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none" onChange={e => setNewProject({...newProject, pm: e.target.value})}>{TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-700/50">
                <button type="button" onClick={() => setIsAddingProject(false)} className="px-6 py-3 font-black text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">CANCEL</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 bg-[#9f224e] text-white rounded-xl font-black shadow-[0_0_15px_rgba(159,34,78,0.5)] hover:bg-[#b92b5b] transform active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'SAVING...' : 'ADD PROJECT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROJECT DETAIL & EDIT */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1e293b] z-10">
              <div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-[#9f224e] uppercase tracking-widest bg-[#9f224e]/10 px-3 py-1 rounded-full border border-[#9f224e]/20">
                     {isEditing ? 'Editing Project' : 'Project Review'}
                   </span>
                   {!isEditing && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block">Press ESC to close</span>}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3 leading-tight">{selectedProject.description}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {isAdmin && !isEditing && (
                  <button 
                    onClick={() => { 
                      setIsEditing(true); 
                      setEditFormData({ 
                        status: selectedProject.status, 
                        releaseDate: selectedProject.releaseDate, 
                        kpi: selectedProject.kpi 
                      }); 
                    }} 
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all font-bold text-xs uppercase flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                )}
                
                <button onClick={() => { setSelectedProject(null); setIsEditing(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {isEditing ? (
                 /* EDIT FORM (ADMIN) */
                 <div className="space-y-6">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/50 rounded-xl text-amber-800 dark:text-amber-200 text-xs font-bold">
                      Admin Mode: You are editing protected fields. Changes will be synced to the Master Sheet.
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Status</label>
                      <select 
                        value={editFormData.status} 
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value as ProjectStatus})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#9f224e] outline-none"
                      >
                         {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Release Date (YYYY-MM-DD)</label>
                      <input 
                        type="text" 
                        value={editFormData.releaseDate} 
                        onChange={(e) => setEditFormData({...editFormData, releaseDate: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#9f224e] outline-none"
                        placeholder="e.g. 2026-12-31"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">KPI / Goals</label>
                      <input 
                        type="text" 
                        value={editFormData.kpi} 
                        onChange={(e) => setEditFormData({...editFormData, kpi: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#9f224e] outline-none"
                        placeholder="e.g. 1M Pageviews"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                       <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                       <button 
                         onClick={handleUpdateProject} 
                         disabled={isSubmitting}
                         className="px-8 py-2.5 bg-[#9f224e] text-white rounded-xl font-black shadow-lg hover:bg-[#b92b5b] transition-all flex items-center gap-2"
                       >
                         {isSubmitting ? 'Saving...' : 'Save Changes'}
                       </button>
                    </div>
                 </div>
              ) : (
                /* READ ONLY VIEW */
                <>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Project No.</p>
                        <p className="font-mono text-base font-bold text-slate-800 dark:text-white">#{selectedProject.code}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Type</p>
                        <p className="text-base font-black text-slate-800 dark:text-white">{selectedProject.type}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                        <p className="text-base font-black text-[#9f224e] drop-shadow-[0_0_5px_rgba(159,34,78,0.5)]">{selectedProject.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Phase</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-200">{selectedProject.phase || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">KPI / Goals</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-200">{selectedProject.kpi || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Personnel</p>
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-300">PM: <span className="text-slate-800 dark:text-white">{selectedProject.pm}</span></p>
                          <p className="text-sm font-bold text-slate-500 dark:text-slate-300">PO: <span className="text-slate-800 dark:text-white">{selectedProject.po}</span></p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Designer: <span className="text-slate-700 dark:text-slate-300">{selectedProject.designer}</span></p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Release Timeline</p>
                        <p className="text-sm font-black text-emerald-500 dark:text-emerald-400">{selectedProject.releaseDate || 'TBA'}</p>
                        <p className="text-xs text-slate-500 mt-1">Tech HO: {selectedProject.techHandoff}</p>
                        <p className="text-xs text-slate-500">Quarter: Q{selectedProject.quarter}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-inner">
                      <span className="block text-[10px] font-black text-slate-400 uppercase mb-2">Department / Folder</span>
                      {selectedProject.department}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.2, 0, 0, 1); }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.2, 0, 0, 1); }
      `}</style>
    </div>
  );
};

export default App;
