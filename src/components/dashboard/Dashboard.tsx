import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Cpu, MemoryStick as Memory, Network, Thermometer, Box, ArrowUp, ArrowDown, LogOut, RotateCcw, RefreshCw, Server, MessageSquare, Play, Loader2, Settings, CircuitBoard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SystemStats, Model, RunningModel } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '../../lib/LanguageContext';
import LogsTerminal from '../logs/LogsTerminal';

export default function Dashboard({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { t, isRtl } = useLanguage();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [runningModels, setRunningModels] = useState<RunningModel[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [controlLoading, setControlLoading] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(() => {
    return Number(localStorage.getItem('ollama_refresh_interval')) || 3000;
  });
  const [showSettings, setShowSettings] = useState(false);

  const fetchModels = async () => {
    try {
      const [modelsRes, runningRes] = await Promise.all([
        axios.get('/api/ollama/tags'),
        axios.get('/api/ollama/ps')
      ]);
      setModels(modelsRes.data.models || []);
      setRunningModels(runningRes.data.models || []);
    } catch (e) {
      console.error("Models fetch failed");
    }
  };

  useEffect(() => {
    localStorage.setItem('ollama_refresh_interval', refreshInterval.toString());
  }, [refreshInterval]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/stats');
        setStats(res.data);
        if (res.data && res.data.cpu && res.data.memory) {
          const maxItems = Math.max(20, Math.floor(60000 / refreshInterval));
          setHistory(prev => [...prev.slice(-(maxItems - 1)), { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            cpu: res.data.cpu.load || 0,
            mem: res.data.memory.percentage || 0
          }]);
        }
      } catch (e: any) {
        console.error("Stats fetch failed:", e.message);
      }
    };

    fetchStats();
    fetchModels();

    const interval = setInterval(() => {
      fetchStats();
      fetchModels();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleControlAction = async (action: string) => {
    setControlLoading(action);
    try {
      if (action === 'unload-all') {
        await axios.post('/api/ollama/unload-all');
        fetchModels();
      } else if (action === 'restart') {
        await axios.post('/api/ollama/restart');
      } else if (action === 'refresh') {
        await fetchModels();
      }
      alert(`Action ${action} completed successfully`);
    } catch (e) {
      console.error(`Control action ${action} failed`, e);
      alert(`Failed to perform ${action}`);
    } finally {
      setControlLoading(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Find currently running model if any, otherwise fall back to first installed model
  const activeModel = runningModels.length > 0
    ? (models.find(m => m.name === runningModels[0].name || m.name === runningModels[0].model) || runningModels[0] as any)
    : models[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white tracking-tight uppercase">{t('systemMetrics')}</h2>
              <div className="relative">
                 <button 
                   onClick={() => setShowSettings(!showSettings)}
                   className="p-1.5 rounded-lg bg-sidebar/50 border border-main hover:bg-sidebar transition-colors text-slate-500 hover:text-white"
                 >
                    <Settings className={cn("w-4 h-4", showSettings && "animate-spin-slow")} />
                 </button>
                 
                 <AnimatePresence>
                   {showSettings && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95, y: 10 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95, y: 10 }}
                       className="absolute top-full left-0 mt-3 w-64 bg-card border border-main rounded-2xl p-6 shadow-2xl z-50 glass-effect"
                     >
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{t('refreshInterval')}</h4>
                        <div className="space-y-4">
                           {[1000, 3000, 5000, 10000].map((interval) => (
                             <button
                               key={interval}
                               onClick={() => {
                                 setRefreshInterval(interval);
                                 setShowSettings(false);
                               }}
                               className={cn(
                                 "w-full py-2 px-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest flex justify-between items-center",
                                 refreshInterval === interval 
                                   ? "bg-brand/20 border-brand text-brand" 
                                   : "bg-sidebar/30 border-main text-slate-500 hover:border-slate-700"
                               )}
                             >
                                <span>{interval / 1000} {t('seconds')}</span>
                                {refreshInterval === interval && <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />}
                             </button>
                           ))}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
           <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{isRtl ? "مراقبة حيّة ونشطة لموارد خادم خبيئة أولاما المحلّي." : "Real-time monitoring of your Ollama host resources."}</p>
              {stats?.os && (
                <div className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[9px] font-mono border border-brand/20">
                   {stats.os.distro || stats.os.platform} {stats.os.release} ({stats.os.arch})
                </div>
              )}
           </div>
        </div>
        <div className="flex space-x-2">
           <div className="flex items-center bg-slate-950 border border-main rounded-xl px-4 py-2 shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Box className="w-4 h-4 mr-2 text-brand" />
              <span>{models.length} {t('models')}</span>
           </div>
           <div className="flex items-center bg-slate-950 border border-main rounded-xl px-4 py-2 shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className={cn("w-2 h-2 rounded-full mr-2", runningModels.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-700")} />
              <span>{runningModels.length} {t('activeModelsNum')}</span>
           </div>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          icon={Cpu} 
          label={isRtl ? "حمولة المعالج CPU" : "CPU Load"} 
          value={`${stats?.cpu?.load?.toFixed(1) || '0.0'}%`}
          subtext={stats?.cpu?.brand || (isRtl ? "بانتظار وصول البيانات..." : "Waiting for data...")}
          color="bg-blue-500/10 text-blue-400"
          progress={stats?.cpu?.load || 0}
        />
        <StatCard 
          icon={Memory} 
          label={isRtl ? "استهلاك الذاكرة RAM" : "Memory Usage"} 
          value={`${stats?.memory?.percentage?.toFixed(1) || '0.0'}%`}
          subtext={`${formatBytes(stats?.memory?.used || 0)} / ${formatBytes(stats?.memory?.total || 0)}`}
          color="bg-purple-500/10 text-purple-400"
          progress={stats?.memory?.percentage || 0}
        />
        <StatCard 
          icon={Thermometer} 
          label={isRtl ? "حرارة المعالج" : "CPU Temp"} 
          value={`${stats?.cpu?.temp || '--'}°C`}
          subtext={isRtl ? "حرارة البيئة الكلية" : "Package Temperature"}
          color="bg-rose-500/10 text-rose-400"
          statusColor={(stats?.cpu?.temp ?? 0) > 75 ? "text-red-400" : "text-emerald-400"}
        />
        <StatCard 
          icon={CircuitBoard} 
          label={isRtl ? "اللوحة الأم" : "Motherboard"} 
          value={stats?.mainboard?.temp ? `${stats.mainboard.temp}°C` : 'N/A'}
          subtext={stats?.mainboard?.model || (isRtl ? "جاري الاستشعار..." : "Detecting...")}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatCard 
          icon={Network} 
          label={isRtl ? "تدفق الشبكة I/O" : "Network I/O"} 
          value={
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-emerald-400">
                 <ArrowDown className="w-3 h-3" />
                 <span className="text-lg font-mono">{formatBytes(stats?.network[0]?.rx_sec || 0)}/s</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                 <ArrowUp className="w-3 h-3" />
                 <span className="text-lg font-mono">{formatBytes(stats?.network[0]?.tx_sec || 0)}/s</span>
              </div>
            </div>
          }
          subtext={isRtl ? "معدل التدفق الفعلي" : "Active Throughput"}
          color="bg-indigo-500/10 text-indigo-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resource Charts */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-8 border border-main shadow-sm glass-effect">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{isRtl ? "سجل استهلاك الموارد" : "Resource History"}</h3>
              <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-wider">
                 <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2" /> CPU</div>
                 <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-purple-500 mr-2" /> RAM</div>
              </div>
           </div>
           
           <div className="h-72 w-full min-h-[288px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="mem" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Active Model & Recent Activity */}
        <div className="space-y-8">
           <div className="bg-brand rounded-2xl p-6 text-white overflow-hidden relative group shadow-lg shadow-indigo-900/40">
              <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                 <Box className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{isRtl ? "مستقر ونشط" : "Active Stable"}</span>
                 </div>
                 <h3 className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em] mb-1">{isRtl ? "النموذج الأخير" : "Most Recent Model"}</h3>
                 <h4 className="text-2xl font-bold mb-4 capitalize">{activeModel?.name || (isRtl ? "لا توجد نماذج مفعّلة" : "No Models")}</h4>
                 
                 <div className="flex space-x-3 mb-6">
                    <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                       {activeModel?.details?.parameter_size || 'N/A'} {isRtl ? "معاملات" : "Parameters"}
                    </div>
                    <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                       {activeModel?.details?.quantization_level || 'N/A'}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setActiveTab?.('chat')}
                      className="w-full py-2.5 bg-white text-brand hover:bg-slate-100 transition-all rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                    >
                       <MessageSquare className="w-3 h-3" />
                       {isRtl ? "دردش مع " : "Chat with "}{activeModel?.name?.split(':')[0]}
                    </button>
                    <div className="flex gap-2">
                       <button className="flex-1 py-2 bg-indigo-600/30 hover:bg-indigo-600/40 border border-white/10 transition-all rounded-xl font-bold text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-2">
                          <Play className="w-3 h-3" />
                          {isRtl ? "تبديل" : "Switch"}
                       </button>
                       <button 
                        onClick={async () => {
                          if (activeModel) {
                            setControlLoading('stop-active');
                            try {
                              await axios.post('/api/ollama/unload', { model: activeModel.name });
                              fetchModels();
                            } catch (e) {
                              console.error('Failed to stop model', e);
                            } finally {
                              setControlLoading(null);
                            }
                          }
                        }}
                        disabled={controlLoading === 'stop-active'}
                        className="flex-1 py-2 bg-rose-600/30 hover:bg-rose-600/40 border border-white/10 transition-all rounded-xl font-bold text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-2"
                       >
                          {controlLoading === 'stop-active' ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                          {isRtl ? "إيقاف" : "Stop"}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

         <AnimatePresence>
           {runningModels.length > 0 && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 10 }}
               className="bg-card rounded-2xl p-6 border border-main shadow-sm glass-effect"
             >
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('activeModelsNum')}</h3>
                   <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest border border-emerald-500/20">
                      {isRtl ? "مباشر" : "Live"}
                   </div>
                </div>
                
                <div className="space-y-4">
                   {runningModels.map((m) => (
                     <div key={m.name} className="p-4 bg-sidebar/30 border border-main rounded-xl group hover:border-slate-700 transition-all">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <h4 className="text-sm font-bold text-white mb-0.5">{m.name}</h4>
                              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{m.details.parameter_size} • {m.details.quantization_level}</p>
                           </div>
                           <button 
                             onClick={async () => {
                               try {
                                 await axios.post('/api/ollama/unload', { model: m.name });
                                 fetchModels();
                               } catch (e) {
                                 console.error('Failed to unload');
                               }
                             }}
                             className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 transition-colors"
                           >
                              <LogOut className="w-3.5 h-3.5" />
                           </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                className="h-full bg-brand"
                              />
                           </div>
                           <span className="text-[10px] font-mono font-bold text-brand uppercase">{formatBytes(m.size_vram)}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Server & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-main rounded-2xl p-6 shadow-sm flex flex-col glass-effect">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                 <Server className="w-5 h-5 text-indigo-400 mr-3" />
                 <h3 className="font-bold text-main uppercase tracking-wider">{t('controlActions')}</h3>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 flex-1">
              <button 
                onClick={() => handleControlAction('refresh')}
                disabled={controlLoading === 'refresh'}
                className="p-4 bg-sidebar/30 border border-main rounded-xl hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                 <RefreshCw className={cn("w-6 h-6 text-slate-500 group-hover:text-brand transition-colors", controlLoading === 'refresh' && "animate-spin")} />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('forceRefresh')}</span>
              </button>
              <button 
                onClick={() => handleControlAction('unload-all')}
                disabled={controlLoading === 'unload-all'}
                className="p-4 bg-sidebar/30 border border-main rounded-xl hover:bg-amber-500/10 hover:border-amber-500/30 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                 <LogOut className={cn("w-6 h-6 text-slate-500 group-hover:text-amber-500 transition-colors", controlLoading === 'unload-all' && "animate-pulse")} />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('unloadAllModels')}</span>
              </button>
              <button 
                onClick={() => handleControlAction('restart')}
                disabled={controlLoading === 'restart'}
                className="p-4 bg-sidebar/30 border border-main rounded-xl hover:bg-rose-500/10 hover:border-rose-500/30 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                 <RotateCcw className={cn("w-6 h-6 text-slate-500 group-hover:text-rose-500 transition-colors", controlLoading === 'restart' && "animate-spin")} />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{t('restartOllama')}</span>
              </button>
              <div className="p-4 bg-sidebar/50 border border-main border-dashed rounded-xl flex flex-col items-center justify-center gap-1 opacity-50 select-none">
                 <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center">
                    <Box className="w-4 h-4 text-slate-700" />
                 </div>
                 <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest text-center">{isRtl ? "الملحقات الجانبية" : "System Addons"}</span>
              </div>
           </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-main shadow-sm glass-effect">
           <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">{isRtl ? "السجلات والعمليات" : "Operations"}</h3>
           <div className="space-y-3">
              {[
                { label: isRtl ? "جلب قائمة النماذج" : "Model List Fetch", time: isRtl ? "منذ ثانية" : "1s ago", status: 'success' },
                { label: isRtl ? "فحص حالة النظام" : "System Check", time: isRtl ? "منذ ٣ ثوانٍ" : "3s ago", status: 'success' },
                { label: isRtl ? "نبضات خادم المضيف أولاما" : "Ollama Pulse", time: isRtl ? "منذ ١٠ ثوانٍ" : "10s ago", status: 'success' }
              ].map((op, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-sidebar/30 border border-main rounded-xl">
                   <div className="flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{op.label}</span>
                   </div>
                   <span className="text-[10px] uppercase font-bold text-slate-500">{op.time}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Global Logs Section */}
      <div className="bg-card border border-main rounded-2xl overflow-hidden glass-effect">
          <div className="p-4 border-b border-main bg-sidebar/20 flex justify-between items-center">
             <div className="flex items-center">
                <RotateCcw className="w-4 h-4 text-indigo-400 mr-3 animate-pulse" />
                <h3 className="text-xs font-bold text-main uppercase tracking-widest">{t('systemTerminalStream')}</h3>
             </div>
             <button 
              onClick={() => setActiveTab?.('logs')}
              className="text-[9px] font-bold text-brand uppercase tracking-widest hover:underline"
             >
                {isRtl ? "ملء الشاشة" : "Fullscreen"}
             </button>
          </div>
          <div className="h-[300px]">
             <LogsTerminal />
          </div>
      </div>
   </motion.div>
);
}

function StatCard({ icon: Icon, label, value, subtext, color, progress, statusColor }: any) {
return (
  <div className="bg-card rounded-2xl p-6 border border-main shadow-sm transition-all hover:border-slate-700 glass-effect">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-5 h-5" />
      </div>
      {progress !== undefined && (
        <div className="w-10 h-10 relative">
           <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="16" fill="transparent" stroke="#1E293B" strokeWidth="4" />
              <circle cx="20" cy="20" r="16" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={100} strokeDashoffset={100 - progress} className={statusColor || "text-brand transition-all duration-500"} />
           </svg>
        </div>
      )}
    </div>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</p>
    <h3 className={cn("text-2xl font-mono mt-1 tabular-nums", statusColor)}>{value}</h3>
    <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">{subtext}</p>
  </div>
);
}
