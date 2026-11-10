import { create } from 'zustand';

export const useConsoleStore = create((set, get) => ({
  logs: [],
  filterLevel: 'all', // 'all' | 'log' | 'warn' | 'error'
  searchQuery: '',

  addLog: (log) => {
    set((state) => ({
      logs: [...state.logs.slice(-499), log], // keep last 500 logs
    }));
  },

  clearLogs: () => set({ logs: [] }),

  setFilterLevel: (filterLevel) => set({ filterLevel }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getFilteredLogs: () => {
    const { logs, filterLevel, searchQuery } = get();
    return logs.filter((log) => {
      // Level check
      if (filterLevel === 'log' && log.level !== 'log' && log.level !== 'info' && log.level !== 'debug') return false;
      if (filterLevel === 'warn' && log.level !== 'warn') return false;
      if (filterLevel === 'error' && log.level !== 'error') return false;

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentStr = log.args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ').toLowerCase();
        return contentStr.includes(q) || (log.file && log.file.toLowerCase().includes(q));
      }

      return true;
    });
  },

  getCounts: () => {
    const { logs } = get();
    let logsCount = 0;
    let warnsCount = 0;
    let errorsCount = 0;
    for (const l of logs) {
      if (l.level === 'warn') warnsCount++;
      else if (l.level === 'error') errorsCount++;
      else logsCount++;
    }
    return { all: logs.length, logs: logsCount, warns: warnsCount, errors: errorsCount };
  },
}));
