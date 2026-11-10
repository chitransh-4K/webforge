import React, { useRef, useEffect } from 'react';
import { useConsoleStore } from '../../stores/useConsoleStore.js';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import {
  Terminal,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';

export function ConsolePanel() {
  const {
    filterLevel,
    setFilterLevel,
    searchQuery,
    setSearchQuery,
    clearLogs,
    getFilteredLogs,
    getCounts,
  } = useConsoleStore();
  const { jumpToFileAndLine } = useEditorStore();
  const { toggleConsole } = useUIStore();
  const scrollRef = useRef(null);

  const filteredLogs = getFilteredLogs();
  const counts = getCounts();

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs.length]);

  const handleJump = (log) => {
    if (log.file || log.line) {
      jumpToFileAndLine(log.file || 'index.html', log.line || 1);
    }
  };

  const renderArgs = (args) => {
    return args.map((arg, idx) => {
      if (typeof arg === 'object' && arg !== null) {
        return (
          <span key={idx} className="mr-2 text-sky-300">
            {JSON.stringify(arg, null, 2)}
          </span>
        );
      }
      return (
        <span key={idx} className="mr-2">
          {String(arg)}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#181818] text-gray-300 select-none font-mono text-xs">
      {/* Console Header */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-vscode-dark-border bg-[#1f1f1f] text-[11px]">
        {/* Left: Title & Level Filter Pills */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 text-gray-200 font-semibold mr-2">
            <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
            <span className="uppercase tracking-wider">Console</span>
          </div>

          {/* Level Filter Buttons */}
          <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/5">
            <button
              onClick={() => setFilterLevel('all')}
              className={`px-2 py-0.5 rounded transition ${
                filterLevel === 'all' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setFilterLevel('log')}
              className={`px-2 py-0.5 rounded transition ${
                filterLevel === 'log' ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Logs ({counts.logs})
            </button>
            <button
              onClick={() => setFilterLevel('warn')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                filterLevel === 'warn' ? 'bg-amber-600 text-white' : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{counts.warns}</span>
            </button>
            <button
              onClick={() => setFilterLevel('error')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
                filterLevel === 'error' ? 'bg-red-600 text-white' : 'text-red-400/80 hover:text-red-300'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>{counts.errors}</span>
            </button>
          </div>
        </div>

        {/* Right: Search, Clear & Close */}
        <div className="flex items-center space-x-2 text-gray-400">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 absolute left-1.5 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/30 border border-vscode-dark-border rounded pl-6 pr-2 py-0.5 text-[11px] text-white outline-none focus:border-[#007acc] w-24 sm:w-36"
            />
          </div>

          {/* Clear button */}
          <button
            onClick={clearLogs}
            title="Clear Console"
            className="p-1 rounded hover:text-white hover:bg-white/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close button */}
          <button
            onClick={toggleConsole}
            title="Close Console Panel"
            className="p-1 rounded hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto divide-y divide-white/5 p-1 select-text">
        {filteredLogs.map((log) => {
          const isWarn = log.level === 'warn';
          const isError = log.level === 'error';
          const timeStr = new Date(log.timestamp).toLocaleTimeString();

          return (
            <div
              key={log.id}
              className={`flex items-start justify-between py-1 px-2.5 hover:bg-white/5 transition-colors font-mono leading-relaxed ${
                isError ? 'bg-red-950/20 text-red-300' : isWarn ? 'bg-amber-950/20 text-amber-300' : 'text-gray-300'
              }`}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0 pr-4">
                {/* Level icon */}
                <span className="shrink-0 mt-0.5">
                  {isError ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                  )}
                </span>

                {/* Log arguments / message */}
                <div className="break-all whitespace-pre-wrap flex-1">
                  {renderArgs(log.args)}
                  {log.stack && isError && (
                    <pre className="mt-1 text-[10px] text-red-400/80 font-mono overflow-x-auto whitespace-pre-wrap">
                      {log.stack}
                    </pre>
                  )}
                </div>
              </div>

              {/* Timestamp & Location jump */}
              <div className="flex items-center gap-2 shrink-0 text-[10px] text-gray-500">
                {(log.file || log.line) && (
                  <button
                    onClick={() => handleJump(log)}
                    title="Jump to source in editor"
                    className="flex items-center gap-1 text-sky-400 hover:underline hover:text-sky-300"
                  >
                    <span>{log.file ? log.file.split('/').pop() : 'index.html'}{log.line ? `:${log.line}` : ''}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                <span>{timeStr}</span>
              </div>
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-600 text-xs py-8">
            No console output yet. Run your code or call console.log() to see output here.
          </div>
        )}
      </div>
    </div>
  );
}
