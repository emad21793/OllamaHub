/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Shell from './components/layout/Shell';
import Dashboard from './components/dashboard/Dashboard';
import ModelList from './components/models/ModelList';
import ChatPanel from './components/chat/ChatPanel';
import LogsTerminal from './components/logs/LogsTerminal';
import { Settings as SettingsIcon, Globe, Shield, Activity, Save, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Languages, Phone, Mail, ExternalLink, MapPin, Sparkles, Award, MessageCircle, Key, Copy, Plus, Trash2, DownloadCloud, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useLanguage } from './lib/LanguageContext';

function ApiKeyManager({ isRtl }: { isRtl: boolean }) {
  const [keys, setKeys] = useState<{ id: string; key: string; name: string; createdAt: number }[]>([]);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ollama_api_keys');
      if (saved) setKeys(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const saveKeys = (newKeys: any[]) => {
    setKeys(newKeys);
    localStorage.setItem('ollama_api_keys', JSON.stringify(newKeys));
  };

  const generateKey = () => {
    const randomKey = 'sk-ollama-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newKeys = [
      { id: Date.now().toString(), key: randomKey, name: newKeyName || 'Default Key', createdAt: Date.now() },
      ...keys
    ];
    saveKeys(newKeys);
    setNewKeyName('');
  };

  const deleteKey = (id: string) => {
    saveKeys(keys.filter(k => k.id !== id));
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert(isRtl ? 'تم نسخ المفتاح بنجاح!' : 'API Key copied to clipboard!');
  };

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input 
          type="text" 
          placeholder={isRtl ? "اسم المفتاح الجديد (مثل: تطبيق الجوال)" : "New key name (e.g., Mobile App)"}
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand transition-colors font-sans"
        />
        <button 
          onClick={generateKey}
          className="bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-sans object-contain"
        >
          <Plus className="w-4 h-4" />
          {isRtl ? "توليد مفتاح جديد" : "Generate New Key"}
        </button>
      </div>

      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
             <Key className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-50" />
             <p className="text-xs text-slate-500 uppercase tracking-widest font-bold font-sans">
               {isRtl ? "لا توجد مفاتيح API مسجلة" : "No API Keys generated yet"}
             </p>
          </div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-700 transition-colors">
              <div>
                 <h4 className="text-sm font-bold text-slate-200 font-sans">{k.name}</h4>
                 <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(k.createdAt).toLocaleDateString()}</p>
                 <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 break-all select-all">
                    {k.key}
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => copyKey(k.key)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title={isRtl ? 'نسخ المفتاح' : 'Copy Key'}>
                    <Copy className="w-4 h-4" />
                 </button>
                 <button onClick={() => deleteKey(k.id)} className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-400/70 hover:text-rose-400 transition-colors" title={isRtl ? 'حذف المفتاح' : 'Delete Key'}>
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTheme, setCurrentTheme] = useState('theme-bento');

  useEffect(() => {
    // Remove all theme classes
    document.body.className = document.body.className
      .split(' ')
      .filter(c => !c.startsWith('theme-'))
      .join(' ');
    
    // Add current theme
    document.body.classList.add(currentTheme);
  }, [currentTheme]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'models': return <ModelList />;
      case 'chat': return <ChatPanel />;
      case 'logs': return <LogsTerminal />;
      case 'settings': return <SettingsView currentTheme={currentTheme} setTheme={setCurrentTheme} />;
      default: return <Dashboard />;
    }
  };

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Shell>
  );
}

