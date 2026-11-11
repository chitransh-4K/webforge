import { useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { useUIStore } from '../stores/useUIStore.js';
import { useFileStore } from '../stores/useFileStore.js';
import { formatCode } from '../utils/prettierFormatter.js';
import { getLanguageForFile } from '../utils/fileTree.js';

export function useHotkeys() {
  const { hasUnsavedChanges, saveActiveBuffer, activeTabId, closeTab, getBuffer, updateBuffer } = useEditorStore();
  const { toggleExplorer, toggleConsole, togglePreview, toggleChat, setStatusMessage, openModal } = useUIStore();
  const { getNode } = useFileStore();

  // 1. Warn on closing or refreshing page if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 2. Global hotkeys (captured at document level with capture: true)
  useEffect(() => {
    const handleKeyDown = async (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S -> Save active file
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        saveActiveBuffer();
        return;
      }

      // Shift + Alt + F -> Format document with Prettier
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        e.stopPropagation();
        if (activeTabId) {
          const node = getNode(activeTabId);
          if (node) {
            const current = getBuffer(activeTabId);
            const lang = getLanguageForFile(node.name);
            try {
              const formatted = await formatCode(current, lang);
              updateBuffer(activeTabId, formatted);
              setStatusMessage('Prettier: Formatted document.');
            } catch (err) {
              setStatusMessage(`Prettier: ${err.message}`);
            }
          }
        }
        return;
      }

      // Ctrl/Cmd + B -> Toggle sidebar
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        e.stopPropagation();
        toggleExplorer();
        return;
      }

      // Ctrl/Cmd + J -> Toggle console
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        e.stopPropagation();
        toggleConsole();
        return;
      }

      // Ctrl/Cmd + P or Alt + P -> Toggle Live Preview
      if ((cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'p') || (e.altKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        e.stopPropagation();
        togglePreview();
        return;
      }

      // Ctrl/Cmd + Shift + A -> Toggle AI Assistant chat
      if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        e.stopPropagation();
        toggleChat();
        return;
      }

      // Alt + W or Ctrl/Cmd + W -> Close active tab
      if ((e.altKey && e.key.toLowerCase() === 'w') || (cmdOrCtrl && e.key.toLowerCase() === 'w')) {
        if (activeTabId) {
          e.preventDefault();
          e.stopPropagation();
          closeTab(activeTabId);
          return;
        }
      }

      // F2 -> Trigger rename (if active file or node selected)
      if (e.key === 'F2') {
        if (activeTabId) {
          const node = getNode(activeTabId);
          if (node) {
            const newName = window.prompt(`Rename "${node.name}" to:`, node.name);
            if (newName && newName.trim() && newName.trim() !== node.name) {
              try {
                useFileStore.getState().renameNode(node.id, newName.trim());
                setStatusMessage(`Renamed to "${newName.trim()}"`);
              } catch (err) {
                setStatusMessage(`Rename error: ${err.message}`);
              }
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [saveActiveBuffer, activeTabId, closeTab, getNode, getBuffer, updateBuffer, toggleExplorer, toggleConsole, togglePreview, toggleChat, setStatusMessage]);
}
