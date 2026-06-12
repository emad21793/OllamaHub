import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Layout
    dashboard: "Dashboard",
    models: "Models",
    playground: "Playground",
    systemLogs: "System Logs",
    ollamaConfig: "Ollama Config",
    collapse: "Collapse",
    shortcuts: "Shortcuts",
    shortcutsTitle: "Keyboard Shortcuts",
    shortcutsSub: "Keyboard shortcuts & quick actions help",
    appNavigation: "App Navigation",
    quickActions: "Quick Actions",
    toggleShortcutsHelp: "Toggle Shortcuts Help",
    newChatCommand: "New Chat (inside Chat)",
    newChatDesc: "Start a brand new chat (clear prompt history)",
    closeShortcutsModal: "Close Shortcuts Modal",
    closeShortcutsDesc: "Close shortcuts menu panel",
    dismissHelper: "Press any shortcut combinations to test immediately",
    configure: "Configure",
    ollamaChecking: "Ollama: Checking",
    ollamaConnected: "Ollama: Connected",
    ollamaSandbox: "Ollama: Sandbox Mode",
    ollamaOffline: "Ollama: Offline",
    sandboxAlert: "💡 Cloud Simulator is powered by Google Gemini API. Test chat, run models and performance tests for free, no local Ollama setup required!",
    offlineAlert: "Failed to connect to local Ollama. Cloud Sandbox fallback is active. Update your settings under Ollama Config.",

    // Dashboard
    systemMetrics: "System Metrics",
    refreshInterval: "Refresh Interval",
    seconds: "Seconds",
    activeModelsNum: "Active Models",
    memoryUsageLimit: "Memory Usage Limit",
    vramAllocation: "VRAM Allocation",
    activeConnectionSpeed: "Active Connection Speed",
    runningModels: "Running Models",
    totalModelsInstalled: "Total Installed Models",
    systemTerminalStream: "System Terminal Stream",
    noModelsRunning: "No models are currently loaded in RAM. Send a prompt to load a model automatically.",
    controlActions: "Control Actions",
    unloadAllModels: "Unload All Models",
    restartOllama: "Restart Ollama Service",
    forceRefresh: "Force Status Refresh",
    gpuTemp: "GPU Core Temperature",
    networkTraffic: "Network Stream Traffic",

    // Models View
    searchPlaceholder: "Search installed models...",
    filterTag: "Filter Tag",
    addNewModel: "Pull New Model",
    modelPlaceholderName: "e.g., llama3:8b, mistral, gemma2",
    pullModelBtn: "Pull Model",
    benchmarketTitle: "Inference Benchmark Tool",
    benchmarkSub: "Measure local LLM performance (tokens/sec)",
    chooseModel: "Choose Model",
    testPrompt: "Test Prompt",
    runPerformanceTest: "Run Performance Test",
    speedsLog: "Inference Speeds Log (Tokens/sec)",
    clearLogs: "Clear logs",
    awaitingSpeedTest: "Awaiting speed test execution...",
    evalDuration: "Eval Duration",
    tokens: "Tokens",
    inferenceSpeed: "Inference Speed",
    speedCalculationDesc: "Speed calculated as actual internal evaluations or standard word-token parameters",
    benchmarkFailed: "Benchmark speed test run failed.",
    generating: "Generating...",
    licensed: "Licensed under",
    modelSizeAnalysis: "Model Size Distribution (GB)",
    modelSizeAnalysisSub: "Visualize and analyze storage footprint across installed packages.",
    totalSize: "Total Storage",
    averageSize: "Average Model Size",
    largestModel: "Largest Model",
    smallestModel: "Smallest Model",
    modelsCount: "Models Tracked",
    noModelsData: "No models found to analyze.",

    // Chat Panel
    selectModelToChat: "Select a Model to chat",
    inputPromptPlaceholder: "Type your prompt here...",
    newChatLabel: "New Chat",
    systemPrompt: "System Message",
    modelParams: "Options & Parameters",
    temperature: "Temperature (Creativity)",
    topP: "Top-P (Nucleus Sampling)",
    optionsTitle: "Parameters / الخيارات",
    unloadModelTip: "Unload model from GPU memory",
    cleanHistoryTip: "Clean history",

    // Updates & Settings
    configurationTitle: "Configuration",
    bilingualLayoutSettings: "Language & Visual Theme / اللغة والمظهر البصري",
    setLanguageLabel: "Interface Language / لغة الواجهة",
    themePresetLabel: "Theme Presets / قوالب المظهر",
    ollamaConnectionUrl: "Ollama Daemon Connection Host URL",
    testConnectionBtn: "Test Connection",
    saveConfigBtn: "Save State Configuration",
    saving: "Saving Changes...",
    saveSuccess: "Settings Applied Successfully!",
    updateManagementTitle: "Update Management",
    updateManagementSub: "Check for daemon and model updates",
    checkForUpdatesBtn: "Check for Updates",
    noUpdateCheck: "No update check performed yet. Let's verify health status.",
    ollamaDaemonService: "Ollama Daemon Service",
    installed: "Installed",
    latestStable: "Latest Stable",
    updateAvailableText: "Update Available",
    fullyUpToDateText: "Fully Up-to-date",
    modelPackageUpdates: "Model Package Updates",
    tableName: "Model Name",
    tableDigest: "Digest (SHA)",
    tableStatus: "Status",
    tableAction: "Action",
    noLocalModelsToAnalyze: "No local models to analyze.",
    actionDone: "Done",
    
    // Manufacturer and Support Keys
    manufacturerTitle: "Software Manufacturer & Support Entity",
    developerName: "Developer Name / Company",
    supervision: "Supervised By",
    servicesPortal: "Services Portal / Platform",
    hqCountry: "Headquarters & Country",
    mgmtEmail: "Administration Email",
    supportEmail: "Technical Support Email",
    directSupportPhone: "Direct Support & Maintenance Line",
    whatsAppContact: "WhatsApp Contact Support",
    companyName: "FIXIT.Ai",
    companySlogan: "FIXIT.Ai | Smart Solutions, Better Future",
    engineerName: "Eng. Emad Ali",
    palestineMiddleEast: "Palestine / Middle East",
  },
  ar: {
    // Nav & Layout
    dashboard: "لوحة التحكم",
    models: "قائمة النماذج",
    playground: "ساحة التجربة",
    systemLogs: "سجلات النظام",
    ollamaConfig: "إعدادات Ollama",
    collapse: "طي القائمة",
    shortcuts: "الاختصارات",
    shortcutsTitle: "اختصارات لوحة المفاتيح",
    shortcutsSub: "دليل الاختصارات والتحكم السريع بالكيبورد",
    appNavigation: "التنقل في التطبيق",
    quickActions: "الإجراءات السريعة",
    toggleShortcutsHelp: "عرض/إخفاء المساعدة",
    newChatCommand: "محادثة جديدة (داخل الدردشة)",
    newChatDesc: "بدء محادثة جديدة وتصفير السجل تماماً",
    closeShortcutsModal: "إغلاق نافذة الاختصارات",
    closeShortcutsDesc: "إغلاق لوحة التحكم بالاختصارات",
    dismissHelper: "اضغط على أي تركيبة كيبورد لاختبارها مباشرةً",
    configure: "ضبط الإعدادات",
    ollamaChecking: "أولاما: جاري الفحص",
    ollamaConnected: "أولاما: متصل بالخادم",
    ollamaSandbox: "أولاما: وضع المحاكاة",
    ollamaOffline: "أولاما: غير متصل",
    sandboxAlert: "💡 المحاكاة السحابية تفاعلية بالكامل عبر Google Gemini! يمكنك اختبار النماذج والتحكم وقياس سرعة الأداء مجاناً دون تثبيت محلي.",
    offlineAlert: "تعذر الاتصال بخدمة Ollama المحلية. تم تفعيل وضع المحاكاة السحابية (Sandbox). يمكنك تصحيح العنوان في إعدادات Ollama.",

    // Dashboard
    systemMetrics: "مؤشرات وقراءات النظام",
    refreshInterval: "معدل تحديث البيانات",
    seconds: "ثواني",
    activeModelsNum: "النماذج النشطة بالذاكرة",
    memoryUsageLimit: "حد استهلاك الذاكرة",
    vramAllocation: "ذاكرة كرت الشاشة (VRAM)",
    activeConnectionSpeed: "سرعة الاتصال النشط",
    runningModels: "النماذج المشغلة حالياً",
    totalModelsInstalled: "إجمالي النماذج المثبتة",
    systemTerminalStream: "تغذية أوامر النظام المباشرة",
    noModelsRunning: "لا يوجد أي نموذج نشط حالياً بذاكرة الرم (RAM). قم بإرسال رسالة ليتم تحميل النموذج تلقائياً.",
    controlActions: "إجراءات التحكم بالخدمات",
    unloadAllModels: "إفراغ الذاكرة من كافة النماذج",
    restartOllama: "إعادة تشغيل خدمة Ollama",
    forceRefresh: "تحديث البيانات يدوياً",
    gpuTemp: "درجة حرارة المعالج الرسومي (GPU)",
    networkTraffic: "معدل نقل حركة الشبكة",

    // Models View
    searchPlaceholder: "البحث في النماذج المثبتة...",
    filterTag: "تصفية الفئة",
    addNewModel: "تحميل وتثبيت نموذج جديد",
    modelPlaceholderName: "مثال: llama3:8b, mistral, gemma2",
    pullModelBtn: "جلب وتحميل النموذج",
    benchmarketTitle: "أداة قياس سرعة الاستجابة",
    benchmarkSub: "قياس سرعة معالجة وتوليد النصوص للنماذج المحلية (رمز/ثانية)",
    chooseModel: "اختر النموذج للاختبار",
    testPrompt: "نص وسياق الاختبار",
    runPerformanceTest: "تشغيل اختبار الأداء وسرعة الاستجابة",
    speedsLog: "سجل قياس السرعات المنجزة (رموز بالثانية)",
    clearLogs: "مسح السجل",
    awaitingSpeedTest: "في انتظار بدء تشغيل اختبار قياس السرعة...",
    evalDuration: "مدة المعالجة",
    tokens: "الرموز المولدة",
    inferenceSpeed: "سرعة التوليد (المعدل)",
    speedCalculationDesc: "تحسب السرعة بناءً على تقييم المعالجة الداخلي الفعلي أو متوسط ترميم الرموز للنصوص",
    benchmarkFailed: "فشل تشغيل اختبار الأداء والتوليد.",
    generating: "جاري التوليد الأعمق...",
    licensed: "مرخص بموجب",
    modelSizeAnalysis: "توزيع أحجام النماذج (جيجابايت)",
    modelSizeAnalysisSub: "تحليل استهلاك مساحة التخزين الفعلي عبر حزم النماذج المتاحة.",
    totalSize: "إجمالي مساحة النماذج",
    averageSize: "متوسط حجم طراز النموذج",
    largestModel: "النموذج الأكبر حجمًا",
    smallestModel: "النموذج الأصغر حجمًا",
    modelsCount: "النماذج المسجلة",
    noModelsData: "لا توجد نماذج مثبتة لتحليل أحجامها.",

    // Chat Panel
    selectModelToChat: "اختر نموذج للبدء بالدردشة معه",
    inputPromptPlaceholder: "اكتب رسالتك أو استفسارك هنا...",
    newChatLabel: "محادثة جديدة",
    systemPrompt: "التوجيه الأساسي للنظام (System Message)",
    modelParams: "تخصيص الخيارات والمعاملات",
    temperature: "درجة الابتكار والتوليد (Creativity)",
    topP: "مستوى انتقائية المفردات (Top-P)",
    optionsTitle: "الخيارات والمعايرة لدقة التوليد",
    unloadModelTip: "إفراغ ومسح النموذج من ذاكرة كرت الشاشة (GPU)",
    cleanHistoryTip: "مسح سجل هذه المحادثة بالكامل",

    // Updates & Settings
    configurationTitle: "لوحة التهيئة والإعدادات",
    bilingualLayoutSettings: "اللغة والمظهر البصري للمركز",
    setLanguageLabel: "لغة واجهة التحكم الموحدة",
    themePresetLabel: "قوالب ومظاهر تصميم الواجهة",
    ollamaConnectionUrl: "عنوان خادم ربط خدمة Ollama الفعلي",
    testConnectionBtn: "اختبار فاعلية الاتصال",
    saveConfigBtn: "حفظ وتثبيت التهيئة الحالية",
    saving: "جاري حفظ وتثبيت التغيرات...",
    saveSuccess: "تم حفظ وتطبيق تهيئة النظام بنجاح!",
    updateManagementTitle: "إدارة وفحص التحديثات",
    updateManagementSub: "التحقق من إصدار خدمة أولاما والنماذج المثبتة وتحديثها",
    checkForUpdatesBtn: "افحص التحديثات والترقيات بذكاء",
    noUpdateCheck: "لم يتم إجراء فحص للتحديثات بعد. انقر على الزر بالأعلى لفحص الإصدارات.",
    ollamaDaemonService: "خدمة خادم نظام أولاما (Daemon)",
    installed: "المثبت حالياً",
    latestStable: "الإصدار الأخير المستقر",
    updateAvailableText: "ثمة تحديث متوفر!",
    fullyUpToDateText: "يعمل بالنسخة الأخيرة مستقرة",
    modelPackageUpdates: "حالات التحديث لحزم النماذج",
    tableName: "اسم حزمة النموذج المثبت",
    tableDigest: "بصمة التوقيع الرقمي (SHA)",
    tableStatus: "حالة الحزمة",
    tableAction: "الإجراء الحالي",
    noLocalModelsToAnalyze: "لا يوجد نماذج محلية تم العثور عليها لتحليل تحديثها.",
    actionDone: "مكتمل ومحدث",
    
    // Manufacturer and Support Keys (Arabic)
    manufacturerTitle: "الجهة المطورة والدعم الفني المعتمد",
    developerName: "اسم الشركة المطورة",
    supervision: "إشراف المهندس",
    servicesPortal: "بوابة الخدمات والمنصة",
    hqCountry: "المقر والبلد المطور",
    mgmtEmail: "البريد الإلكتروني للإدارة",
    supportEmail: "البريد الإلكتروني للدعم الفني",
    directSupportPhone: "هاتف الدعم المباشر والصيانة",
    whatsAppContact: "الدعم المباشر عبر واتساب",
    companyName: "FIXIT.Ai",
    companySlogan: "FIXIT.Ai | حلول ذكية، مستقبل أفضل",
    engineerName: "Eng. Emad Ali (عماد علي)",
    palestineMiddleEast: "فلسطين / الشرق الأوسط",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ollama_hub_language');
      return (saved === 'ar' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ollama_hub_language', lang);
    } catch (e) {
      console.warn(e);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    // Dynamically adjust root HTML options if needed, but managing layout-level dir is safer in React shell
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
