import React, { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout.jsx';
import { useFileStore } from './stores/useFileStore.js';
import { useAuthStore } from './stores/useAuthStore.js';
import { useUIStore } from './stores/useUIStore.js';
import { useHotkeys } from './hooks/useHotkeys.js';

export default function App() {
  const { initProject, isInitialized } = useFileStore();
  const { checkAuth } = useAuthStore();
  const { theme } = useUIStore();

  // Enable global hotkeys (Ctrl+S, Shift+Alt+F, etc.) and beforeunload warning
  useHotkeys();

  // Initialize theme, guest project, and auth on mount
  useEffect(() => {
    // Sync theme class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    initProject();
    checkAuth();
  }, [theme, initProject, checkAuth]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1e1e1e] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#007acc] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-gray-400">Loading CodeCanvas...</span>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}
