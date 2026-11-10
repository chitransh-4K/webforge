import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useFileStore } from '../../stores/useFileStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { getLanguageForFile } from '../../utils/fileTree.js';
import { formatCode } from '../../utils/prettierFormatter.js';
import {
  CheckCheck,
  Save,
  Sparkles,
  Cloud,
  HardDrive,
  Eye,
  Bot,
  Terminal,
} from 'lucide-react';

export function StatusBar() {
  const { cursorPosition, activeTabId, getBuffer, updateBuffer, isDirty, saveActiveBuffer } = useEditorStore();
  const { project, getNode } = useFileStore();
  const {
    statusMessage,
    setStatusMessage,
    isPreviewOpen,
    togglePreview,
    isChatOpen,
    toggleChat,
    isConsoleOpen,
    toggleConsole,
  } = useUIStore();

  const activeNode = activeTabId ? getNode(activeTabId) : null;
  const language = activeNode ? getLanguageForFile(activeNode.name) : 'Plain Text';
  const hasDirty = activeTabId ? isDirty(activeTabId) : false;

  const handlePrettierClick = async () => {
    if (!activeTabId || !activeNode) return;
    const currentCode = getBuffer(activeTabId);
    const lang = getLanguageForFile(activeNode.name);
    try {
      const formatted = await formatCode(currentCode, lang);
      updateBuffer(activeTabId, formatted);
      setStatusMessage('Prettier: Formatted document.');
    } catch (err) {
      setStatusMessage(`Prettier: ${err.message}`);
    }
  };

  return (
    <footer className="h-6 w-full bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-mono select-none z-20 shrink-0">
      {/* Left side: Project and save status */}
      <div className="flex items-center space-x-3">
        {/* Project info */}
        <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100">
          {project.isGuest ? (
            <span title="Guest mode - saved in browser IndexedDB" className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>{project.name} (Guest)</span>
            </span>
          ) : (
            <span title="Cloud project synced with MongoDB" className="flex items-center gap-1">
              <Cloud className="w-3 h-3 text-sky-200" />
              <span>{project.name}</span>
            </span>
          )}
        </div>

        {/* Save button / dirty indicator */}
        {hasDirty ? (
          <button
            onClick={saveActiveBuffer}
            title="Unsaved changes - click to save (Ctrl+S)"
            className="flex items-center gap-1 bg-amber-500/80 hover:bg-amber-500 px-1.5 py-0.5 rounded text-white font-semibold transition"
          >
            <Save className="w-3 h-3" />
            <span>Unsaved (Save)</span>
          </button>
        ) : (
          <span className="flex items-center gap-1 opacity-75">
            <CheckCheck className="w-3 h-3 text-emerald-300" />
            <span>Saved</span>
          </span>
        )}

        {/* Live status message toast */}
        {statusMessage && (
          <span className="bg-black/30 px-2 py-0.5 rounded text-white animate-fade-in truncate max-w-xs sm:max-w-md">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Right side: Editor stats and panel shortcuts */}
      <div className="flex items-center space-x-3">
        {activeNode && (
          <>
            {/* Ln / Col */}
            <span title="Cursor position">
              Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}
            </span>

            {/* Spaces */}
            <span title="Tab size" className="hidden sm:inline">
              Spaces: 2
            </span>

            {/* Encoding */}
            <span title="File encoding" className="hidden sm:inline">
              UTF-8
            </span>

            {/* Prettier button */}
            <button
              onClick={handlePrettierClick}
              title="Prettier Formatter (Shift+Alt+F)"
              className="flex items-center gap-1 hover:underline hover:text-sky-200"
            >
              <Sparkles className="w-3 h-3" />
              <span>Prettier</span>
            </button>

            {/* Language */}
            <span className="font-semibold capitalize">
              {language}
            </span>
          </>
        )}

        {/* Quick layout icon toggles */}
        <div className="flex items-center gap-1 border-l border-white/20 pl-2">
          <button
            onClick={toggleConsole}
            title="Toggle Console"
            className={`p-0.5 rounded hover:bg-white/20 ${isConsoleOpen ? 'text-white' : 'opacity-60'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePreview}
            title="Toggle Live Preview"
            className={`p-0.5 rounded hover:bg-white/20 ${isPreviewOpen ? 'text-white' : 'opacity-60'}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleChat}
            title="Toggle AI Chat"
            className={`p-0.5 rounded hover:bg-white/20 ${isChatOpen ? 'text-white' : 'opacity-60'}`}
          >
            <Bot className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
