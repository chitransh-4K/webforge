# WebForge

A modern, web-based, VS Code-style IDE for HTML, CSS, and JavaScript with live preview and an integrated AI coding assistant powered by **OpenRouter** in pure MERN stack (Node.js/Express, no Python).

- **Frontend (Vercel):** [https://webforge-seven-lyart.vercel.app](https://webforge-seven-lyart.vercel.app)
- **Backend (Render):** [https://webforge-2mx5.onrender.com](https://webforge-2mx5.onrender.com)

---

## 🚀 Features

- **VS Code-style Interface:** Activity bar, nested file explorer, editor tabs with unsaved indicator, status bar, and resizable split panels.
- **Dark Mode by Default:** Always opens in sleek dark theme by default, with instant toggle support.
- **Monaco Code Editor:** Full syntax highlighting for HTML, CSS, JS, JSON, Markdown with Emmet support and Prettier formatting (`Shift + Alt + F`).
- **Sandboxed Live Preview:** `<iframe sandbox="allow-scripts">` preview with debounced live reload (~500 ms), module import map injection, relative path rewriting, and console forwarding via `postMessage`.
- **Interactive Terminal & Console Panel:** Captures `console.log`, `info`, `warn`, `error`, unhandled promise rejections, jump-to-source, plus a real interactive command line terminal to evaluate JS expressions directly inside the sandbox with command history (`Up`/`Down` arrows).
- **Mutually Exclusive Panels:** Live Preview and AI Chat operate cleanly one at a time — opening chat automatically closes preview, and opening preview automatically closes chat.
- **File Management:** Nested directories, file/folder creation inside any subfolder, rename (`F2`), deletion, duplication, drag-and-drop moving, ZIP upload, and ZIP download.
- **Authentication & Cloud Storage:** Email + password authentication with secure, httpOnly JWT cookies, CSRF protection, and versioned cloud project persistence with conflict detection (HTTP 409).
- **Guest Mode:** Works out of the box with zero login required; projects are persisted locally in browser IndexedDB.
- **AI Coding Assistant (OpenRouter / MERN Stack):**
  - Powered by OpenRouter in pure Node.js (no Python required).
  - High token limit (8,192 tokens) and strict completion enforcement to ensure complete answers without truncated code.
  - Project-aware code generation and review.
  - Generates interactive `propose_create` and `propose_edit` cards with side-by-side Monaco diff inspection.
  - Non-destructive: changes only apply when accepted, becoming undoable editor buffers.
  - **Strict Scope Enforcement:** strictly responds with `"I can only help with the code in this project."` for any out-of-scope or prompt injection attempts.
  - Real-time token streaming via Server-Sent Events (SSE).

---

## 🛠️ Tech Stack

- **Client:** React 18, Vite, Tailwind CSS, Zustand, `@monaco-editor/react`, `react-resizable-panels`, `jszip`, `idb-keyval`, Prettier (standalone), Lucide React.
- **Server:** Node.js, Express, Mongoose (with automatic in-memory fallback), Zod, bcryptjs, jsonwebtoken, Helmet, CORS, express-rate-limit, cookie-parser.
- **AI:** OpenRouter (with Google Gemini fallback), called strictly server-side in Node.js.

---

## 🏃 Local Setup & Development

### 1. Prerequisites
- Node.js 20+ installed
- npm or yarn

### 2. Environment Variables

#### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=https://webforge-seven-lyart.vercel.app
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI= # Leave empty to use automatic built-in in-memory database
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-001
GEMINI_API_KEY=optional_gemini_fallback_key
```

#### Client (`client/.env`)
```env
VITE_API_URL=https://webforge-2mx5.onrender.com
```

### 3. Installation

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. Running Locally

```bash
# Terminal 1 - Start the backend server (http://localhost:5000)
cd server
npm run dev

# Terminal 2 - Start the frontend dev server (http://localhost:5173)
cd client
npm run dev
```

---

## 🚢 Production Deployment

- **Backend (Render):** `https://webforge-2mx5.onrender.com`
  - Environment: `CLIENT_ORIGIN=https://webforge-seven-lyart.vercel.app`, `NODE_ENV=production`
- **Frontend (Vercel):** `https://webforge-seven-lyart.vercel.app`
  - Environment: `VITE_API_URL=https://webforge-2mx5.onrender.com`
