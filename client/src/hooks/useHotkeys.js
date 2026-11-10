import { useEffect } from 'react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { useUIStore } from '../stores/useUIStore.js';
import { useFileStore } from '../stores/useFileStore.js';
import { formatCode } from '../utils/prettierFormatter.js';
import { getLanguageForFile } from '../utils/fileTree.js';

export function useHotkeys() {
  const { hasUnsavedChanges, saveActiveBuffer, activeTabId, getBuffer, updateBuffer } = useEditorStore();
  const { toggleExplorer, toggleConsole, togglePreview, toggleChat, setStatusMessage } = useUIStore();
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

  // 2. Global hotkeys
  useEffect(() => {
    const handleKeyDown = async (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S -> Save
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveActiveBuffer();
      }

      // Shift + Alt + F -> Prettier
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
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
      }

      // Ctrl + B -> Toggle sidebar
      if (cmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleExplorer();
      }

      // Ctrl + J -> Toggle console
      if (cmdOrCtrl && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleConsole();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveActiveBuffer, activeTabId, getNode, getBuffer, updateBuffer, toggleExplorer, toggleConsole, setStatusMessage]);
}
