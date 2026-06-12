# 🎛️ Ollama Host Monitor & Inference Control Center
### مركز التحكم والتحليل الذكي لاستضافة نماذج أولاما (Ollama) المحلية

Bilingual, real-time developer metrics dashboard, model storage analyzer, live performance benchmarking tool, and unified chat interface.

دليل باللغتين العربية والإنجليزية لتثبيت النظام، تشغيله، ورفعه على منصة **GitHub**.
for try onlineL:
https://ollama-hub-control-center-103739279204.europe-west2.run.app/
---


## 📖 جدول المحتويات (Table of Contents)
- [المميزات الرئيسية / Key Features](#-المميزات-الرئيسية--key-features)
- [المتطلبات الأساسية / Prerequisites](#-المتطلبات-الأساسية--prerequisites)
- [التثبيت والتشغيل المحلي / Local Installation](#-التثبيت-والتشغيل-المحلي--local-installation)
- [بناء النظام للإنتاج / Production Build](#-بناء-النظام-للإنتاج--production-build)
- [النشر على GitHub / Publishing to GitHub](#-النشر-على-github--publishing-to-github)
- [بنية المشروع / Project Structure](#-بنية-المشروع--project-structure)

---

## ✨ المميزات الرئيسية / Key Features

### 🇸🇦 🇬🇧 Bilingual & RTL Support (عربي / English)
- دعم كامل ومتكامل لتوطين الواجهة ديناميكياً مع توافق تام لاتصال اتجاه النصوص (LTR/RTL) والمظاهر الجمالية لبيئات التطوير.

### 📊 System Resource & Storage Analyzer (مؤشرات النظام ومساحات النماذج)
- **Live Metrics**: Real-time tracking of CPU usage, memory occupancy, package temperature, mainboard status, and network throughput (I/O stats).
- **Model Storage Distribution Chart (Recharts)**: High-fidelity graphical bar chart indicating exact disk footprint distribution in Gigabytes (GB) across the local model library.
- **VRAM Control**: Track and unload models currently residing in GPU/VRAM to free up system memory instantly.

### ⚡ Smart Inference Benchmark Tool (تقرير واختبار قياس الأداء)
- Run isolated performance evaluations against installed LLMs dynamically.
- Display exact generation metrics: **Evaluation Duration**, **Token Counts**, and raw speed calculated in **Tokens per Second (t/s)**.

### 💬 Unified AI Chat Suite (الدردشة الاستدلالية المباشرة)
- Clean, customizable interactive chat pane targeting any locally running model.
- Responsive prompts, shortcuts (`Shift+Enter` for formatting, `Alt+N` for instant session refresh), and persistent history.

---

## ⚙️ المتطلبات الأساسية / Prerequisites

Before getting started, make sure you have:
1. **Node.js** (v18.x or above recommended)
2. **Ollama local instance** running (usually listens on port `11434`):
   - For macOS/Linux/Windows: [Install Ollama](https://ollama.com)
   - Confirm it is running by typing `ollama list` in your terminal.

---

## 🚀 التثبيت والتشغيل المحلي / Local Installation

Follow these quick commands to set up the project locally.

### 1. الاستنساخ والدخول للمجلد (Clone and Navigate)
```bash
# If cloned via Git:
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. تثبيت الحزم والمكتبات المعتمدة (Install Dependencies)
```bash
npm install
```

### 3. إعداد متغيرات البيئة (Setup Environment Variables)
Create a `.env` file in the root of the project to map your backend environment if needed, or configure the default connection endpoint directly inside the Settings Panel.

Our Express proxy reads the system port automatically (Runs default host proxy redirection target on `http://127.0.0.1:11434`).

### 4. تشغيل خادم التطوير (Run Development Server)
```bash
npm run dev
```

Your terminal will spin up the Express custom server on port `3000` (bridged securely to host ingress).
- Open: **`http://localhost:3000`** in your browser.

---

## 📦 بناء النظام للإنتاج / Production Build

Our system utilizes a fully isolated full-stack setup:
- Client-side bundles compiled under **Vite**.
- Server-side TypeScript (`server.ts`) compiled safely into a unified **CommonJS (`dist/server.cjs`)** bundle through `esbuild` to bypass relative import constraints.

To build and start in production:

```bash
# Compile and build both build states safely
npm run build

# Start the optimized Node custom server
npm run start
```

---

## 🐙 النشر على GitHub / Publishing to GitHub

To store and manage your source code in a GitHub repository, execute the following commands in order from your workspace terminal:

### 1. تهيئة مستودع جيت (Initialize Git Repository)
```bash
# Initialize local repo
git init

# Track all project source files (excluding node_modules / dist / auto-generated logs in .gitignore)
git add .

# Save snapshot locally
git commit -m "feat: init Ollama Monitor Dashboard with RTL & Recharts Distribution Chart"
```

### 2. إنشاء مستودع جديد على GitHub (Create a Blank GitHub Repo)
- Open GitHub and sign in to your dashboard.
- Click **New** button under "Repositories".
- Enter a repository name (e.g., `ollama-monitor-dashboard`).
- Leave it **Public** or **Private**, and **Do not select** "Add a README", "Add .gitignore", or "Choose a license" (as they are already fully structured in this workspace).
- Click **Create repository**.

### 3. ربط ودفع الشيفرة البرمجية (Link Remote and Push)
Copy the remote repository commands from your GitHub page, replacing the URL below with your actual credentials:

```bash
# Set main branch as default
git branch -M main

# Link your local repo to GitHub origin
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# Push the committed code securely
git push -u origin main
```

---

## 📂 بنية المشروع / Project Structure

```text
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatPanel.tsx         # Unified local AI chat pane
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx         # Real-time dashboard with hardware widgets
│   │   ├── logs/
│   │   │   └── LogsTerminal.tsx      # Embedded log telemetry widget
│   │   └── models/
│   │       └── ModelList.tsx         # Model Library list, Performance Benchmarks,
│   │                                 # and Recharts storage footprint analyzer
│   ├── lib/
│   │   ├── LanguageContext.tsx       # Localization configuration & i18n mapping
│   │   └── utils.ts                  # Classes merging helpers (cn)
│   ├── App.tsx                       # App shell/layouts router
│   ├── main.tsx                      # Vite setup
│   └── types.ts                      # Common TypeScript interfaces
├── server.ts                         # Custom secure Express server & API routes
├── vite.config.ts                    # Build config
├── package.json                      # Dependency registry
└── README.md                         # Project documentation
```

---

Developed for optimal performance and real-time monitoring. Let your local intelligence run elegantly! 🚀

---

## 🏢 تطوير وإشراف الدعم الفني المعياري (Developer & Support Entity)

**FIXIT.Ai** — *حلول ذكية، مستقبل أفضل*

- **إشراف المهندس / Under Supervision of:** المهندس عماد علي (Eng. Emad Ali)
- **بوابة الخدمات والمنصة / Services Portal:** [https://www.facebook.com/fixit.ai.co](https://www.facebook.com/fixit.ai.co)
- **المقر والدولة والموقع / Headquarters:** فلسطين / الشرق الأوسط (Palestine / Middle East)
- **بريد الإدارة للتواصل / Administration Email:** [emad.a1993@gmail.com](mailto:emad.a1993@gmail.com)
- **البريد الإلكتروني للدعم الفني / Tech Support Email:** [fixit.ai.ps@gmail.com](mailto:fixit.ai.ps@gmail.com)
- **هاتف الدعم المباشر والصيانة / Direct Hotline:** [0569899098](tel:0569899098)
- **رابط تواصل واتس اب المباشر / WhatsApp Contact:** [🔗 +970 - 569899098](https://wa.me/970569899098)

