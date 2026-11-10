import { create } from 'zustand';
import {
  validateNodeName,
  isAllowedFile,
  calculateProjectSize,
  countFiles,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_PROJECT_SIZE_BYTES,
  getFileDescendants,
} from '../utils/fileTree.js';
import { saveGuestProject, loadGuestProject } from '../utils/indexedDB.js';
import { apiClient } from '../api/client.js';

export const STARTER_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CodeCanvas App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <div class="badge">Live Web App</div>
    <h1>Welcome to <span>CodeCanvas</span></h1>
    <p>A web-based VS Code-style IDE for modern web development.</p>
    <div class="actions">
      <button id="counterBtn" class="btn">Clicked 0 times</button>
      <button id="changeColorBtn" class="btn secondary">Toggle Mood</button>
    </div>
    <div id="status" class="status-box">Ready. Open console to see messages.</div>
  </div>
  <script src="script.js"></script>
</body>
</html>
`;

export const STARTER_STYLE_CSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 20%, #1e293b, #0f172a);
  color: #f8fafc;
  transition: all 0.3s ease;
  padding: 20px;
}

body.dark-mood {
  background: radial-gradient(circle at 50% 20%, #1e1b4b, #09090b);
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: #007acc;
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

h1 {
  font-size: 1.85rem;
  font-weight: 700;
  margin-bottom: 10px;
}

h1 span {
  color: #38bdf8;
}

p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn {
  background: #007acc;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #0098ff;
  transform: translateY(-1px);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.status-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  font-family: monospace;
  font-size: 0.8rem;
  color: #38bdf8;
}
`;

export const STARTER_SCRIPT_JS = `console.log('CodeCanvas script initialized!');

let count = 0;
const counterBtn = document.getElementById('counterBtn');
const changeColorBtn = document.getElementById('changeColorBtn');
const statusBox = document.getElementById('status');

if (counterBtn) {
  counterBtn.addEventListener('click', () => {
    count++;
    counterBtn.textContent = \`Clicked \${count} times\`;
    console.log(\`Counter updated to: \${count}\`);
    if (statusBox) statusBox.textContent = \`Counter incremented: \${count}\`;
  });
}

if (changeColorBtn) {
  changeColorBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mood');
    const isDark = document.body.classList.contains('dark-mood');
    console.info(\`Mood changed to: \${isDark ? 'Dark Mood' : 'Default Mood'}\`);
    if (statusBox) statusBox.textContent = \`Active mood: \${isDark ? 'Dark Mood' : 'Default Mood'}\`;
  });
}
`;

export function createDefaultNodes() {
  return [
    {
      id: 'node-index-html',
      parentId: null,
      name: 'index.html',
      type: 'file',
      content: STARTER_INDEX_HTML,
    },
    {
      id: 'node-style-css',
      parentId: null,
      name: 'style.css',
      type: 'file',
      content: STARTER_STYLE_CSS,
    },
    {
      id: 'node-script-js',
      parentId: null,
      name: 'script.js',
      type: 'file',
      content: STARTER_SCRIPT_JS,
    },
  ];
}

export function createDefaultProject(name = 'CodeCanvas Demo') {
  return {
    _id: 'guest-project-1',
    name,
    version: 1,
    nodes: createDefaultNodes(),
    isGuest: true,
  };
}

