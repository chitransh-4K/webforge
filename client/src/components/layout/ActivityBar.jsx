import React from 'react';
import { useUIStore } from '../../stores/useUIStore.js';
import { useAuthStore } from '../../stores/useAuthStore.js';
import {
  Files,
  Eye,
  Bot,
  Terminal,
  Sun,
  Moon,
  Keyboard,
  User,
  FolderSync,
} from 'lucide-react';

export function ActivityBar() {
  const {
    theme,
    toggleTheme,
    isExplorerOpen,
    toggleExplorer,
    isPreviewOpen,
    togglePreview,
    isChatOpen,
    toggleChat,
    isConsoleOpen,
    toggleConsole,
    openModal,
  } = useUIStore();

  const { user } = useAuthStore ? useAuthStore() : { user: null };

  return (
    <div className="flex flex-col justify-between w-12 h-full bg-[#181818] dark:bg-[#181818] light:bg-[#2c2c2c] border-r border-vscode-dark-border select-none z-20 shrink-0">
      {/* Top Icons */}
      <div className="flex flex-col items-center py-2 space-y-1">
        {/* Explorer */}
        <button
          onClick={toggleExplorer}
          title="Explorer (Toggle Sidebar)"
          className={`relative p-2.5 rounded hover:text-white transition-colors ${
            isExplorerOpen ? 'text-white border-l-2 border-[#007acc]' : 'text-gray-400'
          }`}
        >
          <Files className="w-5 h-5" />
        </button>

        {/* Live Preview */}
        <button
          onClick={togglePreview}
          title="Live Preview"
          className={`relative p-2.5 rounded hover:text-white transition-colors ${
            isPreviewOpen ? 'text-white border-l-2 border-[#007acc]' : 'text-gray-400'
          }`}
        >
          <Eye className="w-5 h-5" />
        </button>

        {/* AI Assistant */}
        <button
          onClick={toggleChat}
          title="AI Assistant (Mistral)"
          className={`relative p-2.5 rounded hover:text-white transition-colors ${
            isChatOpen ? 'text-white border-l-2 border-[#007acc]' : 'text-gray-400'
          }`}
        >
          <Bot className="w-5 h-5" />
        </button>

        {/* Console */}
        <button
          onClick={toggleConsole}
          title="Console Panel"
          className={`relative p-2.5 rounded hover:text-white transition-colors ${
            isConsoleOpen ? 'text-white border-l-2 border-[#007acc]' : 'text-gray-400'
          }`}
        >
          <Terminal className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center py-2 space-y-1 border-t border-white/5">
        {/* Project Switcher */}
        <button
          onClick={() => openModal('projectSwitcher')}
          title="Switch / Manage Projects"
          className="p-2.5 text-gray-400 hover:text-white transition-colors"
        >
          <FolderSync className="w-5 h-5" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => openModal('shortcuts')}
          title="Keyboard Shortcuts"
          className="p-2.5 text-gray-400 hover:text-white transition-colors"
        >
          <Keyboard className="w-5 h-5" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          className="p-2.5 text-gray-400 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Account */}
        <button
          onClick={() => openModal('auth')}
          title={user ? `Signed in as ${user.email}` : 'Sign in / Create Account'}
          className="p-2.5 text-gray-400 hover:text-white transition-colors relative"
        >
          <User className="w-5 h-5" />
          {user && (
            <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#181818]" />
          )}
        </button>
      </div>
    </div>
  );
}