function SettingsView({ currentTheme, setTheme }: { currentTheme: string, setTheme: (t: string) => void }) {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [genOptions, setGenOptions] = useState({
    num_thread: 4,
    temperature: 0.7,
    top_p: 0.9,
    repeat_penalty: 1.1
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'loaded' | 'error'>('idle');
  const [updateData, setUpdateData] = useState<any>(null);
  const [updatingModel, setUpdatingModel] = useState<string | null>(null);
  const [updateModelSuccess, setUpdateModelSuccess] = useState<string | null>(null);

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    try {
      const res = await axios.get('/api/ollama/check-updates');
      setUpdateData(res.data);
      setUpdateStatus('loaded');
    } catch (e) {
      setUpdateStatus('error');
    }
  };

  const handleUpdateModel = async (modelName: string) => {
    setUpdatingModel(modelName);
    setUpdateModelSuccess(null);
    try {
      await axios.post('/api/ollama/pull', { name: modelName });
      setUpdateModelSuccess(modelName);
      // Refresh status
      const res = await axios.get('/api/ollama/check-updates');
      setUpdateData(res.data);
    } catch (e) {
      console.error("Failed to update model");
    } finally {
      setUpdatingModel(null);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('/api/config');
        setOllamaUrl(res.data.ollamaUrl);
        setGeminiApiKey(res.data.geminiApiKey || '');
        setGeminiConfigured(!!res.data.geminiApiKey);
        setGenOptions(res.data.generationOptions);
      } catch (e) {
        console.error("Failed to fetch config");
      }
    };
    fetchConfig();
  }, []);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      // First save/update the current URL
      await axios.post('/api/config', { ollamaUrl, generationOptions: genOptions });
      
      const res = await axios.get('/api/ollama/test');
      setTestStatus('success');
      setTestMessage(res.data.message);
    } catch (e: any) {
      setTestStatus('error');
      // If the error came from our proxy, it might have a targetUrl field
      const details = e.response?.data;
      if (details?.targetUrl) {
        setTestMessage(`Failed to reach: ${details.targetUrl}`);
      } else {
        setTestMessage(details?.message || e.message);
      }
    }
  };

  const handleSaveGeminiKey = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/config', { geminiApiKey });
      setGeminiConfigured(true);
      setSaveStatus('success');
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSave = async (updatedConfig: any) => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await axios.post('/api/config', updatedConfig);
      setSaveStatus('success');
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const themes = [
    { id: 'theme-glass', label: 'Frosted Glass', color: 'bg-emerald-500' },
    { id: 'theme-sophisticated', label: 'Sophisticated Dark', color: 'bg-amber-500' },
    { id: 'theme-elegant', label: 'Elegant Dark', color: 'bg-slate-400' },
    { id: 'theme-bento', label: 'Bento Grid', color: 'bg-indigo-500' },
    { id: 'theme-dense', label: 'High Density', color: 'bg-blue-600' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl space-y-8 pb-12 text-left"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight uppercase">{t('configurationTitle')}</h2>
           <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">{t('updateManagementSub')}</p>
        </div>
        <button
          onClick={() => handleSave({ ollamaUrl, generationOptions: genOptions })}
          disabled={isSaving}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center gap-2",
            saveStatus === 'success' ? "bg-emerald-600 text-white" : 
            saveStatus === 'error' ? "bg-rose-600 text-white" :
            "bg-brand text-white hover:opacity-90 animate-pulse-slow"
          )}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? t('saving') : saveStatus === 'success' ? t('saveSuccess') : t('saveConfigBtn')}
        </button>
      </div>

      {/* Language & Theme Card */}
      <div className="bg-card border border-main rounded-2xl p-8 glass-effect text-left">
         <div className="flex items-center mb-8 border-b border-main/60 pb-4">
            <div className="p-3 bg-brand/10 rounded-xl mr-4 flex items-center justify-center">
               <Languages className="w-6 h-6 text-brand" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-main uppercase tracking-wider">{t('bilingualLayoutSettings')}</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 font-mono">EN & AR Integration Controller</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">{t('setLanguageLabel')}</label>
               <div className="grid grid-cols-2 gap-2 mt-1 select-none">
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "py-2 px-3 text-xs font-bold uppercase rounded-xl border text-center transition-all",
                      language === 'en' 
                        ? "bg-brand/20 border-brand text-white shadow-lg" 
                        : "bg-sidebar/50 border-main text-slate-500 hover:border-slate-700"
                    )}
                  >
                     English (EN)
                  </button>
                  <button
                    onClick={() => setLanguage('ar')}
                    className={cn(
                      "py-2 px-3 text-xs font-bold uppercase rounded-xl border text-center transition-all font-sans",
                      language === 'ar' 
                        ? "bg-brand/20 border-brand text-white shadow-lg" 
                        : "bg-sidebar/50 border-main text-slate-500 hover:border-slate-700"
                    )}
                  >
                     العربية (AR)
                  </button>
               </div>
            </div>

            <div className="md:col-span-2 space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-1">{t('themePresetLabel')}</label>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setTheme(theme.id)}
                      className={cn(
                        "flex items-center p-2.5 rounded-xl border transition-all text-left relative overflow-hidden group",
                        currentTheme === theme.id 
                          ? "bg-slate-900/50 border-brand shadow-md shadow-brand/10" 
                          : "bg-sidebar/45 border-main/80 hover:border-brand/40"
                      )}
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full mr-2 shrink-0", theme.color)} />
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider truncate",
                        currentTheme === theme.id ? "text-white" : "text-slate-500"
                      )}>
                        {theme.label}
                      </span>
                    </button>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect">
            <div className="flex items-center mb-6">
               <Globe className="w-5 h-5 text-indigo-400 mr-3" />
               <h3 className="font-bold text-main uppercase tracking-wider">{t('endpointSettings')}</h3>
            </div>
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('ollamaConnectionUrl')}</label>
                  <input 
                    type="text" 
                    value={ollamaUrl}
                    onChange={(e) => {
                      setOllamaUrl(e.target.value);
                      if (testStatus !== 'idle') setTestStatus('idle');
                    }}
                    className="w-full px-4 py-2 bg-slate-950/50 border border-main rounded-xl focus:ring-2 focus:ring-brand outline-none transition-all font-mono text-sm text-slate-300"
                  />
               </div>
               <div className="flex items-center justify-between space-x-2 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      testStatus === 'success' ? "bg-emerald-500" : testStatus === 'error' ? "bg-rose-500" : "bg-brand"
                    )} />
                    <span className={testStatus === 'error' ? "text-rose-400" : "text-slate-500"}>
                      {testStatus === 'success' ? t('connectionSuccess') : testStatus === 'error' ? t('connectionError') : t('statusReady')}
                    </span>
                  </div>
                  <button 
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="text-brand hover:underline disabled:opacity-50"
                  >
                    {testStatus === 'testing' ? t('testing') : t('refresh')}
                  </button>
               </div>
               {testMessage && (
                 <p className={cn(
                   "text-[9px] font-bold uppercase tracking-widest mt-1",
                   testStatus === 'success' ? "text-emerald-500/60" : "text-rose-500/60"
                 )}>
                   {testMessage}
                 </p>
               )}
            </div>
         </div>

         <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect">
            <div className="flex items-center mb-6">
               <Activity className="w-5 h-5 text-indigo-400 mr-3" />
               <h3 className="font-bold text-main uppercase tracking-wider">{t('generatorParams')}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('cpuThreads')}</label>
                  <input 
                    type="number" 
                    value={genOptions.num_thread}
                    onChange={(e) => setGenOptions({...genOptions, num_thread: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-950/50 border border-main rounded-xl text-sm text-slate-300"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('temperature')}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="2"
                    value={genOptions.temperature}
                    onChange={(e) => setGenOptions({...genOptions, temperature: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-950/50 border border-main rounded-xl text-sm text-slate-300"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('topP')}</label>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0"
                    max="1"
                    value={genOptions.top_p}
                    onChange={(e) => setGenOptions({...genOptions, top_p: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-950/50 border border-main rounded-xl text-sm text-slate-300"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('repeatPenalty')}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1"
                    max="2"
                    value={genOptions.repeat_penalty}
                    onChange={(e) => setGenOptions({...genOptions, repeat_penalty: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 bg-slate-950/50 border border-main rounded-xl text-sm text-slate-300"
                  />
               </div>
            </div>
          </div>
       </div>

       {/* Google Gemini Integration Card */}
       <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect">
          <div className="flex items-center mb-6">
             <Sparkles className="w-5 h-5 text-emerald-400 mr-3" />
             <h3 className="font-bold text-main uppercase tracking-wider">
                {isRtl ? "ربط مع Google Gemini" : "Google Gemini Integration"}
             </h3>
          </div>
          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   {isRtl ? "مفتاح Google Gemini API" : "Google Gemini API Key"}
                </label>
                <div className="flex gap-2">
                   <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder={isRtl ? "أدخل مفتاح Gemini API..." : "Enter Gemini API Key..."}
                      className="flex-1 px-4 py-2 bg-slate-950/50 border border-main rounded-xl focus:ring-2 focus:ring-brand outline-none transition-all font-mono text-sm text-slate-300"
                   />
                   <button
                      onClick={handleSaveGeminiKey}
                      disabled={isSaving}
                      className="px-4 py-2 bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                   >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {isRtl ? "حفظ" : "Save"}
                   </button>
                </div>
                <p className="text-[9px] text-slate-600 mt-1 font-sans">
                   {isRtl
                      ? "احصل على مفتاح مجاني من Google AI Studio. يمكّنك هذا من استخدام نماذج Gemini حتى عند عدم اتصال Ollama."
                      : "Get a free key from Google AI Studio. Enables Gemini models in chat even when Ollama is offline."}
                </p>
             </div>
             <div className="flex items-center gap-3 text-[10px]">
                <span className={cn(
                   "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                   geminiConfigured ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"
                )}>
                   {geminiConfigured
                      ? (isRtl ? "مفعل ✓" : "Connected ✓")
                      : (isRtl ? "غير مفعل" : "Not configured")}
                </span>
                <a
                   href="https://aistudio.google.com/app/apikey"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-brand hover:underline flex items-center gap-1"
                >
                   <ExternalLink className="w-3 h-3" />
                   {isRtl ? "الحصول على مفتاح" : "Get API Key"}
                </a>
             </div>
          </div>
       </div>
       
        {/* API Key Generation & Integrated Runner Overview Section */}
       <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect mb-8 text-left">
          <div className="flex items-center mb-6 border-b border-main pb-4">
             <div className="p-3 bg-brand/10 rounded-xl mr-4 flex items-center justify-center">
                <Shield className="w-6 h-6 text-brand" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-main uppercase tracking-wider">{isRtl ? "نظام توليد مفاتيح API" : "API Key Generation System"}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 font-mono">Developer API Access & Tokens</p>
             </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-bold">
              {isRtl 
                ? "يحتوي هذا النظام على مشغل نماذج مدمج (Playground) لتجربة النماذج مباشرة، ويتيح لك أيضاً توليد مفاتيح API لاستخدام الخادم كنقطة نهاية (Endpoint) لتطبيقاتك الخارجية."
                : "This system features an integrated model runner (Playground). You can also generate API keys here to use this server as a secure endpoint for your external applications."}
            </p>
            
            <ApiKeyManager isRtl={isRtl} />
          </div>
       </div>

       {/* Export & Installation Section */}
       <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect mb-8 text-left">
          <div className="flex items-center mb-6 border-b border-main pb-4">
             <div className="p-3 bg-brand/10 rounded-xl mr-4 flex items-center justify-center">
                <DownloadCloud className="w-6 h-6 text-brand" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-main uppercase tracking-wider">{isRtl ? "تصدير وتثبيت النظام" : "System Export & Installation"}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 font-mono">Download source & deployment guides</p>
             </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4 transition-all hover:border-brand/30">
                  <div>
                     <h4 className="text-sm font-bold text-slate-200">{isRtl ? "تحميل عبر إضافة GitHub" : "GitHub Repository"}</h4>
                     <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                       {isRtl 
                         ? "يمكنك استنساخ المستودع مباشرة من GitHub لمتابعة التحديثات والمساهمة في المشروع." 
                         : "Clone the repository directly from GitHub to follow updates and contribute to the project."}
                     </p>
                  </div>
                  <a 
                    href="https://github.com/emad21793/Ollama-Hub-Control-Center" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                       <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    {isRtl ? "زيارة جيت هب" : "GitHub Repo"}
                  </a>
               </div>

               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4 transition-all hover:border-brand/30">
                  <div>
                     <h4 className="text-sm font-bold text-slate-200">{isRtl ? "تحميل ملفات المشروع (ZIP)" : "Download Project Files (ZIP)"}</h4>
                     <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                       {isRtl 
                         ? "قم بتنزيل الكود المصدري كاملاً لتشغيل النظام على خادمك المحلي أو الاستضافة. يرجى الملاحظة أنك ستحتاج إلى بيئة عمل Node.js لتشغيله بنجاح." 
                         : "Download the complete source code to run this system on your local server or hosting. Please note you will need a Node.js runtime environment."}
                     </p>
                  </div>
                  <a 
                    href="/api/download-project" 
                    target="_blank"
                    className="shrink-0 bg-brand hover:bg-brand/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-brand/20 outline-none focus:ring-2 focus:ring-brand"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    {isRtl ? "تنزيل شامل (ZIP)" : "Full Download"}
                  </a>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Windows Guide */}
               <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                  <h4 className="font-bold text-slate-300 font-mono text-sm mb-3 flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-emerald-400" />
                     Windows Installation
                  </h4>
                  <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside font-sans leading-relaxed">
                     <li>{isRtl ? "قم بتثبيت Node.js من (nodejs.org)." : "Install Node.js from the official website (nodejs.org)."}</li>
                     <li>{isRtl ? "قم بفك ضغط الملف المنزّل الخاص بالمشروع." : "Extract the downloaded project ZIP archive."}</li>
                     <li>{isRtl ? "افتح موجه الأوامر (CMD) أو (PowerShell) داخل مسار المجلد." : "Open Command Prompt (CMD) or PowerShell in the extracted folder path."}</li>
                     <li className="font-mono text-emerald-400/90 bg-emerald-400/10 inline-block px-1.5 py-0.5 rounded border border-emerald-500/20">npm install</li>
                     <br/>
                     <li className="font-mono text-indigo-400/90 bg-indigo-400/10 inline-block px-1.5 py-0.5 rounded border border-indigo-500/20">npm run dev</li>
                     <li>{isRtl ? "افتح المتصفح الخاص بك وتوجه إلى:" : "Open your web browser and navigate to:"} <span className="text-slate-300 font-mono">http://localhost:3000</span></li>
                  </ol>
               </div>

               {/* Linux/Mac Guide */}
               <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                  <h4 className="font-bold text-slate-300 font-mono text-sm mb-3 flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-brand" />
                     Linux / macOS Installation
                  </h4>
                  <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside font-sans leading-relaxed">
                     <li>{isRtl ? "تأكد من وجود Node.js ومثبت الحزم npm من خلال تشغيل" : "Ensure Node.js and npm are installed by running"} <span className="font-mono bg-slate-950 px-1 rounded">node -v</span>.</li>
                     <li>{isRtl ? "قم بفك ضغط الملف وانتقل إلى المجلد عبر الطرفية (Terminal)." : "Extract file and navigate into the directory via the terminal (cd)."}</li>
                     <li className="font-mono text-emerald-400/90 bg-emerald-400/10 inline-block px-1.5 py-0.5 rounded border border-emerald-500/20">npm install</li>
                     <br/>
                     <li className="font-mono text-brand border border-brand/20 bg-brand/10 inline-block px-1.5 py-0.5 rounded">npm run build</li>
                     <br/>
                     <li className="font-mono text-rose-400/90 bg-rose-400/10 inline-block px-1.5 py-0.5 rounded border border-rose-500/20">npm start</li>
                     <li>{isRtl ? "التطبيق الخاص بك سيعمل على المنفذ 3000 بشكل افتراضي." : "Your application will be live on port 3000 by default."}</li>
                  </ol>
               </div>
            </div>
          </div>
       </div>

       {/* Update Management Section */}
       <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect mb-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-main pb-4 text-left">
             <div className="flex items-center">
                <Shield className="w-5 h-5 text-indigo-400 mr-3" />
                <div>
                   <h3 className="font-bold text-main uppercase tracking-wider text-sm">{t('updateManagementTitle')}</h3>
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 font-sans">{t('updateManagementSub')}</p>
                </div>
             </div>
             <button
                onClick={handleCheckUpdates}
                disabled={updateStatus === 'checking'}
                className="px-4 py-2 bg-slate-950/60 hover:bg-slate-900 border border-main text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all self-start sm:self-auto font-sans"
             >
                {updateStatus === 'checking' ? (
                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                   <RefreshCw className="w-3.5 h-3.5" />
                )}
                {updateStatus === 'checking' ? t('checking') : t('checkForUpdatesBtn')}
             </button>
          </div>

          {updateStatus === 'idle' && (
             <div className="py-6 text-center font-sans text-xs text-slate-500 uppercase font-bold tracking-widest">
                {t('noUpdateChecked')}
             </div>
          )}

          {updateStatus === 'error' && (
             <div className="py-4 text-center bg-rose-950/30 border border-rose-500/20 rounded-xl font-sans text-xs text-rose-300 uppercase font-bold tracking-widest">
                {t('updateCheckFailed')}
             </div>
          )}

          {updateStatus === 'loaded' && updateData && (
             <div className="space-y-6 text-left">
                {/* Ollama Service Version Block */}
                <div className="p-4 bg-slate-950/40 border border-main rounded-xl flex items-center justify-between">
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-sans">{t('ollamaDaemonService')}</span>
                      <div className="flex items-center gap-2.5">
                         <span className="text-xs font-mono font-bold text-slate-300">{t('installedStatus')}: {updateData.localVersion}</span>
                         <span className="text-xs text-slate-600">|</span>
                         <span className="text-xs font-mono font-bold text-slate-400">{t('latestStable')}: {updateData.latestVersion}</span>
                      </div>
                   </div>
                   <div>
                      {updateData.isOllamaOutdated ? (
                         <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-bold uppercase tracking-widest font-sans">
                            {t('updateAvailable')}
                         </span>
                      ) : (
                         <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-bold uppercase tracking-widest font-sans">
                            {t('fullyUpToDate')}
                         </span>
                      )}
                   </div>
                </div>

                {/* Models Update Block */}
                <div className="space-y-3">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1 font-sans">
                      {t('modelPackageUpdates')}
                   </span>
                   <div className="border border-main rounded-xl overflow-hidden bg-slate-950/30">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b border-main bg-slate-950/65 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                               <th className="p-3 font-sans">{t('modelName')}</th>
                               <th className="p-3 font-mono">{t('modelDigest')}</th>
                               <th className="p-3 font-sans">{t('modelStatus')}</th>
                               <th className="p-3 text-right font-sans">{t('modelAction')}</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-main">
                            {updateData.models.length === 0 ? (
                               <tr>
                                  <td colSpan={4} className="p-4 text-center text-xs text-slate-500 uppercase tracking-widest font-sans">
                                     {t('noModelsToAnalyze')}
                                  </td>
                               </tr>
                            ) : (
                               updateData.models.map((m: any) => (
                                  <tr key={m.name} className="text-xs text-slate-300 hover:bg-card/25 transition-colors">
                                     <td className="p-3 font-semibold font-sans">{m.name}</td>
                                     <td className="p-3 font-mono text-[10px] text-slate-500">{m.current_digest}</td>
                                     <td className="p-3">
                                        {m.status === 'Update Available' ? (
                                           <span className="inline-flex items-center text-amber-400 font-bold uppercase tracking-wider text-[10px] font-sans">
                                              <AlertTriangle className={cn("w-3 h-3 animate-pulse", isRtl ? "ml-1" : "mr-1")} /> {t('updateAvailable')}
                                           </span>
                                        ) : (
                                           <span className="inline-flex items-center text-emerald-400 font-bold uppercase tracking-wider text-[10px] font-sans">
                                              <CheckCircle2 className={cn("w-3 h-3", isRtl ? "ml-1" : "mr-1")} /> {t('statusReady')}
                                           </span>
                                        )}
                                     </td>
                                     <td className="p-3 text-right">
                                        {m.status === 'Update Available' ? (
                                           <button
                                              onClick={() => handleUpdateModel(m.name)}
                                              disabled={updatingModel !== null}
                                              className="px-2.5 py-1 hover:bg-brand/20 text-brand outline-none border border-brand/20 hover:border-brand/40 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 font-sans"
                                           >
                                              {updatingModel === m.name ? t('pulling') : t('update')}
                                           </button>
                                        ) : (
                                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pr-2 font-sans">{t('fullyUpToDate')}</span>
                                        )}
                                     </td>
                                  </tr>
                               ))
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                {updateModelSuccess && (
                   <div className="p-3 bg-emerald-950/40 border border-emerald-500/25 rounded-xl text-emerald-300 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
                      Successfully pulled and updated {updateModelSuccess}!
                   </div>
                )}
             </div>
          )}
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Cluster Status */}
         <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 flex items-start space-x-4 lg:col-span-1 h-full">
            <Activity className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
            <div className="text-left">
               <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-sm">Cluster Status</h4>
               <p className="text-xs text-indigo-200/60 mt-1 leading-relaxed uppercase font-bold tracking-widest text-[10px]">
                 Optimization phase alpha: ensuring all origins are permitted. Check OLLAMA_ORIGINS in system environment variables if auth fails.
               </p>
            </div>
         </div>

         {/* Software Manufacturer & Support Entity Panel */}
         <div className="bg-card border border-main rounded-2xl p-6 shadow-sm glass-effect text-left lg:col-span-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-[0.03] select-none pointer-events-none">
              <Award className="w-48 h-48 rotate-12" />
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-main/60 pb-4 mb-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/15 rounded-xl text-brand">
                     <Award className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="font-bold text-main uppercase tracking-wider text-xs">{t('manufacturerTitle')}</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">FIXIT.Ai Hub Developers</p>
                  </div>
               </div>
               <div className="bg-brand/10 text-brand text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-brand/20">
                  {t('palestineMiddleEast')}
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
               <div className="space-y-3.5">
                  <div>
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('developerName')}</span>
                     <span className="font-bold text-white text-md tracking-tight block mt-0.5">{t('companySlogan')}</span>
                  </div>

                  <div>
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('supervision')}</span>
                     <span className="font-bold text-slate-200 mt-0.5 block flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {t('engineerName')}
                     </span>
                  </div>

                  <div>
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('servicesPortal')}</span>
                     <a 
                        href="https://www.facebook.com/fixit.ai.co" 
                        target="_blank" 
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline font-bold transition-all inline-flex items-center gap-1.5 mt-0.5 break-all text-[11px]"
                     >
                        facebook.com/fixit.ai.co
                        <ExternalLink className="w-3 h-3" />
                     </a>
                  </div>
               </div>

               <div className="space-y-3.5">
                  <div>
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('hqCountry')}</span>
                     <span className="font-semibold text-slate-300 block mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {t('palestineMiddleEast')}
                     </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('directSupportPhone')}</span>
                        <a 
                           href="tel:0569899098" 
                           className="font-mono font-bold text-slate-200 mt-0.5 block flex items-center gap-1.5 hover:text-brand transition-colors text-[11px]"
                        >
                           <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                           0569899098
                        </a>
                     </div>
                     <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('whatsAppContact')}</span>
                        <a 
                           href="https://wa.me/970569899098" 
                           target="_blank"
                           referrerPolicy="no-referrer"
                           rel="noopener noreferrer"
                           className="font-mono font-bold text-slate-200 mt-0.5 block flex items-center gap-1.5 hover:text-brand transition-colors text-[11px]"
                        >
                           <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                           +970 569899098
                        </a>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('mgmtEmail')}</span>
                        <a 
                           href="mailto:emad.a1993@gmail.com" 
                           className="text-[10px] font-mono font-bold text-slate-300 hover:text-brand transition-colors break-words block mt-0.5"
                        >
                           emad.a1993@gmail.com
                        </a>
                     </div>
                     <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">{t('supportEmail')}</span>
                        <a 
                           href="mailto:fixit.ai.ps@gmail.com" 
                           className="text-[10px] font-mono font-bold text-slate-300 hover:text-brand transition-colors break-words block mt-0.5"
                        >
                           fixit.ai.ps@gmail.com
                        </a>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}

