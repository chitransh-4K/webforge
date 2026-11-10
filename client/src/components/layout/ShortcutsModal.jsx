import React from 'react';
import { useUIStore } from '../../stores/useUIStore.js';
import { X, Keyboard } from 'lucide-react';

export function ShortcutsModal() {
  const { closeModal } = useUIStore();

  const shortcuts = [
    { group: 'Editor & Files', items: [
      { key: 'Ctrl + S / ⌘ + S', desc: 'Save current active file' },
      { key: 'Shift + Alt + F', desc: 'Format document with Prettier' },
      { key: 'F2', desc: 'Rename selected file / folder' },
      { key: 'Ctrl + W / ⌘ + W', desc: 'Close active tab' },
    ]},
    { group: 'Panels & Views', items: [
      { key: 'Ctrl + B / ⌘ + B', desc: 'Toggle File Explorer sidebar' },
      { key: 'Ctrl + J / ⌘ + J', desc: 'Toggle Console panel' },
      { key: 'Ctrl + P / ⌘ + P', desc: 'Toggle Live Preview panel' },
      { key: 'Ctrl + Shift + A', desc: 'Toggle AI Assistant chat' },
    ]},
    { group: 'Emmet & Code Intelligence', items: [
      { key: 'Tab', desc: 'Expand Emmet abbreviation (HTML/CSS)' },
      { key: 'Ctrl + Space', desc: 'Trigger autocomplete / suggestions' },
      { key: 'Alt + Click', desc: 'Add multi-cursor in editor' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#252526] text-vscode-dark-text border border-vscode-dark-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-vscode-dark-border bg-[#1f1f1f]">
          <div className="flex items-center gap-2 text-white font-medium">
            <Keyboard className="w-5 h-5 text-[#007acc]" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm font-sans">
          {shortcuts.map((cat, i) => (
            <div key={i}>
              <h3 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 font-mono">
                {cat.group}
              </h3>
              <div className="space-y-1.5">
                {cat.items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded bg-black/20 hover:bg-black/30 border border-white/5"
                  >
                    <span className="text-gray-300">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-white/10 text-xs font-mono text-gray-200 shadow-sm">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
