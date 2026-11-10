import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useUIStore } from '../../stores/useUIStore.js';
import { useFileStore } from '../../stores/useFileStore.js';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { getLanguageForFile } from '../../utils/fileTree.js';
import { X, Check, Ban, GitCompare } from 'lucide-react';

export function MonacoDiffModal() {
  const { modalData, closeModal, theme, setStatusMessage } = useUIStore();
  const { getNode, addNode } = useFileStore();
  const { updateBuffer, openTab, getBuffer } = useEditorStore();

  // modalData: { proposal, onAccept, onReject }
  if (!modalData || !modalData.proposal) return null;
  const { proposal, onAccept, onReject } = modalData;

  const originalContent = proposal.originalContent || '';
  const proposedContent = proposal.content || '';
  const language = getLanguageForFile(proposal.path);

  const handleAccept = () => {
    if (onAccept) onAccept(proposal.id);
    closeModal();
  };

  const handleReject = () => {
    if (onReject) onReject(proposal.id);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-[#1e1e1e] border border-vscode-dark-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-vscode-dark-border bg-[#252526]">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <GitCompare className="w-4 h-4 text-sky-400" />
            <span>Diff Review: <code className="text-sky-300 font-mono text-xs">{proposal.path}</code></span>
            <span className="text-xs text-gray-400">({proposal.type === 'create' ? 'New File' : 'Edit'})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-red-900/60 text-gray-300 hover:text-red-200 text-xs transition"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept & Apply</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Diff summary banner */}
        {proposal.summary && (
          <div className="px-5 py-2 bg-black/30 border-b border-vscode-dark-border/40 text-xs text-gray-300">
            <span className="font-semibold text-gray-400">Summary: </span>
            {proposal.summary}
          </div>
        )}

        {/* Diff Editor */}
        <div className="flex-1 w-full overflow-hidden">
          <DiffEditor
            height="100%"
            width="100%"
            language={language}
            theme={theme === 'dark' ? 'vscode-dark-plus' : 'vscode-light-plus'}
            original={originalContent}
            modified={proposedContent}
            options={{
              readOnly: true,
              renderSideBySide: true,
              fontSize: 13,
              fontFamily: "'JetBrains Mono', Consolas, monospace",
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
