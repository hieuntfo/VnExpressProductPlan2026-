
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, PieChart, Pie
} from 'recharts';
import { Project, ProjectStatus, ProjectType } from '../types';

interface DashboardProps {
  projects: Project[];
}

const COLORS = ['#9f224e', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#64748b'];

const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  // Statistics
  const stats = useMemo(() => {
    return {
      total: projects.length,
      done: projects.filter(p => [ProjectStatus.DONE, ProjectStatus.HAND_OFF].includes(p.status)).length,
      inProgress: projects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
      pending: projects.filter(p => [ProjectStatus.PENDING, ProjectStatus.PLANNING].includes(p.status)).length,
    };
  }, [projects]);

  // Statistics ANN vs NEW
  const typeStats = useMemo(() => {
    const annProjects = projects.filter(p => p.type === ProjectType.ANNUAL);
    const newProjects = projects.filter(p => p.type === ProjectType.NEW || p.type === ProjectType.STRATEGIC);

    const getDesignerLoad = (data: Project[]) => {
      const counts = data.reduce((acc, p) => {
        const d = p.designer || 'Unassigned';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      annCount: annProjects.length,
      newCount: newProjects.length,
      annDesigners: getDesignerLoad(annProjects),
      newDesigners: getDesignerLoad(newProjects)
    };
  }, [projects]);

  const StatCard = ({ title, value, gradient, icon }: any) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 shadow-xl border border-white/10 transition-transform hover:scale-[1.02] hover:shadow-2xl ${gradient}`}>
      <div className="absolute top-0 right-0 p-4 opacity-30">
        {icon}
      </div>
      <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 relative z-10">{title}</p>
      <h3 className="text-4xl font-black text-white relative z-10 drop-shadow-md">{value}</h3>
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/20 blur-2xl rounded-full"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Projects" 
          value={stats.total} 
          gradient="bg-gradient-to-br from-slate-700 to-slate-900"
          icon={<svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard 
          title="Completed" 
          value={stats.done} 
          gradient="bg-gradient-to-br from-emerald-800 to-emerald-900 border-emerald-500/30"
          icon={<svg className="w-16 h-16 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          gradient="bg-gradient-to-br from-blue-800 to-blue-900 border-blue-500/30"
          icon={<svg className="w-16 h-16 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
        <StatCard 
          title="Planning / Pending" 
          value={stats.pending} 
          gradient="bg-gradient-to-br from-amber-800 to-amber-900 border-amber-500/30"
          icon={<svg className="w-16 h-16 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ANN (Annual) */}
        <div className="bg-[#1e293b]/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="bg-[#9f224e] text-white text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-[0_0_10px_rgba(159,34,78,0.4)]">Annual</span>
              <h4 className="text-xl font-black text-white mt-3">Projects Overview ({typeStats.annCount})</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workload Distribution</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {typeStats.annDesigners.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeStats.annDesigners} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#475569" strokeOpacity={0.5} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 10px 15px rgba(0,0,0,0.5)' }} 
                  />
                  <Bar dataKey="count" fill="#9f224e" radius={[0, 4, 4, 0]} barSize={24}>
                    {typeStats.annDesigners.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-bold uppercase text-xs tracking-wider border-2 border-dashed border-slate-700 rounded-xl">No Data</div>
            )}
          </div>
        </div>

        {/* NEW (New Projects) */}
        <div className="bg-[#1e293b]/70 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-[0_0_10px_rgba(5,150,105,0.4)]">New / Strategic</span>
              <h4 className="text-xl font-black text-white mt-3">Projects Overview ({typeStats.newCount})</h4>
            </div>
            <div className="text-right">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Resource Allocation</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            {typeStats.newDesigners.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats.newDesigners}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    stroke="none"
                  >
                    {typeStats.newDesigners.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-bold uppercase text-xs tracking-wider border-2 border-dashed border-slate-700 rounded-xl">No Data</div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0f1219] text-white p-8 rounded-3xl shadow-2xl border border-slate-700/60">
        <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-3 text-slate-400">
           <span className="w-2 h-2 bg-[#9f224e] rounded-full shadow-[0_0_10px_#9f224e]"></span>
           Overall Designer Workload
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {Array.from(new Set([...typeStats.annDesigners.map(d => d.name), ...typeStats.newDesigners.map(d => d.name)])).map((name, i) => {
            const total = (typeStats.annDesigners.find(d => d.name === name)?.count || 0) + (typeStats.newDesigners.find(d => d.name === name)?.count || 0);
            return (
              <div key={i} className="text-center group cursor-pointer">
                <div className="relative inline-block mb-3 transition-transform group-hover:scale-110 duration-300">
                    <svg className="w-16 h-16 -rotate-90 text-slate-800" viewBox="0 0 36 36">
                        <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-[#9f224e] transition-all duration-1000 ease-out group-hover:text-purple-500 group-hover:drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" strokeDasharray={`${Math.min((total/5)*100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">{total}</div>
                </div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-white transition-colors">{name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
