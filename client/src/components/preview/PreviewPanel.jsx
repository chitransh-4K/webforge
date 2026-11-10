import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFileStore } from '../../stores/useFileStore.js';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useConsoleStore } from '../../stores/useConsoleStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { buildPreviewHTML } from '../../utils/previewBuilder.js';
import {
  RotateCw,
  Trash2,
  Maximize2,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export function PreviewPanel() {
  const { project } = useFileStore();
  const { buffers } = useEditorStore();
  const { addLog, clearLogs } = useConsoleStore();
  const { togglePreview, setStatusMessage } = useUIStore();

  const [previewSrcDoc, setPreviewSrcDoc] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastBuiltAt, setLastBuiltAt] = useState(Date.now());
  const iframeRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Build preview HTML from nodes and buffers
  const refreshPreview = useCallback(() => {
    setIsRefreshing(true);
    try {
      const { html } = buildPreviewHTML(project.nodes, buffers);
      setPreviewSrcDoc(html);
      setLastBuiltAt(Date.now());
    } catch (err) {
      console.error('[Preview] Build error:', err);
      addLog({
        id: Math.random().toString(36).substring(2),
        level: 'error',
        args: [`[Preview Builder Error] ${err.message}`],
        timestamp: Date.now(),
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 200);
    }
  }, [project.nodes, buffers, addLog]);

  // Auto-refresh with ~500ms debounce when nodes or buffers change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      refreshPreview();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [project.nodes, buffers, refreshPreview]);

  // PostMessage bridge for iframe console logging
  useEffect(() => {
    const handleMessage = (event) => {
      // SECURITY REQUIREMENT:
      // "The parent must only accept messages whose event.source is the preview iframe."
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      if (event.data && event.data.type === 'WEBFORGE_CONSOLE') {
        addLog(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  // Open Full Screen preview in new tab
  const handleFullScreen = () => {
    try {
      const { html } = buildPreviewHTML(project.nodes, buffers, { inlineAll: true });
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setStatusMessage('Full screen preview opened in a new tab.');
    } catch (err) {
      setStatusMessage(`Full screen preview failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] border-l border-vscode-dark-border select-none">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3 h-9 bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar border-b border-vscode-dark-border dark:border-vscode-dark-border light:border-vscode-light-border text-xs">
        <div className="flex items-center gap-1.5 text-gray-300 dark:text-gray-300 light:text-gray-700 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold uppercase tracking-wider">Live Preview</span>
          <span className="hidden sm:inline text-gray-500 font-normal text-[10px]">
            (sandbox: allow-scripts)
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          {/* Refresh button */}
          <button
            onClick={refreshPreview}
            title="Refresh Preview"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Clear console button */}
          <button
            onClick={() => {
              clearLogs();
              setStatusMessage('Console cleared.');
            }}
            title="Clear Console"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Full Screen in new tab button */}
          <button
            onClick={handleFullScreen}
            title="Open Fullscreen in New Tab"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close preview panel */}
          <button
            onClick={togglePreview}
            title="Close Preview Panel"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sandboxed Iframe Container */}
      <div className="flex-1 w-full h-full relative bg-white">
        <iframe
          ref={iframeRef}
          title="WebForge Live Preview"
          srcDoc={previewSrcDoc}
          sandbox="allow-scripts"
          className="w-full h-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
