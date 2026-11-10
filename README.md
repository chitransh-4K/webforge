# CodeCanvas

A modern, web-based, VS Code-style IDE for HTML, CSS, and JavaScript with live preview and an integrated AI coding assistant powered by **Gemini**.

---

## 🚀 Features

- **VS Code-style Interface:** Activity bar, nested file explorer, editor tabs with unsaved indicator, status bar, and resizable split panels.
- **Monaco Code Editor:** Full syntax highlighting for HTML, CSS, JS, JSON, Markdown with Emmet support and Prettier formatting (`Shift + Alt + F`).
- **Sandboxed Live Preview:** `<iframe sandbox="allow-scripts">` preview with debounced live reload (~500 ms), module import map injection, relative path rewriting, and console forwarding via `postMessage`. Full-screen in-tab preview with asset inlining.
- **Embedded Console Panel:** Captures `console.log`, `info`, `warn`, `error`, unhandled promise rejections, and line numbers with jump-to-source.
- **File Management:** Nested directories, file/folder creation, rename (`F2`), deletion, duplication, drag-and-drop moving, ZIP project import, and ZIP export.
- **Authentication & Cloud Storage:** Email + password authentication with secure, httpOnly JWT cookies, CSRF protection, and versioned cloud project persistence with conflict detection (HTTP 409).
- **Guest Mode:** Works out of the box with zero login required; projects are persisted locally in browser IndexedDB.
- **AI Coding Assistant (Gemini):**
  - Project-aware code generation and review.
  - Generates interactive `propose_create` and `propose_edit` cards with side-by-side Monaco diff inspection.
  - Non-destructive: changes only apply when accepted, becoming undoable editor buffers.
  - **Strict Scope Enforcement:** strictly responds with `"I can only help with the code in this project."` for any out-of-scope, general knowledge questions, or prompt injection attempts.
  - Real-time token streaming via Server-Sent Events (SSE).

---

## 🛠️ Tech Stack

- **Client:** React 18, Vite, Tailwind CSS, Zustand, `@monaco-editor/react`, `react-resizable-panels`, `jszip`, `idb-keyval`, Prettier (standalone), Lucide React.
- **Server:** Node.js, Express, Mongoose (with automatic in-memory fallback), Zod, bcryptjs, jsonwebtoken, Helmet, CORS, express-rate-limit, cookie-parser.
- **AI:** Google Gemini (`gemini-3.5-flash`), called strictly from the server.

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
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI= # Leave empty to use automatic built-in in-memory database
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

#### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
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

Visit **http://localhost:5173** in your browser.

---

## 🚢 Production Deployment

### 1. MongoDB Database
- Create a free database on [MongoDB Atlas](https://www.mongodb.com/atlas/database) and copy your connection string.

### 2. Backend (Render / Railway / Fly.io)
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node src/server.js`
- Set Environment Variables:
  - `NODE_ENV=production`
  - `MONGODB_URI=your_atlas_connection_string`
  - `JWT_SECRET=your_production_secret`
  - `CLIENT_ORIGIN=https://your-frontend-domain.vercel.app`
  - `GEMINI_API_KEY=your_gemini_api_key`
  - `GEMINI_MODEL=gemini-3.5-flash`

### 3. Frontend (Vercel / Netlify)
- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Set Environment Variable:
  - `VITE_API_URL=https://your-backend-service.onrender.com`
