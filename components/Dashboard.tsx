
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, PieChart, Pie, TooltipProps
} from 'recharts';
import { Project, ProjectStatus, ProjectType } from '../types';

interface DashboardProps {
  projects: Project[];
  isAdmin: boolean;
}

const COLORS = ['#9f224e', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#64748b'];
const ANALYTICS_DATA_KEY = 'vne_pms_analytics_data';
type TimeFrame = 'today' | 'yesterday' | 'week' | 'month';

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-[#1e293b]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] animate-scale-in">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-2">{label}</p>
        <div className="flex items-center gap-3">
           <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#9f224e] to-[#db2777] shadow-sm"></span>
           <div className="flex flex-col">
             <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Count</span>
             <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
               {payload[0].value}
             </span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ projects, isAdmin }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('today');

  const analyticsStats = useMemo(() => {
    const rawData = localStorage.getItem(ANALYTICS_DATA_KEY);
    if (!rawData) return { users: 0, pageviews: 0 };
    
    try {
        const data = JSON.parse(rawData) as { 
          accessLog: { timestamp: number, user: string }[],
          pageviewLog: { timestamp: number, view: string }[]
        };

        const now = new Date();
        let startDate = new Date();
        
        switch (timeFrame) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'yesterday':
                startDate.setDate(now.getDate() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                const dayOfWeek = now.getDay();
                startDate.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Adjust for Sunday
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        const startTime = startDate.getTime();
        
        const filteredAccess = data.accessLog.filter(log => log.timestamp >= startTime);
        const filteredPageviews = data.pageviewLog.filter(log => log.timestamp >= startTime);

        const uniqueUsers = new Set(filteredAccess.map(log => log.user)).size;

        return { users: uniqueUsers, pageviews: filteredPageviews.length };

    } catch (error) {
        console.error("Failed to parse analytics data:", error);
        return { users: 0, pageviews: 0 };
    }
  }, [timeFrame]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      done: projects.filter(p => [ProjectStatus.DONE, ProjectStatus.HAND_OFF].includes(p.status)).length,
      inProgress: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      pending: projects.filter(p => [ProjectStatus.PENDING, ProjectStatus.PLANNING].includes(p.status)).length,
    };
  }, [projects]);

  const typeStats = useMemo(() => {
    const annProjects = projects.filter(p => p.type === ProjectType.ANNUAL);
    const newProjects = projects.filter(p => p.type === ProjectType.NEW || p.type === ProjectType.STRATEGIC);
    const getDesignerLoad = (data: Project[]) => {
      const counts = data.reduce((acc, p) => {
        const d = p.designer || 'Unassigned';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    };
    return { annCount: annProjects.length, newCount: newProjects.length, annDesigners: getDesignerLoad(annProjects), newDesigners: getDesignerLoad(newProjects) };
  }, [projects]);

  const StatCard = ({ title, value, gradient, icon }: any) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 border border-white/10 transition-transform hover:-translate-y-1 duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group ${gradient}`}>
      <div className="absolute top-0 right-0 p-4 opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-500">{icon}</div>
      <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 relative z-10">{title}</p>
      <h3 className="text-4xl font-black text-white relative z-10 drop-shadow-md">{value}</h3>
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 blur-3xl rounded-full group-hover:bg-white/20 transition-colors duration-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-scale-in">
      {isAdmin && (
        <div className="bg-gradient-to-br from-[#111827] to-[#0b1121] p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
          <div className="absolute -inset-px bg-[radial-gradient(circle_at_top_right,rgba(159,34,78,0.15)_0%,transparent_40%)]"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">System Analytics</h3>
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                {(['today', 'yesterday', 'week', 'month'] as TimeFrame[]).map(tf => (
                  <button key={tf} onClick={() => setTimeFrame(tf)} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all capitalize ${timeFrame === tf ? 'bg-[#9f224e] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>{tf}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-5">
                <div className="p-3 bg-[#9f224e]/20 text-[#db2777] rounded-xl border border-[#9f224e]/50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Users</p>
                  <p className="text-3xl font-black text-white">{analyticsStats.users}</p>
                </div>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-5">
                <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pageviews</p>
                  <p className="text-3xl font-black text-white">{analyticsStats.pageviews}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={stats.total} gradient="bg-gradient-to-br from-slate-700 to-slate-900" icon={<svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
        <StatCard title="Completed" value={stats.done} gradient="bg-gradient-to-br from-emerald-600 to-emerald-900" icon={<svg className="w-16 h-16 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard title="In Progress" value={stats.inProgress} gradient="bg-gradient-to-br from-blue-600 to-blue-900" icon={<svg className="w-16 h-16 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <StatCard title="Planning / Pending" value={stats.pending} gradient="bg-gradient-to-br from-amber-600 to-amber-900" icon={<svg className="w-16 h-16 text-amber-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 dark:bg-[#1e293b]/40 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-500 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="bg-[#9f224e] text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase shadow-[0_4px_10px_rgba(159,34,78,0.3)] tracking-wider">Annual</span>
              <h4 className="text-xl font-black text-slate-800 dark:text-white mt-4">Projects Overview ({typeStats.annCount})</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Workload</span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            {typeStats.annDesigners.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeStats.annDesigners} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.1 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1000}>
                    {typeStats.annDesigners.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase text-xs tracking-wider border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">No Data</div>}
          </div>
        </div>

        <div className="bg-white/60 dark:bg-[#1e293b]/40 backdrop-blur-xl rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase shadow-[0_4px_10px_rgba(5,150,105,0.3)] tracking-wider">New / Strategic</span>
              <h4 className="text-xl font-black text-slate-800 dark:text-white mt-4">Projects Overview ({typeStats.newCount})</h4>
            </div>
            <div className="text-right">
               <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Allocation</span>
            </div>
          </div>
          <div className="h-[320px] w-full relative">
            {typeStats.newDesigners.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={typeStats.newDesigners} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={4} dataKey="count" stroke="none" cornerRadius={6}>
                        {typeStats.newDesigners.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', bottom: 0 }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">{typeStats.newCount}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Projects</span>
                </div>
              </>
            ) : <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase text-xs tracking-wider border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">No Data</div>}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-white dark:from-[#1a1a1a]/80 dark:to-[#0f1219]/80 p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-slate-700/50 backdrop-blur-md transition-colors hover:border-[#9f224e]/30 duration-500">
        <h4 className="text-xs font-black uppercase tracking-[0.25em] mb-8 flex items-center gap-4 text-slate-500 dark:text-slate-400">
           <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9f224e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#9f224e]"></span>
            </span>
           Overall Designer Workload
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
          {Array.from(new Set([...typeStats.annDesigners.map(d => d.name), ...typeStats.newDesigners.map(d => d.name)])).map((name, i) => {
            const total = (typeStats.annDesigners.find(d => d.name === name)?.count || 0) + (typeStats.newDesigners.find(d => d.name === name)?.count || 0);
            return (
              <div key={i} className="text-center group cursor-pointer">
                <div className="relative inline-block mb-4 transition-transform group-hover:scale-110 duration-500 ease-out">
                    <svg className="w-20 h-20 -rotate-90 text-slate-200 dark:text-slate-800 drop-shadow-sm" viewBox="0 0 36 36">
                        <path className="text-slate-200 dark:text-slate-800/50" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                        <path className="text-[#9f224e] transition-all duration-1000 ease-out group-hover:text-purple-500" strokeDasharray={`${Math.min((total/5)*100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-800 dark:text-white">{total}</div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
