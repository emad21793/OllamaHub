import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Box, 
  MessageSquare, 
  Terminal, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Zap,
  Globe,
  Cpu,
  Keyboard,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '@/src/lib/LanguageContext';

interface NavItemProps {
  key?: string | number;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  isRtl?: boolean;
}

function NavItem({ icon: Icon, label, active, onClick, collapsed, isRtl }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full p-3 my-1 transition-all duration-200 rounded-xl group relative",
        active 
          ? "bg-brand text-white shadow-lg shadow-brand/20" 
          : "text-slate-400 hover:bg-card/50 hover:text-slate-200"
      )}
    >
      <Icon className={cn("w-5 h-5 min-w-[20px]", !collapsed && (isRtl ? "ml-3" : "mr-3"))} />
      {!collapsed && (
        <span className="font-bold text-xs uppercase tracking-wider whitespace-nowrap overflow-hidden transition-all">
          {label}
        </span>
      )}
      {collapsed && (
        <div className={cn(
          "absolute bg-card border border-main text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50",
          isRtl ? "right-16" : "left-16"
        )}>
          {label}
        </div>
      )}
    </button>
  );
}

export default function Shell({ 
  children, 
  activeTab, 
  setActiveTab 
}: { 
  children: React.ReactNode; 
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('Checking...');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'sandbox' | 'offline'>('checking');
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in input or textarea
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      // If typing, we only allow Alt key combinations
      if (isTyping && !e.altKey) return;

      // ? key directly opens shortcuts (only if not typing)
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Alt + K toggles shortcuts (allowed anywhere)
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Escape closes shortcuts
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
        return;
      }

      // App navigation shortcuts
      if (e.altKey) {
        let targetId = '';
        if (e.key === '1' || e.key.toLowerCase() === 'd') {
          targetId = 'dashboard';
        } else if (e.key === '2' || e.key.toLowerCase() === 'm') {
          targetId = 'models';
        } else if (e.key === '3' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'p') {
          targetId = 'chat';
        } else if (e.key === '4' || e.key.toLowerCase() === 'l') {
          targetId = 'logs';
        } else if (e.key === '5' || e.key.toLowerCase() === 's') {
          targetId = 'settings';
        }

        if (targetId) {
          e.preventDefault();
          setActiveTab(targetId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts, setActiveTab]);

  const fetchConfigAndStatus = async () => {
    try {
      const configRes = await axios.get('/api/config');
      setOllamaUrl(configRes.data.ollamaUrl || 'http://localhost:11434');
      
      const testRes = await axios.get('/api/ollama/test');
      if (testRes.data.status === 'success') {
        setConnectionStatus('connected');
      } else if (testRes.data.status === 'sandbox') {
        setConnectionStatus('sandbox');
      } else {
        setConnectionStatus('offline');
      }
    } catch (e) {
      setConnectionStatus('offline');
    }
  };

  useEffect(() => {
    fetchConfigAndStatus();
    const interval = setInterval(fetchConfigAndStatus, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [activeTab]); // Triggers refresh when changing tabs as well

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'models', label: t('models'), icon: Box },
    { id: 'chat', label: t('playground'), icon: MessageSquare },
    { id: 'logs', label: t('systemLogs'), icon: Terminal },
    { id: 'settings', label: t('ollamaConfig'), icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-dashboard">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        className={cn(
          "flex flex-col bg-sidebar text-white transition-all duration-300 relative z-20 glass-effect",
          isRtl ? "border-l border-main" : "border-r border-main"
        )}
      >
        <div className="p-6 flex items-center mb-6">
          <div className={cn(
            "w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0",
            isRtl ? "ml-3" : "mr-3"
          )}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h1 className="text-lg font-bold tracking-tight uppercase">Ollama<span className="text-indigo-400">Hub</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">Control Center</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              collapsed={collapsed}
              isRtl={isRtl}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-main">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center w-full p-3 text-slate-500 hover:text-white transition-colors"
          >
            {collapsed ? (
              isRtl ? <ChevronLeft className="w-5 h-5 mx-auto" /> : <ChevronRight className="w-5 h-5 mx-auto" />
            ) : (
              <>
                {isRtl ? <ChevronRight className="w-5 h-5 ml-3" /> : <ChevronLeft className="w-5 h-5 mr-3" />}
                <span className="text-xs font-bold uppercase tracking-widest">{t('collapse')}</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-main bg-sidebar flex items-center justify-between px-8 z-10 shrink-0 glass-effect">
          <div className="flex items-center gap-6">
            <div className="px-3 py-1.5 bg-card/30 border border-main rounded-lg flex items-center gap-2.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'checking' ? "bg-amber-500 animate-pulse" :
                connectionStatus === 'connected' ? "bg-emerald-500 animate-pulse" :
                connectionStatus === 'sandbox' ? "bg-blue-400 animate-pulse" : "bg-rose-500 animate-pulse"
              )} />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-300">
                {connectionStatus === 'checking' ? t('ollamaChecking') :
                 connectionStatus === 'connected' ? t('ollamaConnected') :
                 connectionStatus === 'sandbox' ? t('ollamaSandbox') : t('ollamaOffline')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Language Switcher */}
             <div className="flex items-center border border-main rounded-lg bg-card/30 p-0.5 select-none" dir="ltr">
               <button
                 onClick={() => setLanguage('en')}
                 className={cn(
                   "px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all",
                   language === 'en' ? "bg-brand text-white shadow-md shadow-brand/10" : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 EN
               </button>
               <button
                 onClick={() => setLanguage('ar')}
                 className={cn(
                   "px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all font-sans",
                   language === 'ar' ? "bg-brand text-white shadow-md shadow-brand/10" : "text-slate-500 hover:text-slate-300"
                 )}
               >
                 عربي
               </button>
             </div>

             <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center gap-2 bg-card/30 hover:bg-card/50 text-slate-400 hover:text-white rounded-lg px-3 py-1.5 text-[10px] font-mono tracking-widest border border-main uppercase transition-all"
                title={`${t('shortcutsTitle')} / ${t('shortcuts')}`}
             >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{t('shortcuts')}</span>
             </button>
             <div className="flex items-center gap-2 bg-card/30 rounded-lg px-3 py-1.5 text-[10px] font-mono tracking-widest text-slate-400 border border-main uppercase">
                <Globe className="w-3.5 h-3.5" />
                <span>{ollamaUrl}</span>
             </div>
          </div>
        </header>

        {connectionStatus === 'sandbox' && (
          <div className="bg-blue-950/40 border-b border-blue-500/20 px-8 py-3 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-pulse" />
              <span>
                {t('sandboxAlert')}
              </span>
            </div>
          </div>
        )}

        {connectionStatus === 'offline' && (
          <div className="bg-rose-950/40 border-b border-rose-500/20 px-8 py-3 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3 text-rose-300 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
              <span>
                {t('offlineAlert')}
              </span>
            </div>
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "text-[10px] font-bold text-rose-300 hover:text-white uppercase tracking-widest bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1 rounded-lg border border-rose-500/30 transition-all shrink-0",
                isRtl ? "mr-4" : "ml-4"
              )}
            >
              {t('configure')}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 relative">
           <AnimatePresence mode="wait">
              {children}
           </AnimatePresence>
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 text-left"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-sidebar border border-main rounded-2xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden glass-effect text-left"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand/10 rounded-xl">
                    <Keyboard className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-white uppercase tracking-wider">{t('shortcutsTitle')}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{t('shortcutsSub')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShortcuts(false)}
                  className="p-1.5 rounded-lg border border-main text-slate-400 hover:text-white hover:bg-card/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Section: Navigation */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-main pb-1.5 mb-2.5">
                    {t('appNavigation')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400 font-medium">{t('dashboard')}</span>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + 1 / Alt + D</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400 font-medium">{t('models')}</span>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + 2 / Alt + M</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400 font-medium">{t('playground')}</span>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + 3 / Alt + C</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400 font-medium">{t('systemLogs')}</span>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + 4 / Alt + L</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400 font-medium">{t('ollamaConfig')}</span>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + 5 / Alt + S</kbd>
                    </div>
                  </div>
                </div>

                {/* Section: Quick Actions */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-main pb-1.5 mb-2.5">
                    {t('quickActions')}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-slate-400 font-medium">{t('toggleShortcutsHelp')}</span>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + K  or  ?</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">{t('newChatCommand')}</span>
                        <span className="text-[10px] text-slate-500 font-medium block">{t('newChatDesc')}</span>
                      </div>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Alt + N</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">{t('closeShortcutsModal')}</span>
                        <span className="text-[10px] text-slate-500 font-medium block">{t('closeShortcutsDesc')}</span>
                      </div>
                      <kbd className="px-2 py-1 bg-card/60 border border-main rounded-md text-[10px] font-mono font-bold text-slate-300">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-main text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
                {t('dismissHelper')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
