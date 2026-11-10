import { create } from 'zustand';
import { useFileStore } from './useFileStore.js';
import { useUIStore } from './useUIStore.js';
import { findNodeByPath } from '../utils/fileTree.js';

export const useEditorStore = create((set, get) => ({
  openTabs: ['node-index-html'], // Start with index.html open
  activeTabId: 'node-index-html',
  buffers: {}, // { [nodeId]: string }
  cursorPosition: { lineNumber: 1, column: 1 },
  monacoEditorRef: null,
  pendingJump: null, // { fileId, lineNumber }

  setMonacoEditorRef: (editor) => set({ monacoEditorRef: editor }),

  setCursorPosition: (pos) => set({ cursorPosition: pos }),

  getBuffer: (nodeId) => {
    const buffers = get().buffers;
    if (buffers[nodeId] !== undefined) {
      return buffers[nodeId];
    }
    const node = useFileStore.getState().getNode(nodeId);
    return node?.content || '';
  },

  updateBuffer: (nodeId, content) => {
    set((state) => ({
      buffers: {
        ...state.buffers,
        [nodeId]: content,
      },
    }));
  },

  isDirty: (nodeId) => {
    const buffers = get().buffers;
    if (buffers[nodeId] === undefined) return false;
    const node = useFileStore.getState().getNode(nodeId);
    return buffers[nodeId] !== (node?.content || '');
  },

  hasUnsavedChanges: () => {
    const { buffers, openTabs } = get();
    const fileStore = useFileStore.getState();
    for (const tabId of openTabs) {
      if (buffers[tabId] !== undefined) {
        const node = fileStore.getNode(tabId);
        if (buffers[tabId] !== (node?.content || '')) {
          return true;
        }
      }
    }
    return false;
  },

  openTab: (nodeId) => {
    const { openTabs } = get();
    const node = useFileStore.getState().getNode(nodeId);
    if (!node || node.type !== 'file') return;

    if (!openTabs.includes(nodeId)) {
      set({ openTabs: [...openTabs, nodeId], activeTabId: nodeId });
    } else {
      set({ activeTabId: nodeId });
    }
  },

  closeTab: (nodeId, force = false) => {
    const { openTabs, activeTabId, isDirty } = get();
    if (!force && isDirty(nodeId)) {
      const node = useFileStore.getState().getNode(nodeId);
      const confirmClose = window.confirm(`"${node?.name || 'File'}" has unsaved changes. Do you want to close it and discard changes?`);
      if (!confirmClose) return false;
    }

    const nextTabs = openTabs.filter((id) => id !== nodeId);
    let nextActive = activeTabId;

    if (activeTabId === nodeId) {
      if (nextTabs.length > 0) {
        const closedIdx = openTabs.indexOf(nodeId);
        const newIdx = Math.min(closedIdx, nextTabs.length - 1);
        nextActive = nextTabs[newIdx];
      } else {
        nextActive = null;
      }
    }

    // Clean buffer on close
    const nextBuffers = { ...get().buffers };
    delete nextBuffers[nodeId];

    set({ openTabs: nextTabs, activeTabId: nextActive, buffers: nextBuffers });
    return true;
  },

  closeAllTabs: (force = false) => {
    const { openTabs, isDirty } = get();
    for (const id of openTabs) {
      if (!force && isDirty(id)) {
        const confirmed = window.confirm('You have unsaved files. Discard changes and close all tabs?');
        if (!confirmed) return false;
        break;
      }
    }
    set({ openTabs: [], activeTabId: null, buffers: {} });
    return true;
  },

  saveActiveBuffer: () => {
    const { activeTabId, buffers } = get();
    if (!activeTabId) return;

    const bufferContent = buffers[activeTabId];
    if (bufferContent !== undefined) {
      try {
        useFileStore.getState().updateNodeContent(activeTabId, bufferContent);
        // Clear dirty buffer state
        const nextBuffers = { ...buffers };
        delete nextBuffers[activeTabId];
        set({ buffers: nextBuffers });
        useUIStore.getState().setStatusMessage('File saved.');
      } catch (err) {
        useUIStore.getState().setStatusMessage(`Save failed: ${err.message}`);
      }
    }
  },

  saveAllBuffers: () => {
    const { buffers } = get();
    const fileStore = useFileStore.getState();
    try {
      for (const [nodeId, content] of Object.entries(buffers)) {
        fileStore.updateNodeContent(nodeId, content);
      }
      set({ buffers: {} });
      useUIStore.getState().setStatusMessage('All files saved.');
    } catch (err) {
      useUIStore.getState().setStatusMessage(`Save all failed: ${err.message}`);
    }
  },

  jumpToFileAndLine: (filePathOrId, lineNumber = 1) => {
    let targetNode = null;
    const fileStore = useFileStore.getState();

    // Check if target is an ID
    targetNode = fileStore.getNode(filePathOrId);
    if (!targetNode) {
      // Find by path
      targetNode = findNodeByPath(filePathOrId, fileStore.project.nodes);
    }

    if (!targetNode || targetNode.type !== 'file') {
      console.warn('[Jump] Target file not found:', filePathOrId);
      return;
    }

    get().openTab(targetNode.id);
    set({ pendingJump: { fileId: targetNode.id, lineNumber } });

    // If editor is already loaded, jump immediately
    const editor = get().monacoEditorRef;
    if (editor && get().activeTabId === targetNode.id) {
      editor.revealLineInCenter(lineNumber);
      editor.setPosition({ lineNumber, column: 1 });
      editor.focus();
      set({ pendingJump: null });
    }
  },
}));
