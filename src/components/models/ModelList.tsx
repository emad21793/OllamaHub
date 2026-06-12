import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Trash2, Tag, Calendar, Database, Play, CheckCircle2, 
  Box, LogOut, ArrowUpDown, ChevronDown, ChevronUp, X, Cpu, Fingerprint, 
  LayoutGrid, List as ListIcon, Zap, BarChart2, TrendingUp, Layers, Scale,
  Activity, Download, RefreshCw, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { Model } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '../../lib/LanguageContext';

export default function ModelList() {
  const { t, isRtl } = useLanguage();
  const [models, setModels] = useState<Model[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified'>('name');
  const [isDescending, setIsDescending] = useState(true);
  const [expandedDigest, setExpandedDigest] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningModels, setRunningModels] = useState<any[]>([]);
  const [pullingModel, setPullingModel] = useState<string | null>(null);

  const POPULAR_MODELS = [
    { name: 'llama3:8b', desc: 'Powerful 8B model from Meta', size: '~4.7GB', tags: ['meta', 'general'] },
    { name: 'mistral', desc: 'Excellent general-purpose instruction model', size: '~4.1GB', tags: ['general', 'code'] },
    { name: 'gemma2:9b', desc: 'Capable open model by Google', size: '~5.5GB', tags: ['google', 'general'] },
    { name: 'phi3', desc: 'Highly capable small model by Microsoft', size: '~2.4GB', tags: ['microsoft', 'small'] },
    { name: 'llava', desc: 'Multimodal model with vision capabilities', size: '~4.7GB', tags: ['vision', 'multimodal'] },
    { name: 'qwen2.5:7b', desc: 'Strong multilingual model', size: '~4.4GB', tags: ['alibaba', 'multilingual'] }
  ];

  const fetchRunningModels = async () => {
    try {
      const res = await axios.get('/api/ollama/ps');
      setRunningModels(res.data.models || []);
    } catch (e) {
      console.error("Failed to fetch running models", e);
    }
  };

  useEffect(() => {
    fetchRunningModels();
    const interval = setInterval(fetchRunningModels, 3000);
    return () => clearInterval(interval);
  }, []);

  // Benchmarking states
  const [bmModel, setBmModel] = useState('');
  const [bmPrompt, setBmPrompt] = useState('Explain deep learning briefly in 2 sentences.');
  const [bmRunning, setBmRunning] = useState(false);
  const [bmResults, setBmResults] = useState<{
    model: string;
    promptLength: number;
    tokensCount: number;
    duration: number;
    speed: number;
    text: string;
    timestamp: string;
  }[]>(() => {
    try {
      const cached = localStorage.getItem('ollama_benchmark_results');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  // Set default benchmark model once models list are loaded
  useEffect(() => {
    if (models && models.length > 0 && !bmModel) {
      setBmModel(models[0].name);
    }
  }, [models, bmModel]);

  const runBenchmark = async () => {
    if (!bmModel) return;
    setBmRunning(true);
    const startTime = performance.now();
    try {
      const res = await axios.post('/api/ollama/generate', {
        model: bmModel,
        prompt: bmPrompt,
        stream: false,
        options: {
          num_predict: 80
        }
      });

      const endTime = performance.now();
      const clientDurationSec = (endTime - startTime) / 1000;

      let tokenCount = 0;
      let durationSec = clientDurationSec;

      if (res.data.eval_count && res.data.eval_duration) {
         tokenCount = res.data.eval_count;
         durationSec = res.data.eval_duration / 1000000000;
      } else {
         const text = res.data.response || '';
         tokenCount = Math.max(1, Math.round(text.length / 4));
         durationSec = Math.max(0.1, clientDurationSec);
      }

      const calculatedSpeed = parseFloat((tokenCount / durationSec).toFixed(2));
      const entry = {
         model: bmModel,
         promptLength: bmPrompt.length,
         tokensCount: tokenCount,
         duration: parseFloat(durationSec.toFixed(2)),
         speed: calculatedSpeed,
         text: res.data.response || '',
         timestamp: new Date().toLocaleTimeString()
      };

      const updated = [entry, ...bmResults];
      setBmResults(updated);
      localStorage.setItem('ollama_benchmark_results', JSON.stringify(updated));
    } catch (e) {
         console.error(e);
         alert('Benchmark speed test run failed.');
    } finally {
         setBmRunning(false);
    }
  };

  const clearBenchmarks = () => {
    setBmResults([]);
    localStorage.removeItem('ollama_benchmark_results');
  };

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/ollama/tags');
      const modelData = res.data.models || [];
      
      // Enhance models with capabilities
      const enhancedModels = modelData.map((m: any) => {
        const name = m.name.toLowerCase();
        
        const hasVision = 
          m.details?.families?.includes('vision') || 
          ['llava', 'moondream', 'bakllava', 'vision'].some(v => name.includes(v));
          
        const hasTools = 
          ['llama3.1', 'llama3.2', 'llama3.3', 'qwen2.5', 'mistral-nemo', 'hermes', 'command-r', 'phi3.5', 'firefunction'].some(t => name.includes(t));

        return { ...m, hasVision, hasTools };
      });
      
      setModels(enhancedModels);
    } catch (e: any) {
      console.error("Models fetch failed:", e.message);
      setError("Failed to connect to Ollama server. Ensure Ollama is installed and running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handlePullModel = async (modelName: string) => {
    if (pullingModel) return;
    setPullingModel(modelName);
    try {
      await axios.post('/api/ollama/pull', { name: modelName });
      alert(`Model ${modelName} pulled successfully.`);
      fetchModels();
    } catch (e: any) {
      console.error("Pull failed", e);
      alert(`Failed to pull model ${modelName}: ${e.message}`);
    } finally {
      setPullingModel(null);
    }
  };

  const handleUnload = async (modelName: string) => {
    try {
      await axios.post('/api/ollama/unload', { model: modelName });
      alert(`${modelName} requested to unload from memory.`);
    } catch (e) {
      console.error("Unload failed", e);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === null || bytes === undefined || isNaN(bytes)) return 'N/A';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const filteredModels = models
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'size') comparison = a.size - b.size;
      else if (sortBy === 'modified') comparison = new Date(a.modified_at).getTime() - new Date(b.modified_at).getTime();
      
      return isDescending ? -comparison : comparison;
    });

  const toggleSort = (field: 'name' | 'size' | 'modified') => {
    if (sortBy === field) {
      setIsDescending(!isDescending);
    } else {
      setSortBy(field);
      setIsDescending(true);
    }
  };

  // Model size distribution data
  const hasModels = models && models.length > 0;
  const chartData = models.map(m => ({
    name: m.name.split(':')[0],
    fullName: m.name,
    sizeGB: parseFloat((m.size / (1024 * 1024 * 1024)).toFixed(2))
  }));

  const totalSizeBytes = models.reduce((acc, m) => acc + (m.size || 0), 0);
  const totalSizeGB = parseFloat((totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2));
  
  const averageSizeGB = hasModels 
    ? parseFloat((totalSizeGB / models.length).toFixed(2)) 
    : 0;

  const sortedBySize = [...models].sort((a, b) => (b.size || 0) - (a.size || 0));
  const largestModelName = hasModels ? sortedBySize[0].name.split(':')[0] : 'N/A';
  const largestModelSizeGB = hasModels ? parseFloat(((sortedBySize[0].size || 0) / (1024 * 1024 * 1024)).toFixed(2)) : 0;

  // Real-time Active Models data
  const hasRunningModels = runningModels && runningModels.length > 0;
  const runningChartData = runningModels.map(m => {
    const totalGB = parseFloat((m.size / (1024 * 1024 * 1024)).toFixed(2));
    const vramGB = parseFloat(((m.size_vram || 0) / (1024 * 1024 * 1024)).toFixed(2));
    const ramGB = parseFloat(Math.max((m.size - (m.size_vram || 0)) / (1024 * 1024 * 1024), 0).toFixed(2));
    
    return {
      name: m.name.split(':')[0],
      fullName: m.name,
      SystemRAM: ramGB,
      VRAM: vramGB,
      totalGB: totalGB
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight uppercase">{isRtl ? "مكتبة النماذج" : "Model Library"}</h2>
           <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">{isRtl ? "إدارة ومراقبة مستودع النماذج اللغوية المحلية الخاصة بك." : "Manage and monitor your local LLM repository."}</p>
        </div>

        <div className="flex items-center space-x-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-950 border border-main rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all w-64 text-sm text-slate-200"
              />
           </div>
           
           <div className="flex bg-sidebar/40 border border-main rounded-xl p-1 shrink-0">
              {(['name', 'size', 'modified'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSort(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                    sortBy === s ? "bg-brand text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {isRtl ? (s === 'name' ? "الاسم" : s === 'size' ? "الحجم" : "التعديل") : s}
                  {sortBy === s && (isDescending ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                </button>
              ))}
           </div>

           <div className="flex bg-sidebar/40 border border-main rounded-xl p-1 shrink-0">
              <button 
                onClick={() => setViewType('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewType === 'grid' ? "bg-brand text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewType('list')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewType === 'list' ? "bg-brand text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 text-left">
           <h3 className="text-rose-400 font-bold uppercase tracking-wider mb-2 flex items-center">
              <Download className="w-5 h-5 mr-2" />
              {isRtl ? "تثبيت Ollama محلياً" : "Install Ollama locally"}
           </h3>
           <p className="text-slate-300 text-sm mb-4">
              {isRtl ? "لم يتمكن النظام من الاتصال بخدمة Ollama. يرجى تثبيتها من الروابط أدناه وتأكيد تشغيلها على جهازك لتفعيل البحث واستخدام النماذج بسلاسة." : "The system could not connect to Ollama. Please install it using the direct links below and ensure it is running to enable discovery and inference features."}
           </p>
           <div className="flex flex-wrap gap-4">
             <a href="https://ollama.com/download/OllamaSetup.exe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-brand px-4 py-2 rounded-xl text-white text-xs font-bold transition-all">
                Windows Download
             </a>
             <a href="https://ollama.com/download/Ollama-darwin.zip" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-brand px-4 py-2 rounded-xl text-white text-xs font-bold transition-all">
                macOS Download
             </a>
             <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl text-white text-xs font-mono">
                curl -fsSL https://ollama.com/install.sh | sh
             </div>
           </div>
        </div>
      )}

      {(!error || true) && (
        <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect text-left mt-6 mb-6">
           <div>
              <h3 className="font-bold text-main uppercase tracking-wider text-sm flex items-center gap-2">
                 <Download className="w-4 h-4 text-brand" />
                 {isRtl ? "تحميل نماذج جديدة" : "Download New Models"}
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 mb-4">
                 {isRtl ? "قائمة باشهر النماذج المتاحة للتحميل الفوري من مستودع Ollama" : "Popular models available for instant download from the Ollama library."}
              </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_MODELS.map((pModel) => {
                 const isInstalled = models.some(m => m.name === pModel.name || m.name === `${pModel.name}:latest`);
                 return (
                 <div key={pModel.name} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between group hover:border-brand/40 transition-colors">
                    <div>
                      <div className="flex justify-between items-start">
                         <span className="font-bold text-slate-200 text-[13px] font-mono">{pModel.name}</span>
                         <span className="text-[10px] text-slate-500 font-mono">{pModel.size}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{pModel.desc}</p>
                      
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {pModel.tags.map(t => (
                           <span key={t} className="text-[8px] bg-slate-800/50 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                             {t}
                           </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-end">
                       <button
                          onClick={() => handlePullModel(pModel.name)}
                          disabled={!!pullingModel || isInstalled}
                          className={cn(
                             "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all",
                             isInstalled
                               ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed" 
                               : pullingModel === pModel.name 
                                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 cursor-not-allowed animate-pulse" 
                                  : (!error 
                                        ? "bg-brand/10 text-brand border border-brand/20 hover:bg-brand hover:text-white"
                                        : "bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed")
                          )}
                       >
                          {isInstalled ? (
                            <>
                               <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                            </>
                          ) : pullingModel === pModel.name ? (
                            <>
                               <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pulling...
                            </>
                          ) : (
                            <>
                               <Download className="w-3.5 h-3.5" /> Pull Model
                            </>
                          )}
                       </button>
                    </div>
                 </div>
                 );
              })}
           </div>
        </div>
      )}

      {/* Model Size Analysis (Storage Footprint Distribution Card) */}
      {hasRunningModels && (
        <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect text-left">
           <div>
              <h3 className="font-bold text-main uppercase tracking-wider text-sm flex items-center gap-2">
                 <Activity className="w-4 h-4 text-emerald-400" />
                 {isRtl ? "استهلاك الذاكرة الحي (النماذج النشطة)" : "Real-time Memory Footprint (Active Models)"}
              </h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                 {isRtl ? "مراقبة الاستهلاك الفعلي للذاكرة العشوائية (RAM) وذاكرة الفيديو (VRAM) بالجيجابايت." : "Monitor actual RAM and GPU VRAM usage in GB for currently loaded models."}
              </p>
           </div>
           
           <div className="h-64 w-full bg-slate-950/20 border border-main rounded-xl p-4 min-h-[256px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={runningChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                    <XAxis 
                       type="number"
                       stroke="#475569" 
                       fontSize={9} 
                       tickLine={false} 
                       axisLine={false} 
                       unit=" GB"
                    />
                    <YAxis 
                       type="category"
                       dataKey="name" 
                       stroke="#475569" 
                       fontSize={9} 
                       tickLine={false} 
                       axisLine={false}
                       width={100}
                    />
                    <Tooltip 
                       cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                       content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             const data = payload[0].payload;
                             return (
                                <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl glass-effect text-xs text-left">
                                   <p className="font-bold text-white uppercase tracking-wider mb-2 text-[10px]">{data.fullName}</p>
                                   <div className="space-y-1">
                                      <div className="flex justify-between gap-4">
                                         <span className="text-emerald-400 font-mono text-[10px]">VRAM</span>
                                         <span className="font-mono font-bold text-slate-300">{data.VRAM} GB</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                         <span className="text-indigo-400 font-mono text-[10px]">System RAM</span>
                                         <span className="font-mono font-bold text-slate-300">{data.SystemRAM} GB</span>
                                      </div>
                                      <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-slate-800">
                                         <span className="text-slate-500 font-mono text-[10px]">Total</span>
                                         <span className="font-mono font-bold text-slate-300">{data.totalGB} GB</span>
                                      </div>
                                   </div>
                                </div>
                             );
                          }
                          return null;
                       }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                    <Bar dataKey="VRAM" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} />
                    <Bar dataKey="SystemRAM" stackId="a" fill="#6366f1" radius={[0, 4, 4, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* Model Size Analysis (Storage Footprint Distribution Card) */}
      {hasModels && (
        <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect text-left">
           <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Side: Recharts Bar Chart of Model Sizes */}
              <div className="w-full lg:w-3/5 space-y-4">
                 <div>
                    <h3 className="font-bold text-main uppercase tracking-wider text-sm flex items-center gap-2">
                       <BarChart2 className="w-4 h-4 text-brand" />
                       {t('modelSizeAnalysis')}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                       {t('modelSizeAnalysisSub')}
                    </p>
                 </div>
                 <div className="h-64 w-full bg-slate-950/20 border border-main rounded-xl p-4 min-h-[256px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                             dataKey="name" 
                             stroke="#475569" 
                             fontSize={9} 
                             tickLine={false} 
                             axisLine={false} 
                          />
                          <YAxis 
                             stroke="#475569" 
                             fontSize={9} 
                             tickLine={false} 
                             axisLine={false} 
                             unit=" GB"
                          />
                          <Tooltip 
                             cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                             content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                   const data = payload[0].payload;
                                   return (
                                      <div className="bg-slate-950/95 border border-slate-800 rounded-xl p-3 shadow-2xl glass-effect text-xs text-left">
                                         <p className="font-bold text-white uppercase tracking-wider mb-1 text-[10px]">{data.fullName}</p>
                                         <p className="text-brand font-mono font-bold">{data.sizeGB} GB</p>
                                      </div>
                                   );
                                }
                                return null;
                             }}
                          />
                          <Bar dataKey="sizeGB" radius={[4, 4, 0, 0]}>
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#4f46e5"} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Right Side: Storage Key Statistics */}
              <div className="flex-1 bg-slate-950/45 border border-main rounded-xl p-5 flex flex-col justify-between overflow-hidden">
                 <div>
                    <div className="flex justify-between items-center mb-4 border-b border-main/80 pb-2">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                          {isRtl ? "مؤشرات التخزين الرقمية" : "Storage Metrics Summary"}
                       </span>
                       <span className="bg-brand/10 text-brand text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-brand/20 sign-effect">
                          GB Distribution
                       </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       {/* Total Size */}
                       <div className="bg-sidebar/30 border border-main/40 rounded-xl p-3 flex flex-col justify-between">
                          <div className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest gap-1.5 font-sans">
                             <Database className="w-3.5 h-3.5 text-indigo-400" />
                             {t('totalSize')}
                          </div>
                          <div className="mt-2">
                             <span className="text-lg font-mono font-bold text-white">{totalSizeGB}</span>
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 font-sans">GB</span>
                          </div>
                       </div>

                       {/* Models Tracked */}
                       <div className="bg-sidebar/30 border border-main/40 rounded-xl p-3 flex flex-col justify-between">
                          <div className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest gap-1.5 font-sans">
                             <Layers className="w-3.5 h-3.5 text-blue-400" />
                             {t('modelsCount')}
                          </div>
                          <div className="mt-2">
                             <span className="text-lg font-mono font-bold text-white">{models.length}</span>
                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1 font-sans">{isRtl ? "نماذج" : "Models"}</span>
                          </div>
                       </div>

                       {/* Largest Model */}
                       <div className="bg-sidebar/30 border border-main/40 rounded-xl p-3 flex flex-col justify-between col-span-2">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest gap-1.5 font-sans">
                                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                                {t('largestModel')}
                             </div>
                             <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{largestModelSizeGB} GB</span>
                          </div>
                          <div className="mt-2 font-bold font-sans text-xs text-slate-200 truncate uppercase tracking-wide">
                             {largestModelName}
                          </div>
                       </div>

                       {/* Average Size */}
                       <div className="bg-sidebar/30 border border-main/40 rounded-xl p-3 flex flex-col justify-between col-span-2">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest gap-1.5 font-sans">
                                <Scale className="w-3.5 h-3.5 text-amber-400" />
                                {t('averageSize')}
                             </div>
                             <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{averageSizeGB} GB</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-3 text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center border-t border-main/40 pt-2 selection:bg-none font-sans">
                    {isRtl ? "مخطط الحجم يوضح تفاصيل التخزين للنماذج لتنظيم الذاكرة المثالية" : "Allocation size summary aligns with system memory limits"}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Peer Performance Benchmarks Card */}
      <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect text-left">
         <div className="flex flex-col lg:flex-row gap-6">
            {/* Run Benchmarks Form */}
            <div className="w-full lg:w-2/5 space-y-4">
               <div>
                  <h3 className="font-bold text-main uppercase tracking-wider text-sm flex items-center gap-2">
                     <Zap className="w-4 h-4 text-amber-400" />
                     {t('benchmarketTitle')}
                  </h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                     {t('benchmarkSub')}
                  </p>
               </div>

               <div className="space-y-3 pt-2 text-left">
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">{t('chooseModel')}</label>
                     <select
                        value={bmModel}
                        onChange={(e) => setBmModel(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-main rounded-xl text-xs text-slate-300 outline-none focus:ring-2 focus:ring-brand font-sans"
                     >
                        <option value="">{isRtl ? "اختر أحد النماذج المتاحة..." : "Select a model..."}</option>
                        {models.map(m => (
                           <option key={m.name} value={m.name}>{m.name}</option>
                         ))}
                     </select>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">{t('testPrompt')}</label>
                     <textarea
                        rows={2}
                        value={bmPrompt}
                        onChange={(e) => setBmPrompt(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-main rounded-xl text-xs text-slate-300 outline-none focus:ring-2 focus:ring-brand resize-none font-sans"
                     />
                  </div>

                  <button
                     onClick={runBenchmark}
                     disabled={bmRunning || !bmModel}
                     className="w-full py-2.5 bg-brand text-white font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-sans"
                  >
                     {bmRunning ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                     )}
                     {bmRunning ? t('generating') : t('runPerformanceTest')}
                  </button>
               </div>
            </div>

            {/* Results Table */}
            <div className="flex-1 bg-slate-950/45 border border-main rounded-xl p-4 flex flex-col justify-between overflow-hidden">
               <div className="flex justify-between items-center mb-3.5 border-b border-main/80 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                     {t('speedsLog')}
                  </span>
                  {bmResults.length > 0 && (
                     <button
                        onClick={clearBenchmarks}
                        className="text-[9px] font-bold text-rose-400/70 hover:text-rose-400 uppercase tracking-widest font-sans"
                     >
                        {t('clearLogs')}
                     </button>
                  )}
               </div>

               <div className="flex-1 overflow-x-auto min-h-[160px] max-h-[220px]">
                  {bmResults.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        <Cpu className="w-8 h-8 text-slate-700 mb-2" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-sans">
                           {t('awaitingSpeedTest')}
                        </span>
                     </div>
                  ) : (
                     <table className="w-full text-left border-collapse text-xs">
                        <thead>
                           <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-main/40 font-sans">
                              <th className="py-2 px-1 font-sans">{isRtl ? "النموذج" : "Model"}</th>
                              <th className="py-2 px-1 font-sans">{t('evalDuration')}</th>
                              <th className="py-2 px-1 font-sans">{t('tokens')}</th>
                              <th className="py-2 px-1 text-right font-sans">{t('inferenceSpeed')}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-main/40">
                           {bmResults.map((r, idx) => (
                              <tr key={idx} className="hover:bg-card/20 transition-all text-slate-300">
                                 <td className="py-2 px-1 font-semibold text-slate-200 font-sans">{r.model}</td>
                                 <td className="py-2 px-1 font-mono text-[10px] text-slate-500">{r.duration}s</td>
                                 <td className="py-2 px-1 font-mono text-slate-400">{r.tokensCount}</td>
                                 <td className="py-2 px-1 text-right">
                                    <span className={cn(
                                       "inline-flex px-2 py-0.5 rounded-md font-mono font-bold text-[10px]",
                                       r.speed > 30 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                       r.speed > 15 ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                                       "bg-slate-800 text-slate-400 border border-slate-700"
                                    )}>
                                       {r.speed} {isRtl ? "رمز/ث" : "t/s"}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                      </table>
                  )}
               </div>

               <div className="mt-3 text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center border-t border-main/40 pt-2 selection:bg-none font-sans">
                  {t('speedCalculationDesc')}
               </div>
            </div>
         </div>
      </div>

      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {loading ? (
               Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-48 bg-card border border-main animate-pulse rounded-2xl" />
               ))
            ) : filteredModels.map((model, index) => {
              const isExpanded = expandedDigest === model.digest;
              
              return (
                <motion.div
                  key={model.digest}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden glass-effect cursor-pointer",
                    index === 0 ? "border-brand border-opacity-30" : "border-main",
                    isExpanded && "md:col-span-2 lg:col-span-2 ring-2 ring-brand"
                  )}
                  onClick={() => setExpandedDigest(isExpanded ? null : model.digest)}
                >
                  {index === 0 && (
                    <div className="absolute top-0 right-0 p-3">
                       <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                       <div className="w-10 h-10 bg-sidebar/50 border border-main rounded-xl flex items-center justify-center mr-3 group-hover:border-brand/50 transition-colors">
                          <Box className="w-5 h-5 text-slate-500 group-hover:text-brand" />
                       </div>
                       <div>
                          <h3 className="font-bold group-hover:text-white transition-colors uppercase tracking-wider text-sm">{model.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-mono text-slate-500 truncate w-20 uppercase tracking-widest">{model.digest.split(':')[1].slice(0, 12)}</p>
                            {(model as any).hasVision && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase rounded border border-emerald-500/20">Vision</span>
                            )}
                            {(model as any).hasTools && (
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase rounded border border-blue-500/20">Tools</span>
                            )}
                          </div>
                       </div>
                    </div>
                    {isExpanded && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExpandedDigest(null); }}
                        className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>

                  <div className={cn("grid gap-4 mb-6", isExpanded ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2")}>
                    <div className="space-y-1">
                       <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Database className="w-3 h-3 mr-1" /> Size
                       </div>
                       <p className="text-xs font-mono font-bold text-slate-300">{formatSize(model.size)}</p>
                    </div>
                    <div className="space-y-1">
                       <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Tag className="w-3 h-3 mr-1" /> Family
                       </div>
                       <p className="text-xs font-mono font-bold text-slate-300 uppercase">{model.details?.family || 'N/A'}</p>
                    </div>
                    
                    {isExpanded && (
                      <>
                        <div className="space-y-1">
                           <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Cpu className="w-3 h-3 mr-1" /> Parameters
                           </div>
                           <p className="text-xs font-mono font-bold text-slate-300 uppercase">{model.details?.parameter_size || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Fingerprint className="w-3 h-3 mr-1" /> Quantization
                           </div>
                           <p className="text-xs font-mono font-bold text-slate-300 uppercase">{model.details?.quantization_level || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Box className="w-3 h-3 mr-1" /> Format
                           </div>
                           <p className="text-xs font-mono font-bold text-slate-300 uppercase">{model.details?.format || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Calendar className="w-3 h-3 mr-1" /> Modified
                           </div>
                           <p className="text-xs font-mono font-bold text-slate-300 uppercase">{new Date(model.modified_at).toLocaleDateString()}</p>
                        </div>
                      </>
                    )}
                  </div>

                   <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                     <button className="flex-1 py-2 bg-brand hover:opacity-90 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center shadow-lg shadow-brand/40">
                        <Play className="w-3 h-3 mr-2 fill-current" /> Run Model
                     </button>
                     <button 
                       onClick={() => handleUnload(model.name)}
                       className="p-2 bg-sidebar/50 border border-main hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-500 hover:text-amber-400 rounded-xl transition-all"
                       title="Unload from memory"
                     >
                        <LogOut className="w-4 h-4" />
                     </button>
                     <button className="p-2 bg-sidebar/50 border border-main hover:border-rose-500/50 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-card border border-main rounded-2xl overflow-hidden glass-effect">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="border-b border-main bg-sidebar/30 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                   <th className="px-6 py-4">Model Name</th>
                   <th className="px-6 py-4">Family</th>
                   <th className="px-6 py-4">Size</th>
                   <th className="px-6 py-4">Capabilities</th>
                   <th className="px-6 py-4">Modified</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody>
                {loading ? (
                   Array(6).fill(0).map((_, i) => (
                      <tr key={i} className="border-b border-main/50 animate-pulse">
                         <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-full" /></td>
                      </tr>
                   ))
                ) : filteredModels.map((model) => (
                   <tr key={model.digest} className="border-b border-main/50 hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center">
                            <Box className="w-4 h-4 mr-3 text-slate-600 group-hover:text-brand" />
                            <span className="text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-tight">{model.name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 uppercase">{model.details?.family || 'N/A'}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{formatSize(model.size)}</td>
                      <td className="px-6 py-4">
                         <div className="flex gap-2">
                           {(model as any).hasVision && (
                             <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase rounded border border-emerald-500/20">Vision</span>
                           )}
                           {(model as any).hasTools && (
                             <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase rounded border border-blue-500/20">Tools</span>
                           )}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{new Date(model.modified_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end space-x-2">
                            <button className="p-1.5 bg-brand/10 text-brand rounded-lg hover:bg-brand hover:text-white transition-all">
                               <Play className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleUnload(model.name)}
                              className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-all"
                            >
                               <LogOut className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                               <Trash2 className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      )}

      {!loading && filteredModels.length === 0 && (
        <div className="py-20 text-center">
           <div className="w-16 h-16 bg-sidebar/30 border border-main rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Search className="w-8 h-8" />
           </div>
           <h3 className="text-lg font-bold text-white uppercase tracking-wider">No models found</h3>
           <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Try adjusting your search or install a new model.</p>
        </div>
      )}
    </motion.div>
  );
}
