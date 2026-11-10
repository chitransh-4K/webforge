import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useFileStore } from '../../stores/useFileStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { formatCode } from '../../utils/prettierFormatter.js';
import { getLanguageForFile } from '../../utils/fileTree.js';
import {
  FileCode,
  FileSpreadsheet,
  FileText,
  X,
  Code2,
  FileJson,
  Sparkles,
} from 'lucide-react';

export function getFileIcon(filename) {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.html':
      return <FileCode className="w-4 h-4 text-orange-500 shrink-0" />;
    case '.css':
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    case '.js':
      return <Code2 className="w-4 h-4 text-yellow-400 shrink-0" />;
    case '.json':
      return <FileJson className="w-4 h-4 text-amber-300 shrink-0" />;
    case '.md':
      return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    case '.svg':
      return <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

export function EditorTabs() {
  const { openTabs, activeTabId, openTab, closeTab, isDirty, getBuffer, updateBuffer } = useEditorStore();
  const { getNode } = useFileStore();
  const { setStatusMessage } = useUIStore();

  const handleFormat = async () => {
    if (!activeTabId) return;
    const node = getNode(activeTabId);
    if (!node) return;
    const currentCode = getBuffer(activeTabId);
    const lang = getLanguageForFile(node.name);
    try {
      const formatted = await formatCode(currentCode, lang);
      updateBuffer(activeTabId, formatted);
      setStatusMessage('Prettier: Formatted document.');
    } catch (err) {
      setStatusMessage(`Prettier format error: ${err.message}`);
    }
  };

  return (
    <div className="flex items-center justify-between h-9 bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar border-b border-vscode-dark-border dark:border-vscode-dark-border light:border-vscode-light-border overflow-x-auto select-none no-scrollbar">
      {/* Tab List */}
      <div className="flex h-full items-center">
        {openTabs.map((tabId) => {
          const node = getNode(tabId);
          if (!node) return null;
          const isActive = activeTabId === tabId;
          const dirty = isDirty(tabId);

          return (
            <div
              key={tabId}
              onClick={() => openTab(tabId)}
              className={`group relative flex items-center h-full px-3.5 border-r border-vscode-dark-border dark:border-vscode-dark-border light:border-vscode-light-border cursor-pointer text-xs font-mono transition-colors ${
                isActive
                  ? 'bg-vscode-dark-bg dark:bg-vscode-dark-bg light:bg-vscode-light-bg text-white dark:text-white light:text-black border-t-2 border-t-[#007acc]'
                  : 'bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar text-gray-400 dark:text-gray-400 light:text-gray-600 hover:bg-[#2a2d2e] dark:hover:bg-[#2a2d2e] light:hover:bg-[#e8e8e8]'
              }`}
            >
              <div className="flex items-center gap-1.5 mr-2">
                {getFileIcon(node.name)}
                <span className={dirty ? 'italic' : ''}>{node.name}</span>
              </div>

              {/* Dirty indicator or close button */}
              <div
                className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tabId);
                }}
              >
                {dirty ? (
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-white light:bg-black group-hover:hidden" />
                ) : null}
                <X className={`w-3.5 h-3.5 ${dirty ? 'hidden group-hover:block' : 'opacity-60 group-hover:opacity-100'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Tab Actions */}
      <div className="flex items-center pr-2 gap-1">
        {activeTabId && (
          <button
            onClick={handleFormat}
            title="Format Document (Shift+Alt+F)"
            className="p-1 rounded text-gray-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10 text-xs flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-mono text-[11px]">Format</span>
          </button>
        )}
      </div>
    </div>
  );
}
