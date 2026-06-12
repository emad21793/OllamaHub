import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Sparkles, Loader2, RotateCcw, Copy, Trash2, Box, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, Model } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { useLanguage } from '../../lib/LanguageContext';

export default function ChatPanel() {
  const { t, isRtl } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [genOptions, setGenOptions] = useState<any>(null);
  const [hasGemini, setHasGemini] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const GEMINI_MODELS: Model[] = [
    { name: "gemini-2.0-flash", digest: "gemini-live", size: 0, details: { format: "api", family: "gemini", families: ["gemini"], parameter_size: "Live API", quantization_level: "Cloud" }, modified_at: "" },
    { name: "gemini-2.5-pro", digest: "gemini-pro", size: 0, details: { format: "api", family: "gemini", families: ["gemini"], parameter_size: "Live API", quantization_level: "Cloud" }, modified_at: "" },
  ];

  const isGeminiModel = (name: string) => name?.toLowerCase().includes("gemini");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await axios.get('/api/ollama/tags');
        const availableModels = res.data.models || [];

        // Check config for Gemini key
        const configRes = await axios.get('/api/config');
        const geminiKey = configRes.data.geminiApiKey;
        setHasGemini(!!geminiKey);
        setGenOptions(configRes.data.generationOptions);

        // Add Gemini models if configured
        const allModels = geminiKey
          ? [...GEMINI_MODELS, ...availableModels]
          : availableModels;

        setModels(allModels);
        if (allModels.length > 0 && !selectedModel) {
          setSelectedModel(allModels[0].name);
        }
      } catch (e) {
        console.error("Models fetch failed");
      }
    };
    
    fetchModels();
  }, [selectedModel]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setMessages([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const endpoint = isGeminiModel(selectedModel)
        ? '/api/gemini/generate'
        : '/api/ollama/generate';

      const res = await axios.post(endpoint, {
        model: selectedModel,
        prompt: input,
        stream: false,
        options: genOptions
      });

      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: res.data.response || res.data.message?.content || 'No response',
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      const errorMsg = e.response?.data?.response || e.message;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: isGeminiModel(selectedModel)
          ? `Gemini Error: ${errorMsg}`
          : `Error: ${errorMsg}. Is Ollama running?`,
        timestamp: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[calc(100vh-10rem)] bg-card border border-main rounded-3xl overflow-hidden shadow-2xl glass-effect"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-main flex items-center justify-between glass-effect">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/40">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-main">{isRtl ? "محادثة الاستدلال" : "Inference Chat"}</h2>
            <div className="flex items-center text-[10px] text-brand font-bold uppercase tracking-widest">
              <Box className={cn("w-2.5 h-2.5", isRtl ? "ml-1" : "mr-1")} />
              {selectedModel || (isRtl ? "لم يتم تحديد أي نموذج" : "No Model Selected")}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 relative">
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-[10px] font-bold uppercase tracking-widest bg-sidebar border border-main text-slate-300 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-brand outline-none transition-all cursor-pointer hover:bg-card flex items-center gap-2 select-none min-w-[150px] justify-between"
            >
              <span>{selectedModel || (isRtl ? "لم يتم تحديد أي نموذج" : "No Model Selected")}</span>
              <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform", showDropdown && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-sidebar border border-main rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    {models.length === 0 ? (
                      <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">
                        {isRtl ? "لا توجد نماذج مثبتة" : "No Models Installed"}
                      </div>
                    ) : (
                      models.map(m => {
                        const isGemini = isGeminiModel(m.name);
                        return (
                        <button
                          key={m.digest || m.name}
                          onClick={() => {
                            setSelectedModel(m.name);
                            setShowDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between",
                            selectedModel === m.name 
                              ? "bg-brand/20 text-brand border-l-2 border-brand" 
                              : "text-slate-400 hover:bg-card hover:text-white"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {m.name}
                            {isGemini && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[7px] uppercase tracking-wider font-bold">
                                Gemini
                              </span>
                            )}
                          </span>
                          {selectedModel === m.name && (
                            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                          )}
                        </button>
                      )})
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setMessages([])}
            className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors"
            title={isRtl ? "إفراغ المحادثة" : "Clear Chat"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-12">
            <div className="w-16 h-16 bg-sidebar/50 border border-main rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Bot className="w-8 h-8 text-brand" />
            </div>
            <h3 className="text-xl font-bold text-main mb-2 tracking-tight">{isRtl ? "النظام جاهز للتشغيل" : "System Ready"}</h3>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
              {isRtl ? "اختر أحد النماذج المتاحة لبدء جلسة الاستدلال والدردشة" : "Select model to initiate inference session"}
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.timestamp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col gap-1",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1 mx-1",
                msg.role === 'user' ? "text-slate-500" : "text-indigo-400"
              )}>
                {msg.role === 'user' ? (isRtl ? "المستخدم" : "User") : selectedModel.split(':')[0]}
              </span>
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed font-medium transition-all group relative",
                msg.role === 'user' 
                  ? "bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700" 
                  : "bg-indigo-600/10 border border-indigo-500/20 text-slate-300 rounded-tl-none shadow-sm"
              )}>
                <div className="prose prose-invert prose-sm max-w-none">
                  {msg.content}
                </div>
                <div className={cn(
                  "mt-3 pt-2 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-widest",
                  msg.role === 'user' ? "border-slate-700 text-slate-500" : "border-indigo-500/10 text-indigo-500/60"
                )}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button className="opacity-0 group-hover:opacity-100 hover:text-white transition-all"><Copy className="w-3 h-3" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-start gap-1"
          >
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1 mx-1">{selectedModel.split(':')[0]}</span>
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl rounded-tl-none shadow-sm flex space-x-1.5">
               <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-sidebar/30 border-t border-main">
        <div className="relative">
          <textarea
            rows={1}
            placeholder={isRtl ? "في انتظار توجيهاتك..." : "Awaiting instruction..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="w-full pl-6 pr-14 py-4 bg-sidebar/50 border border-main rounded-2xl outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-inner text-sm text-slate-200 placeholder:text-slate-600 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedModel || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-brand hover:opacity-90 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-brand/40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-slate-600 font-bold uppercase tracking-[0.2em] select-none">
           {isRtl ? "واجهة الأوامر والتوجيه // زر الإدخال مع Shift لسطر جديد // زر الاختصار Alt+N لبدء محادثة جديدة" : "Command Interface // Shift+Ent Line // Alt+N New Chat"}
        </p>
      </div>
    </motion.div>
  );
}