export const useFileStore = create((set, get) => ({
  project: createDefaultProject(),
  isSaving: false,
  lastSavedAt: null,
  isInitialized: false,

  // Initialize guest project from IndexedDB or default
  initProject: async () => {
    try {
      const stored = await loadGuestProject();
      if (stored && stored.nodes && stored.nodes.length > 0) {
        set({ project: stored, isInitialized: true, lastSavedAt: new Date() });
      } else {
        const defaultProj = createDefaultProject();
        set({ project: defaultProj, isInitialized: true, lastSavedAt: new Date() });
        await saveGuestProject(defaultProj);
      }
    } catch (err) {
      console.error('[FileStore] Failed to initialize project:', err);
      set({ project: createDefaultProject(), isInitialized: true });
    }
  },

  setProject: (project) => {
    set({ project, lastSavedAt: new Date() });
    if (project.isGuest) {
      saveGuestProject(project);
    }
  },

  syncProject: async (updatedProject, oldVersion) => {
    if (updatedProject.isGuest) {
      saveGuestProject(updatedProject);
      return;
    }

    if (updatedProject._id && !updatedProject.isGuest) {
      try {
        set({ isSaving: true });
        const res = await apiClient(`/api/projects/${updatedProject._id}`, {
          method: 'PUT',
          body: {
            name: updatedProject.name,
            nodes: updatedProject.nodes,
            version: oldVersion,
          },
        });
        const savedProject = res.project || res;
        set((state) => ({
          project: {
            ...state.project,
            version: savedProject.version,
          },
          isSaving: false,
          lastSavedAt: new Date(),
        }));
      } catch (err) {
        set({ isSaving: false });
        if (err.status === 409) {
          alert('Save Conflict: This project has been modified in another session. Please reload to fetch latest changes.');
        } else {
          console.error('[FileStore] Cloud sync error:', err);
        }
      }
    }
  },

  getNode: (id) => {
    return get().project.nodes.find((n) => n.id === id) || null;
  },

  addNode: ({ parentId = null, name, type = 'file', content = '' }) => {
    const { project } = get();
    const existing = project.nodes;

    // Check limits
    if (type === 'file') {
      if (countFiles(existing) >= MAX_FILES) {
        throw new Error(`Project file limit reached (${MAX_FILES} files maximum).`);
      }
      if (!isAllowedFile(name)) {
        throw new Error(`Invalid file type. Allowed extensions: .html, .css, .js, .json, .md, .txt, .svg`);
      }
      const fileSize = new Blob([content]).size;
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File exceeds maximum size limit (1 MB).`);
      }
      const projectSize = calculateProjectSize(existing) + fileSize;
      if (projectSize > MAX_PROJECT_SIZE_BYTES) {
        throw new Error(`Project exceeds total size limit (5 MB).`);
      }
    }

    const val = validateNodeName(name, parentId, existing);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const newNode = {
      id: 'node-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      parentId,
      name: name.trim(),
      type,
      ...(type === 'file' ? { content } : {}),
    };

    const updatedNodes = [...existing, newNode];
    const updatedProject = {
      ...project,
      nodes: updatedNodes,
      version: project.version + 1,
    };

    set({ project: updatedProject });
    get().syncProject(updatedProject, project.version);
    return newNode;
  },

  renameNode: (id, newName) => {
    const { project } = get();
    const node = project.nodes.find((n) => n.id === id);
    if (!node) return;

    if (node.type === 'file' && !isAllowedFile(newName)) {
      throw new Error(`Invalid file type. Allowed extensions: .html, .css, .js, .json, .md, .txt, .svg`);
    }

    const val = validateNodeName(newName, node.parentId, project.nodes, id);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const updatedNodes = project.nodes.map((n) => (n.id === id ? { ...n, name: newName.trim() } : n));
    const updatedProject = {
      ...project,
      nodes: updatedNodes,
      version: project.version + 1,
    };

    set({ project: updatedProject });
    get().syncProject(updatedProject, project.version);
  },

  deleteNode: (id) => {
    const { project } = get();
    const node = project.nodes.find((n) => n.id === id);
    if (!node) return;

    // Gather node + all descendants if folder
    const idsToDelete = new Set([id]);
    if (node.type === 'folder') {
      const descendants = getFileDescendants(id, project.nodes);
      descendants.forEach((d) => idsToDelete.add(d.id));
    }

    const updatedNodes = project.nodes.filter((n) => !idsToDelete.has(n.id));
    const updatedProject = {
      ...project,
      nodes: updatedNodes,
      version: project.version + 1,
    };

    set({ project: updatedProject });
    get().syncProject(updatedProject, project.version);
    return idsToDelete;
  },

  duplicateNode: (id) => {
    const { project } = get();
    const node = project.nodes.find((n) => n.id === id);
    if (!node || node.type !== 'file') return null;

    // Determine copy name
    const ext = node.name.lastIndexOf('.') !== -1 ? node.name.slice(node.name.lastIndexOf('.')) : '';
    const base = ext ? node.name.slice(0, node.name.lastIndexOf('.')) : node.name;
    let copyName = `${base}-copy${ext}`;
    let counter = 1;
    while (project.nodes.some((n) => n.parentId === node.parentId && n.name.toLowerCase() === copyName.toLowerCase())) {
      counter++;
      copyName = `${base}-copy-${counter}${ext}`;
    }

    return get().addNode({
      parentId: node.parentId,
      name: copyName,
      type: 'file',
      content: node.content || '',
    });
  },

  moveNode: (id, targetParentId) => {
    const { project } = get();
    const node = project.nodes.find((n) => n.id === id);
    if (!node || node.parentId === targetParentId) return;

    // Cannot move a folder into itself or its descendant
    if (node.type === 'folder') {
      if (id === targetParentId) return;
      const descendants = getFileDescendants(id, project.nodes);
      if (descendants.some((d) => d.id === targetParentId)) {
        throw new Error('Cannot move a folder into its own subfolder.');
      }
    }

    // Check duplicate name in new folder
    const val = validateNodeName(node.name, targetParentId, project.nodes, id);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const updatedNodes = project.nodes.map((n) => (n.id === id ? { ...n, parentId: targetParentId } : n));
    const updatedProject = {
      ...project,
      nodes: updatedNodes,
      version: project.version + 1,
    };

    set({ project: updatedProject });
    get().syncProject(updatedProject, project.version);
  },

  updateNodeContent: (id, content) => {
    const { project } = get();
    const node = project.nodes.find((n) => n.id === id);
    if (!node || node.type !== 'file') return;

    const fileSize = new Blob([content]).size;
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      throw new Error('File exceeds maximum size limit (1 MB).');
    }

    const updatedNodes = project.nodes.map((n) => (n.id === id ? { ...n, content } : n));
    const updatedProject = {
      ...project,
      nodes: updatedNodes,
      version: project.version + 1,
    };

    set({ project: updatedProject, lastSavedAt: new Date() });
    get().syncProject(updatedProject, project.version);
  },
}));
