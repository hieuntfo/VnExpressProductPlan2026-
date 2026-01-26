import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DEPARTMENTS, MOCK_PROJECTS, GOOGLE_SCRIPT_URL, MEMBERS_DATA_URL, DOCUMENTS_DATA_URL } from './constants';
import { Project, ProjectStatus, ProjectType, Member, MemberWithStats, Document } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectTable from './components/ProjectTable';
import AIAssistant from './components/AIAssistant';
import MemberHub from './components/MemberHub';
import DocumentHub from './components/DocumentHub';
import DocumentDetail from './components/DocumentDetail';

const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?output=tsv";

const REFRESH_INTERVAL = 120000; // 2 minutes auto-refresh
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Cache keys
const CACHE_KEY_PROJECTS = 'vne_pms_projects';
const SESSION_KEY_AUTH = 'vne_pms_auth_session';
const SESSION_KEY_ROLE = 'vne_pms_role';
const SESSION_KEY_TIMESTAMP = 'vne_pms_timestamp';
const SESSION_KEY_USER_NAME = 'vne_pms_username'; 
const ANALYTICS_DATA_KEY = 'vne_pms_analytics_data'; // New key for analytics

const LoginKeyVisual = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w: number, h: number, frame = 0;
    let animationFrameId: number;

    const resizeCanvas = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2
    }));

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#790937');
      sky.addColorStop(0.5, '#9f224e');
      sky.addColorStop(1, '#ff3366');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.save();
      ctx.translate(w / 2, h / 2);
      stars.forEach(star => {
        const x = star.x * w;
        const y = star.y * h;
        const z = star.z;
        const size = (1 - z / 2) * 2;
        ctx.fillStyle = `hsla(0, 100%, 100%, ${Math.abs(Math.sin(frame / 100 + star.z * Math.PI)) * 0.8 + 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      const horizon = h * 0.6;
      const mountainColor = 'rgba(255, 51, 102, 0.4)';

      // Mountains
      for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = `rgba(255, 51, 102, ${0.5 - i * 0.1})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          const y = horizon - 50 / i - Math.sin((x + frame * i * 2) / (200 / i)) * (80 / i);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Grid Floor
      ctx.save();
      ctx.translate(w / 2, horizon);
      ctx.strokeStyle = mountainColor;
      for (let i = 0; i < 50; i++) {
        const p = i / 50;
        const y = p * h * 0.4;
        const x = y * (w / h) * 1.5;
        ctx.beginPath();
        ctx.moveTo(-x, y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * w * 0.1, h * 0.4);
        ctx.stroke();
      }
      ctx.restore();

      // Neon Triangle
      ctx.save();
      ctx.translate(w / 2, h * 0.5);
      const size = Math.min(w, h) * 0.3;
      const angle = (Math.PI * 2) / 3;
      const glow = Math.sin(frame / 60) * 5 + 20;

      ctx.shadowColor = '#fff';
      ctx.shadowBlur = glow;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const x = Math.cos(angle * i + Math.PI / 2) * size;
        const y = Math.sin(angle * i + Math.PI / 2) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      ctx.shadowBlur = glow * 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.restore();
      
      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="login-keyvisual-container" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
};


const App: React.FC = () => {
  // --- Theme State (Auto-VN Time) ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    const checkTimeAndSetTheme = () => {
      const now = new Date();
      const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const currentHour = vnTime.getHours();
      const isDayTime = currentHour >= 6 && currentHour < 18;
      const shouldBeDark = !isDayTime;
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    checkTimeAndSetTheme();
    const interval = setInterval(checkTimeAndSetTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      if (newVal) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return newVal;
    });
  };

  // --- Authentication State & Logic ---
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem(SESSION_KEY_ROLE) === 'admin');
  const [userName, setUserName] = useState<string>(() => sessionStorage.getItem(SESSION_KEY_USER_NAME) || 'Guest');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth = sessionStorage.getItem(SESSION_KEY_AUTH) === 'true';
    const timestampStr = sessionStorage.getItem(SESSION_KEY_TIMESTAMP);
    if (!auth || !timestampStr) return false;
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    if (now - timestamp > SESSION_TIMEOUT) {
      sessionStorage.clear();
      return false;
    }
    return true;
  });

  const [loginTab, setLoginTab] = useState<'user' | 'admin'>('user');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [activeUserCount, setActiveUserCount] = useState(12);

  useEffect(() => {
    if (!isAdmin || !isAuthenticated) return;
    const interval = setInterval(() => {
       setActiveUserCount(prev => {
          const change = Math.floor(Math.random() * 5) - 2;
          const next = prev + change;
          return next < 5 ? 5 : next > 45 ? 45 : next;
       });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAdmin, isAuthenticated]);

  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'team' | 'document'>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterPM, setFilterPM] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterQuarter, setFilterQuarter] = useState<string>('All');

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberWithStats | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for new document modal
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [newDocumentData, setNewDocumentData] = useState({ name: '', description: '' });
  const descriptionEditorRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});

  const [newProject, setNewProject] = useState<Partial<Project>>({
    year: 2026,
    type: ProjectType.NEW,
    status: ProjectStatus.PLANNING,
    phase: 'Initialization',
    quarter: 1,
    department: DEPARTMENTS[0],
    pm: '',
    po: '',
    designer: '',
    code: '',
    description: '',
    kpi: '',
    techHandoff: '',
    releaseDate: '',
    notes: ''
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProject(null);
        setIsAddingProject(false);
        setIsAddingDocument(false);
        setIsEditing(false);
        setSelectedMember(null);
        setSelectedDocument(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- Analytics: Track Page Views ---
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
        const rawData = localStorage.getItem(ANALYTICS_DATA_KEY);
        const data = rawData ? JSON.parse(rawData) : { accessLog: [], pageviewLog: [] };
        data.pageviewLog.push({ timestamp: Date.now(), view: activeView });
        localStorage.setItem(ANALYTICS_DATA_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to log page view:", error);
    }
  }, [activeView, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const now = Date.now();

    const logAccess = (user: string) => {
        try {
            const rawData = localStorage.getItem(ANALYTICS_DATA_KEY);
            const data = rawData ? JSON.parse(rawData) : { accessLog: [], pageviewLog: [] };
            data.accessLog.push({ timestamp: now, user });
            localStorage.setItem(ANALYTICS_DATA_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Failed to log access:", error);
        }
    };

    if (loginTab === 'user') {
      if (passwordInput === "123456") {
        setIsAuthenticated(true);
        setIsAdmin(false);
        const randomId = Math.floor(Math.random() * 100) + 1;
        const generatedName = `User ${randomId}`;
        setUserName(generatedName);
        
        sessionStorage.setItem(SESSION_KEY_AUTH, 'true');
        sessionStorage.setItem(SESSION_KEY_ROLE, 'user');
        sessionStorage.setItem(SESSION_KEY_TIMESTAMP, now.toString());
        sessionStorage.setItem(SESSION_KEY_USER_NAME, generatedName);
        logAccess(generatedName);
      } else {
        setLoginError('Mật khẩu User không đúng (Gợi ý: 123456)');
      }
    } else {
      if (passwordInput === "vnexpress") {
        setIsAuthenticated(true);
        setIsAdmin(true);
        const adminName = "HieuNT";
        setUserName(adminName);

        sessionStorage.setItem(SESSION_KEY_AUTH, 'true');
        sessionStorage.setItem(SESSION_KEY_ROLE, 'admin');
        sessionStorage.setItem(SESSION_KEY_TIMESTAMP, now.toString());
        sessionStorage.setItem(SESSION_KEY_USER_NAME, adminName);
        logAccess(adminName);
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
    sessionStorage.removeItem(SESSION_KEY_USER_NAME);
    setUserName('Guest');
    setLoginTab('user');
    setPasswordInput('');
  };

  useEffect(() => {
    if (!isAuthenticated) return;
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
         handleLogout();
       }
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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

  const getNextProjectCode = useCallback(() => {
    if (!projects || projects.length === 0) return "1";
    const maxCode = projects.reduce((max, p) => {
        const num = parseInt(p.code, 10);
        return !isNaN(num) && num > max ? num : max;
    }, 0);
    return (maxCode + 1).toString();
  }, [projects]);

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${DOCUMENTS_DATA_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Failed to fetch document data");
      const tsvText = await response.text();
      if (tsvText.trim().startsWith('<') || tsvText.includes('<!DOCTYPE html')) {
          throw new Error("Received HTML instead of TSV for documents.");
      }
      const rows = tsvText.split(/\r?\n/).slice(1);
      const parsedDocs: Document[] = rows.map((rowStr, index) => {
        const row = rowStr.split('\t');
        let description = (row[3] || '');
        if (description.startsWith('"') && description.endsWith('"')) {
            description = description.substring(1, description.length - 1).replace(/""/g, '"');
        }
        return {
          id: `doc-${index}`,
          name: (row[2] || '').trim(),
          description: description.trim(),
        };
      }).filter(d => d.name);
      setDocuments(parsedDocs);
    } catch (error) {
      console.error("Document data sync error:", error);
    }
  }, [isAuthenticated]);

  const fetchMembers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(`${MEMBERS_DATA_URL}&t=${Date.now()}`);
      if (!response.ok) throw new Error("Failed to fetch member data");
      const tsvText = await response.text();
      if (tsvText.trim().startsWith('<') || tsvText.includes('<!DOCTYPE html')) {
          throw new Error("Received HTML instead of TSV for members. Check sheet URL/publishing settings.");
      }
      const rows = tsvText.split(/\r?\n/).slice(1);
      const parsedMembers: Member[] = rows.map(rowStr => {
        const row = rowStr.split('\t');
        const name = (row[1] || '').trim();
        const fullName = (row[2] || '').trim();
        const avatarFromSheet = (row[8] || '').trim();
        return {
          name: name,
          fullName: fullName,
          dob: (row[3] || '').trim(),
          phone: (row[4] || '').trim(),
          email: (row[5] || '').trim(),
          startDate: (row[6] || '').trim(),
          avatar: avatarFromSheet || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || fullName || 'VNE')}&length=1&background=random&color=fff&size=128`,
          position: (row[9] || 'Member').trim(),
        };
      }).filter(m => m.name);
      setMembers(parsedMembers);
    } catch (error) {
      console.error("Member data sync error:", error);
    }
  }, [isAuthenticated]);

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
         colMap['department'] = 4; colMap['po'] = 5; colMap['techHandoff'] = 6; colMap['releaseDate'] = 9;
         colMap['quarter'] = 10; colMap['pm'] = 12; colMap['designer'] = 13; colMap['status'] = 14;
         colMap['kpi'] = 18; headerRowIndex = 0;
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
          const statusValue = (row[14] || '').trim();
          let year = 2026; 
          const dateStr = (releaseDate + techHandoff + quarterStr).toUpperCase();
          if (dateStr.includes('/25') || dateStr.includes('2025') || quarterStr.includes('25')) year = 2025;
          else if (dateStr.includes('/24') || dateStr.includes('2024')) year = 2024;
          return {
            id: `p-${idx}`, code: getVal('code') || `${idx + 1}`, year, description: getVal('description') || 'Untitled Project',
            type: normalizeType(getVal('type')), department: getVal('department') || 'General', status: normalizeStatus(statusValue),
            phase: getVal('phase'), quarter: parseQuarter(quarterStr), techHandoff, releaseDate, pm: getVal('pm'),
            designer: getVal('designer'), po: getVal('po'), kpi: getVal('kpi'), 
          };
        });

      if (parsedProjects.length > 0) {
        setProjects(parsedProjects);
        localStorage.setItem(CACHE_KEY_PROJECTS, JSON.stringify(parsedProjects));
        setLastSyncTime(new Date());
      } else {
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
      fetchMembers();
      fetchDocuments();
      const timer = setInterval(() => {
        fetchData(true);
        fetchMembers();
        fetchDocuments();
      }, REFRESH_INTERVAL);
      return () => clearInterval(timer);
    }
  }, [fetchData, fetchMembers, fetchDocuments, isAuthenticated]);

  const { uniqueDepts, uniquePMs, uniqueStatuses, teamMemberNames } = useMemo(() => {
    const currentProjects = projects.filter(p => p.year === selectedYear);
    const pmsFromMembers = members
      .filter(m => m.position?.toLowerCase().includes('product') || m.position?.toLowerCase().includes('leader'))
      .map(m => m.name)
      .filter(Boolean)
      .sort();
      
    return { 
      uniqueDepts: Array.from(new Set(currentProjects.map(p => p.department))).filter(Boolean).sort(),
      uniquePMs: Array.from(new Set(pmsFromMembers)),
      uniqueStatuses: Object.values(ProjectStatus),
      teamMemberNames: members.map(m => m.name).sort()
    };
  }, [projects, selectedYear, members]);

  const filteredProjects = useMemo(() => {
    const currentBusinessYear = 2026;
    const baseProjects = projects.filter(p => {
      const isProjectInSelectedYear = p.year === selectedYear;
      const isReopenedFromPast = p.status === ProjectStatus.RE_OPEN && p.year < selectedYear && selectedYear === currentBusinessYear;
      return isProjectInSelectedYear || isReopenedFromPast;
    });
    return baseProjects.filter(p => {
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
            action: 'add', project_no: newProject.code, type: newProject.type, description: newProject.description, 
            department: newProject.department, product_manager: newProject.pm 
          })
        });
        alert('Đã gửi yêu cầu thêm dự án thành công!');
      } catch (error) { console.error(error); alert('Lỗi kết nối tới Google Sheet.'); }
    } else { alert('Đã thêm cục bộ.'); }
    setIsSubmitting(false); setIsAddingProject(false);
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const descriptionContent = descriptionEditorRef.current?.innerHTML || '';

    if (!newDocumentData.name || !descriptionContent.trim()) {
        alert("Vui lòng điền đầy đủ Tên và Mô tả cho tài liệu.");
        return;
    }
    setIsSubmittingDoc(true);

    const docToAdd: Document = {
        id: `local-doc-${Date.now()}`,
        name: newDocumentData.name,
        description: descriptionContent,
    };

    // Optimistic UI update
    setDocuments(prev => [docToAdd, ...prev]);

    // Sync with Google Sheet
    if (GOOGLE_SCRIPT_URL) {
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_document',
                    name: newDocumentData.name,
                    description: descriptionContent
                })
            });
            alert('Tài liệu đã được thêm và đồng bộ lên Google Sheet.');
        } catch (error) {
            console.error("Document sync error:", error);
            alert('Lỗi đồng bộ: Tài liệu đã được thêm cục bộ nhưng không thể gửi lên Google Sheet.');
        }
    } else {
        alert('Đã thêm tài liệu mới thành công (lưu cục bộ).');
    }

    // Reset state and editor
    setIsSubmittingDoc(false);
    setIsAddingDocument(false);
    setNewDocumentData({ name: '', description: '' });
    if(descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML = '';
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject || !isEditing) return;
    setIsSubmitting(true);

    const updatedProject = { ...selectedProject, ...editFormData };
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);

    if (GOOGLE_SCRIPT_URL) {
       try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'update', project_no: updatedProject.code.trim(), status: updatedProject.status,
            release_date: updatedProject.releaseDate, kpi: updatedProject.kpi
          })
        });
        alert('Cập nhật thành công! Dữ liệu đang được đồng bộ về Sheet (Project Plan).');
      } catch (error) { console.error(error); alert('Lỗi kết nối khi cập nhật. Vui lòng kiểm tra lại mạng.'); }
    } else {
      alert('Đã cập nhật cục bộ (Chế độ offline).');
    }
    setIsSubmitting(false);
    setIsEditing(false);
  };
  
  const handleUpdateDocument = async (originalName: string, updatedData: { name: string; description: string }) => {
    if (!selectedDocument) return;

    const docToUpdate: Document = {
      ...selectedDocument,
      name: updatedData.name,
      description: updatedData.description,
    };

    // Optimistic UI update
    setDocuments(prev => prev.map(d => d.id === selectedDocument.id ? docToUpdate : d));
    setSelectedDocument(docToUpdate);

    // Sync with Google Sheet
    if (GOOGLE_SCRIPT_URL) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_document',
            name: originalName, // Use original name to find the row
            newName: updatedData.name,
            newDescription: updatedData.description
          })
        });
        alert('Tài liệu đã được cập nhật và đồng bộ lên Google Sheet.');
      } catch (error) {
        console.error("Document update error:", error);
        alert('Lỗi đồng bộ: Tài liệu đã được cập nhật cục bộ nhưng không thể gửi lên Google Sheet.');
      }
    } else {
      alert('Đã cập nhật tài liệu thành công (lưu cục bộ).');
    }
  };

  const resetFilters = () => {
    setFilterDept('All'); setFilterType('All'); setFilterPM('All'); setFilterStatus('All'); setFilterQuarter('All'); setSearchQuery('');
  };

  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-200 relative transition-colors duration-700 overflow-hidden bg-[#010409]"
      >
        <LoginKeyVisual />
        <div className="relative z-10 w-full max-w-md">
           <div
             className="relative group transition-all duration-300"
           >
              <div className="absolute -inset-[1px] bg-gradient-to-tr from-white/10 via-transparent to-[#9f224e]/50 rounded-[2.5rem] blur-[0.5px]"></div>
              
              <div className="relative bg-[#020617]/95 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-10 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] overflow-hidden">
                  
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#9f224e] to-transparent opacity-100"></div>

                  <div className="text-center mb-10">
                      <div className="inline-block relative mb-6">
                          <div className="w-16 h-16 bg-[#9f224e] rounded-2xl flex items-center justify-center font-black text-5xl text-white shadow-[0_15px_40px_rgba(159,34,78,0.5)]">P</div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#020617]"></div>
                      </div>
                      <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">VnExpress</h1>
                      <div className="flex flex-col items-center mt-3">
                         <span className="text-[#9f224e] font-black text-[10px] uppercase tracking-[0.4em] mb-1 animate-typing">Product Management</span>
                         <div className="h-0.5 w-12 bg-slate-800 rounded-full"></div>
                      </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-8">
                    <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10 relative overflow-hidden shadow-inner">
                      <button type="button" onClick={() => { setLoginTab('user'); setPasswordInput(''); setLoginError(''); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${loginTab === 'user' ? 'bg-[#9f224e] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Member</button>
                      <button type="button" onClick={() => { setLoginTab('admin'); setPasswordInput(''); setLoginError(''); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${loginTab === 'admin' ? 'bg-[#9f224e] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Admin</button>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2.5">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Establish Access Link</label>
                         <div className="relative group/input overflow-hidden rounded-2xl border border-white/10 focus-within:ring-2 focus-within:ring-[#9f224e] transition-all bg-black/60 shadow-inner">
                           <input 
                              type={isPasswordVisible ? 'text' : 'password'} 
                              value={passwordInput} 
                              onChange={(e) => setPasswordInput(e.target.value)} 
                              className={`w-full pl-6 pr-14 py-5 bg-transparent text-white font-bold text-xl focus:outline-none transition-all placeholder:tracking-normal placeholder:opacity-20 ${isPasswordVisible ? 'tracking-normal' : 'tracking-[0.5em]'}`} 
                              placeholder="••••••" 
                              autoFocus
                           />
                           <button 
                              type="button" 
                              onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                              className="absolute right-0 top-0 h-full w-14 flex items-center justify-center text-slate-500 hover:text-white transition-all z-20 group-hover/input:bg-white/5" 
                              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                           >
                              {isPasswordVisible ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 .946-2.923 3.397-5.21 6.542-6.175M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.582 17.582A4.5 4.5 0 0112 16.5a4.5 4.5 0 01-5.582-1.082M1.175 1.175L.322 2.028m21.356 21.356l-.853-.853M21.972 21.972L2.028 2.028" /></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              )}
                           </button>
                         </div>
                      </div>
                      {loginError && <p className="text-red-400 text-[11px] text-center font-bold bg-red-400/10 py-3 rounded-xl border border-red-400/20">{loginError}</p>}
                    </div>
                    
                    <button type="submit" className="w-full py-5 bg-gradient-to-br from-[#9f224e] to-[#db2777] text-white font-black rounded-2xl shadow-[0_15px_30px_-10px_rgba(159,34,78,0.6)] hover:shadow-[0_20px_40px_-5px_rgba(159,34,78,0.8)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 border border-white/10">
                      Link Connection
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </form>
              </div>
           </div>
           
           <div className="mt-14 text-center text-slate-200 text-[10px] font-bold uppercase tracking-[0.3em] space-y-2.5 opacity-100 shadow-sm">
              <p>© 2026 VnExpress ProductHub System</p>
              <p className="normal-case tracking-normal text-slate-300 font-semibold">nguyenhieu@vnexpress.net | 0902423384</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                 <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span> Signal Active</span>
                 <span className="w-[1px] h-3 bg-slate-700"></span>
                 <span>Enterprise Level Protection</span>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121] flex font-sans text-slate-800 dark:text-slate-200 selection:bg-vne-primary selection:text-white relative transition-colors duration-700">
      
      <Sidebar activeView={activeView} setActiveView={setActiveView} isAdmin={isAdmin} userName={userName} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 md:p-10 relative z-10 transition-all duration-500">
        <header className="flex items-center justify-between mb-10 pb-6 relative z-10 animate-fade-in">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-vne-primary shadow-[0_0_8px_var(--vne-primary)]'}`}></span>
                 <span className="text-[10px] font-black uppercase text-vne-primary tracking-[0.3em]">
                   {isRefreshing ? 'Syncing...' : isAdmin ? 'Admin Mode' : 'Live System'}
                 </span>
              </div>

              {lastSyncTime && !isRefreshing && (
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hidden md:block">
                    | Last synced: {lastSyncTime.toLocaleTimeString('vi-VN')}
                </div>
              )}
              
              {isAdmin && (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">
                       {activeUserCount} Users Online
                    </span>
                 </div>
              )}
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
              {activeView === 'dashboard' ? `Report ${selectedYear}` : 
               activeView === 'projects' ? 'Project Plan' : 
               activeView === 'team' ? 'Member Hub' :
               'Document Center'}
            </h1>
            
            <div className="flex items-center gap-6 mt-6">
              {['dashboard', 'projects'].includes(activeView) && (
                <>
                  <div className="flex bg-slate-200/50 dark:bg-slate-800/30 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 p-1 rounded-xl inline-flex shadow-sm">
                    {[2025, 2026].map(yr => (
                      <button key={yr} onClick={() => setSelectedYear(yr)} className={`px-8 py-2 text-xs font-black rounded-lg transition-all ${selectedYear === yr ? 'bg-vne-primary text-white shadow-[0_0_15px_var(--vne-glow)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>{yr}</button>
                    ))}
                  </div>
                  <div className="flex flex-col border-l border-slate-300 dark:border-slate-700/50 pl-6">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Projects</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{projects.filter(p => p.year === selectedYear).length} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">Records</span></span>
                  </div>
                </>
              )}
              {activeView === 'team' && (
                  <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Members</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{members.length} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">Records</span></span>
                  </div>
              )}
               {activeView === 'document' && (
                  <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Documents</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{documents.length} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">Records</span></span>
                  </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button onClick={toggleTheme} className="p-4 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 rounded-2xl text-slate-500 dark:text-slate-300 hover:text-vne-primary hover:border-vne-primary/30 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 hover:shadow-lg" title="Toggle Theme">
               {isDarkMode ? (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
               ) : (
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
               )}
            </button>

            <button onClick={() => { fetchData(false); fetchMembers(); fetchDocuments(); }} disabled={isRefreshing} className={`p-4 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border border-slate-300 dark:border-slate-700/50 rounded-2xl text-slate-500 dark:text-slate-300 hover:text-vne-primary hover:border-vne-primary/30 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 hover:shadow-lg ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`} title="Force Refresh">
              <svg className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            {['dashboard', 'projects'].includes(activeView) && (
              <button onClick={() => { setNewProject(prev => ({ ...prev, code: getNextProjectCode() })); setIsAddingProject(true); }} className="bg-gradient-to-r from-vne-primary to-vne-secondary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_10px_20px_var(--vne-glow)] flex items-center gap-2 hover:brightness-110 hover:-translate-y-1 transition-all transform active:scale-95 active:translate-y-0 border border-white/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                NEW PROJECT
              </button>
            )}
             {activeView === 'document' && (
              <button onClick={() => setIsAddingDocument(true)} className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-[0_10px_20px_rgba(8,145,178,0.3)] flex items-center gap-2 hover:brightness-110 hover:-translate-y-1 transition-all transform active:scale-95 active:translate-y-0 border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"></path></svg>
                NEW DOCUMENT
              </button>
            )}
          </div>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-300 dark:border-slate-700 border-t-vne-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-vne-primary/20 rounded-full blur-xl animate-pulse"></div>
                </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-black mt-8 text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Google Sheets...</p>
          </div>
        ) : (
          <div className="animate-fade-in relative z-10">
            {activeView === 'dashboard' && <Dashboard projects={projects.filter(p => p.year === selectedYear)} isAdmin={isAdmin} />}
            
            {activeView === 'projects' && (
              <div className="space-y-8">
                 <div className="sticky top-6 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-6 glow-border space-y-4 transition-all duration-300">
                    <div className="relative w-full group">
                        <input type="text" placeholder="Search projects, PM, Department..." className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700/40 rounded-2xl text-sm outline-none shadow-inner focus:ring-2 focus:ring-vne-primary focus:border-vne-primary text-slate-900 dark:text-white placeholder-slate-400 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <svg className="w-5 h-5 absolute left-4 top-4 text-slate-400 group-focus-within:text-vne-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        
                        {(searchQuery || filterDept !== 'All' || filterPM !== 'All' || filterStatus !== 'All' || filterType !== 'All' || filterQuarter !== 'All') && (
                          <button onClick={resetFilters} className="absolute right-4 top-3 text-[10px] font-bold text-vne-primary hover:text-white uppercase tracking-wider bg-vne-primary/10 hover:bg-vne-primary px-3 py-1.5 rounded-lg transition-all">Clear Filters</button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                       {[
                         { label: 'Department', val: filterDept, set: setFilterDept, opts: uniqueDepts, all: 'All Departments' },
                         { label: 'Type', val: filterType, set: setFilterType, opts: Object.values(ProjectType), all: 'All Types' },
                         { label: 'PM', val: filterPM, set: setFilterPM, opts: uniquePMs, all: 'All PMs' },
                         { label: 'Status', val: filterStatus, set: setFilterStatus, opts: Object.values(ProjectStatus), all: 'All Statuses' },
                       ].map((f, i) => (
                        <div key={i} className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">{f.label}</label>
                          <select value={f.val} onChange={(e) => f.set(e.target.value)} className="bg-slate-100/50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300/80 dark:border-slate-700/40 rounded-xl px-3 py-3 outline-none focus:border-vne-primary focus:ring-1 focus:ring-vne-primary transition-all cursor-pointer shadow-sm">
                            <option value="All">{f.all}</option>
                            {f.opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                          </select>
                       </div>
                       ))}
                       <div className="flex flex-col gap-1.5 group">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Quarter</label>
                          <select value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)} className="bg-slate-100/50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-300/80 dark:border-slate-700/40 rounded-xl px-3 py-3 outline-none focus:border-vne-primary focus:ring-1 focus:ring-vne-primary transition-all cursor-pointer shadow-sm">
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
                    <ProjectTable projects={filteredProjects} selectedYear={selectedYear} onSelectProject={(p) => { setSelectedProject(p); setIsEditing(false); }} />
                 </div>
              </div>
            )}
            
            {activeView === 'team' && <MemberHub projects={projects.filter(p => p.year === selectedYear)} members={members} selectedMember={selectedMember} onSelectMember={setSelectedMember} />}

            {activeView === 'document' && <DocumentHub documents={documents} onSelectDocument={setSelectedDocument} />}

          </div>
        )}
      </main>

      <AIAssistant projects={projects.filter(p => p.year === selectedYear)} />

      {isAddingProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/50 rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto glow-border">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg z-10">
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
                  <input required type="text" value={newProject.code || ''} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none transition-all" placeholder="Auto-generated" onChange={e => setNewProject({...newProject, code: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Type</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none transition-all" onChange={e => setNewProject({...newProject, type: e.target.value as ProjectType})}>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Description</label>
                  <input required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none transition-all" placeholder="Detailed project name..." onChange={e => setNewProject({...newProject, description: e.target.value})} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">Department</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none" onChange={e => setNewProject({...newProject, department: e.target.value})}>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-2">PM</label>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none" onChange={e => setNewProject({...newProject, pm: e.target.value})}>{teamMemberNames.map(m => <option key={m} value={m}>{m}</option>)}</select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddingProject(false)} className="px-6 py-3 font-black text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">CANCEL</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 bg-gradient-to-r from-vne-primary to-vne-secondary text-white rounded-xl font-black shadow-[0_0_20px_var(--vne-glow)] hover:brightness-110 transform active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? 'SAVING...' : 'ADD PROJECT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/50 rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto glow-border">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg z-10">
              <div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-vne-primary uppercase tracking-widest bg-vne-primary/10 px-3 py-1 rounded-full border border-vne-primary/20">
                     {isEditing ? 'Editing Project' : 'Project Review'}
                   </span>
                   {!isEditing && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:inline-block">Press ESC to close</span>}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3 leading-tight">{selectedProject.description}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {isAdmin && !isEditing && (
                  <button onClick={() => { setIsEditing(true); setEditFormData({ status: selectedProject.status, releaseDate: selectedProject.releaseDate, kpi: selectedProject.kpi }); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-xl transition-all font-bold text-xs uppercase flex items-center gap-1">
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
                 <div className="space-y-6">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700/50 rounded-xl text-amber-800 dark:text-amber-200 text-xs font-bold">
                      Admin Mode: You are editing protected fields. Changes will be synced to the Master Sheet.
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Status</label>
                      <select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value as ProjectStatus})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none">
                         {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">Release Date (YYYY-MM-DD)</label>
                      <input type="text" value={editFormData.releaseDate} onChange={(e) => setEditFormData({...editFormData, releaseDate: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none" placeholder="e.g. 2026-12-31"/>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2">KPI / Goals</label>
                      <input type="text" value={editFormData.kpi} onChange={(e) => setEditFormData({...editFormData, kpi: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none" placeholder="e.g. 1M Pageviews"/>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                       <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                       <button onClick={handleUpdateProject} disabled={isSubmitting} className="px-8 py-2.5 bg-gradient-to-r from-vne-primary to-vne-secondary text-white rounded-xl font-black shadow-[0_0_20px_var(--vne-glow)] hover:brightness-110 transition-all flex items-center gap-2">
                         {isSubmitting ? 'Saving...' : 'Save Changes'}
                       </button>
                    </div>
                 </div>
              ) : (
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
                        <p className="text-base font-black text-vne-primary drop-shadow-[0_0_5px_var(--vne-glow)]">{selectedProject.status}</p>
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
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-inner">
                      <span className="block text-[10px] font-black text-slate-400 uppercase mb-2">Department / Folder</span>
                      {selectedProject.department}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddingDocument && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[999] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/50 rounded-3xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto glow-border">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg z-10">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create New Document</h2>
              <button onClick={() => setIsAddingDocument(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddDocument} className="p-8 space-y-6">
              <div>
                <label htmlFor="doc_name" className="block text-xs font-black text-slate-400 uppercase mb-2">Document Name</label>
                <input
                  id="doc_name"
                  required
                  type="text"
                  value={newDocumentData.name}
                  onChange={e => setNewDocumentData({ ...newDocumentData, name: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-vne-primary outline-none transition-all"
                  placeholder="e.g., Product Requirement Document (PRD) for..."
                />
              </div>
              <div>
                <label htmlFor="doc_desc" className="block text-xs font-black text-slate-400 uppercase mb-2">Description / Content</label>
                <div className="mt-1 border border-slate-200 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-vne-primary overflow-hidden">
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50">
                    <button type="button" title="Bold" onClick={() => window.document.execCommand('bold')} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-colors">B</button>
                    <button type="button" title="Italic" onClick={() => window.document.execCommand('italic')} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 italic text-slate-700 dark:text-slate-200 transition-colors">I</button>
                    <button type="button" title="Underline" onClick={() => window.document.execCommand('underline')} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 underline text-slate-700 dark:text-slate-200 transition-colors">U</button>
                    <button type="button" title="Insert Link" onClick={() => {
                        const url = prompt('Enter the URL:');
                        if (url) window.document.execCommand('createLink', false, url);
                    }} className="w-8 h-8 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
                      <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    </button>
                  </div>
                  <div
                    id="doc_desc"
                    ref={descriptionEditorRef}
                    contentEditable
                    className="w-full p-4 h-56 overflow-y-auto bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white outline-none resize-y"
                    suppressContentEditableWarning={true}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddingDocument(false)} className="px-6 py-3 font-black text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">CANCEL</button>
                <button type="submit" disabled={isSubmittingDoc} className="px-10 py-3 bg-gradient-to-r from-vne-primary to-vne-secondary text-white rounded-xl font-black shadow-[0_0_20px_var(--vne-glow)] hover:brightness-110 transform active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                  {isSubmittingDoc ? 'SAVING...' : 'CREATE DOCUMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDocument && <DocumentDetail document={selectedDocument} onClose={() => setSelectedDocument(null)} onUpdate={handleUpdateDocument} isAdmin={isAdmin} />}

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