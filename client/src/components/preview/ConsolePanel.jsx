import React, { useRef, useEffect, useState } from 'react';
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
  CornerDownLeft,
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
    executeCommand,
    history,
  } = useConsoleStore();
  const { jumpToFileAndLine } = useEditorStore();
  const { toggleConsole } = useUIStore();
  const scrollRef = useRef(null);

  const [inputVal, setInputVal] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const cmd = inputVal.trim();
    if (cmd === 'clear' || cmd === 'clear()') {
      clearLogs();
    } else {
      executeCommand(cmd);
    }
    setInputVal('');
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
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
      <div className="flex items-center justify-between px-3 h-8 border-b border-vscode-dark-border bg-[#1f1f1f] text-[11px] overflow-x-auto shrink-0">
        {/* Left: Title & Level Filter Pills */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 text-gray-200 font-semibold mr-2">
            <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
            <span className="uppercase tracking-wider">Terminal</span>
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
            title="Clear Console / Terminal (or type 'clear')"
            className="p-1 rounded hover:text-white hover:bg-white/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close button */}
          <button
            onClick={toggleConsole}
            title="Close Terminal Panel"
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
          const isCmd = log.level === 'info' && log.args?.[0]?.startsWith?.('>');
          const timeStr = new Date(log.timestamp).toLocaleTimeString();

          return (
            <div
              key={log.id}
              className={`flex items-start justify-between py-1 px-2.5 hover:bg-white/5 transition-colors font-mono leading-relaxed ${
                isError
                  ? 'bg-red-950/20 text-red-300'
                  : isWarn
                  ? 'bg-amber-950/20 text-amber-300'
                  : isCmd
                  ? 'bg-sky-950/20 text-sky-300 font-semibold'
                  : 'text-gray-300'
              }`}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0 pr-4">
                {/* Level icon */}
                <span className="shrink-0 mt-0.5">
                  {isError ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : isCmd ? (
                    <span className="text-sky-400 text-xs font-bold">&gt;</span>
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
            Terminal ready. Type JavaScript statements below or call console.log() to see output here.
          </div>
        )}
      </div>

      {/* Terminal Interactive Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center px-2 py-1 bg-[#121212] border-t border-vscode-dark-border gap-2 shrink-0"
      >
        <span className="text-sky-400 font-mono text-xs font-bold select-none">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Evaluate statement in live sandbox... (e.g. 2 + 2, document.title, console.log(window))"
          className="flex-1 bg-transparent text-xs text-white outline-none font-mono placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          title="Run statement (Enter)"
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#007acc]/20 hover:bg-[#007acc]/40 text-sky-300 text-[11px] font-medium border border-sky-500/30 transition disabled:opacity-30 disabled:pointer-events-none"
        >
          <span>Run</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
