import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Maximize2, Minimize2, Trash2, Play, Circle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function LogsTerminal() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<{ id: number, type: 'info' | 'error' | 'success' | 'warn', message: string, time: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const initialLogs = [
      { id: 1, type: 'info', message: 'Ollama Hub initialized successfully', time: new Date().toLocaleTimeString() },
      { id: 2, type: 'success', message: 'Connected to local Ollama instance on port 11434', time: new Date().toLocaleTimeString() },
      { id: 3, type: 'info', message: 'Scanning for installed models...', time: new Date().toLocaleTimeString() },
      { id: 4, type: 'info', message: 'Ready for interaction', time: new Date().toLocaleTimeString() },
    ] as const;
    setLogs(Array.from(initialLogs));

    const interval = setInterval(() => {
      const types = ['info', 'success', 'warn'] as const;
      const type = types[Math.floor(Math.random() * types.length)];
      const messages = {
        info: ['Stats updated', 'Heartbeat signal sent', 'Cache cleared'],
        success: ['Model list refreshed', 'API request successful'],
        warn: ['Network latency detected', 'High memory usage warning']
      };
      
      const msg = messages[type][Math.floor(Math.random() * messages[type].length)];
      
      setLogs(prev => [...prev.slice(-99), {
        id: Date.now(),
        type,
        message: msg,
        time: new Date().toLocaleTimeString()
      }]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(l => l.message.toLowerCase().includes(filter.toLowerCase()));

  return (
    <motion.div 
      layout
      className={cn(
        "flex flex-col bg-card border border-main rounded-3xl overflow-hidden transition-all duration-300 shadow-2xl glass-effect",
        isExpanded ? "h-[calc(100vh-10rem)]" : "h-96"
      )}
    >
      {/* Header */}
      <div className="flex bg-card border-b border-main px-6 py-4 items-center justify-between glass-effect">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <Circle className="w-2.5 h-2.5 fill-slate-800 text-slate-800" />
            <Circle className="w-2.5 h-2.5 fill-slate-800 text-slate-800" />
            <Circle className="w-2.5 h-2.5 fill-slate-800 text-slate-800" />
          </div>
          <div className="h-4 w-px bg-slate-800 mx-2" />
          <Terminal className="w-4 h-4 text-slate-600" />
          <span className="text-[10px] font-mono font-bold text-slate-500 tracking-[0.2em] uppercase">System_Logs</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
             <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
             <input 
               type="text" 
               placeholder="Filter..." 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               className="pl-7 pr-3 py-1 bg-sidebar/50 border border-main rounded-lg text-[10px] font-mono text-slate-400 focus:ring-1 focus:ring-brand outline-none uppercase placeholder:text-slate-700"
             />
          </div>
          <button 
            onClick={() => setLogs([])}
            className="text-[10px] font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-900 rounded text-slate-600 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-1 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex space-x-3 group hover:bg-white/5 p-0.5 rounded transition-colors"
            >
              <span className="text-slate-700 shrink-0 select-none">[{log.time}]</span>
              <span className={cn(
                "font-bold uppercase text-[9px] tracking-[0.1em] mt-0.5 shrink-0",
                log.type === 'info' ? "text-indigo-400" :
                log.type === 'error' ? "text-rose-400" :
                log.type === 'success' ? "text-emerald-400" :
                "text-amber-400"
              )}>
                {log.type}
              </span>
              <span className="text-slate-400 break-all leading-relaxed">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-sidebar/80 border-t border-main px-6 py-2 flex items-center justify-between text-[10px] font-mono text-slate-600 font-bold tracking-[0.2em] uppercase">
         <div className="flex items-center space-x-6">
            <div className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-slate-800 mr-2" /> BUF_STABLE</div>
            <div className="hidden sm:block">TTY: P001</div>
         </div>
         <div>LN: {filteredLogs.length} // UTF-8</div>
      </div>
    </motion.div>
  );
}
