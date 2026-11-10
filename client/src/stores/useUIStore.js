import { create } from 'zustand';

function getInitialTheme() {
  const saved = localStorage.getItem('webforge_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function getStoredBool(key, defaultValue) {
  const val = localStorage.getItem(key);
  return val !== null ? val === 'true' : defaultValue;
}

export const useUIStore = create((set, get) => ({
  theme: getInitialTheme(),
  isExplorerOpen: getStoredBool('webforge_panel_explorer', true),
  isPreviewOpen: getStoredBool('webforge_panel_preview', true),
  isChatOpen: getStoredBool('webforge_panel_chat', false),
  isConsoleOpen: getStoredBool('webforge_panel_console', true),
  mobileView: 'editor', // 'editor' | 'preview' | 'chat'
  setMobileView: (view) => set({ mobileView: view }),
  
  // Modals & popups
  activeModal: null, // 'auth' | 'projectSwitcher' | 'shortcuts' | 'diff' | 'confirm' | 'importGuest'
  modalData: null,
  
  // Status bar info
  statusMessage: '',
  setStatusMessage: (msg, timeout = 4000) => {
    set({ statusMessage: msg });
    if (timeout) {
      setTimeout(() => {
        if (get().statusMessage === msg) set({ statusMessage: '' });
      }, timeout);
    }
  },

  setTheme: (theme) => {
    localStorage.setItem('webforge_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  toggleExplorer: () =>
    set((state) => {
      const next = !state.isExplorerOpen;
      localStorage.setItem('webforge_panel_explorer', String(next));
      return { isExplorerOpen: next };
    }),

  togglePreview: () =>
    set((state) => {
      const next = !state.isPreviewOpen;
      localStorage.setItem('webforge_panel_preview', String(next));
      return { isPreviewOpen: next };
    }),

  toggleChat: () =>
    set((state) => {
      const next = !state.isChatOpen;
      localStorage.setItem('webforge_panel_chat', String(next));
      return { isChatOpen: next };
    }),

  toggleConsole: () =>
    set((state) => {
      const next = !state.isConsoleOpen;
      localStorage.setItem('webforge_panel_console', String(next));
      return { isConsoleOpen: next };
    }),

  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
