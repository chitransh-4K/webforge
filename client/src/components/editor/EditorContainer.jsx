import React, { useRef, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useFileStore } from '../../stores/useFileStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { getLanguageForFile } from '../../utils/fileTree.js';
import { configureMonaco } from '../../utils/monacoConfig.js';
import { formatCode } from '../../utils/prettierFormatter.js';
import { useResponsive } from '../../hooks/useResponsive.js';
import { Code2, Command, Sparkles } from 'lucide-react';

export function EditorContainer() {
  const { isMobile } = useResponsive();
  const {
    activeTabId,
    getBuffer,
    updateBuffer,
    setCursorPosition,
    setMonacoEditorRef,
    pendingJump,
    saveActiveBuffer,
  } = useEditorStore();
  const { getNode } = useFileStore();
  const { theme, setStatusMessage } = useUIStore();
  const editorRef = useRef(null);
  const monaco = useMonaco();

  // Configure custom themes and Emmet
  useEffect(() => {
    if (monaco) {
      configureMonaco(monaco);
    }
  }, [monaco]);

  const activeNode = activeTabId ? getNode(activeTabId) : null;
  const activeContent = activeTabId ? getBuffer(activeTabId) : '';
  const language = activeNode ? getLanguageForFile(activeNode.name) : 'plaintext';

  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    setMonacoEditorRef(editor);

    // Track cursor movements
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Add Format Document action (Shift + Alt + F)
    editor.addAction({
      id: 'webforge-format',
      label: 'Format Document (Prettier)',
      keybindings: [
        monacoInstance.KeyMod.Shift | monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.KeyF,
      ],
      run: async () => {
        const currentActive = useEditorStore.getState().activeTabId;
        if (!currentActive) return;
        const node = useFileStore.getState().getNode(currentActive);
        if (!node) return;
        const val = editor.getValue();
        const lang = getLanguageForFile(node.name);
        try {
          const formatted = await formatCode(val, lang);
          editor.setValue(formatted);
          updateBuffer(currentActive, formatted);
          useUIStore.getState().setStatusMessage('Document formatted with Prettier.');
        } catch (err) {
          useUIStore.getState().setStatusMessage(`Format failed: ${err.message}`);
        }
      },
    });

    // Add Save action (Ctrl+S / Cmd+S)
    editor.addAction({
      id: 'webforge-save',
      label: 'Save File',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      ],
      run: () => {
        saveActiveBuffer();
      },
    });

    // Add Toggle Explorer action (Ctrl+B / Cmd+B)
    editor.addAction({
      id: 'webforge-toggle-explorer',
      label: 'Toggle File Explorer',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyB,
      ],
      run: () => {
        useUIStore.getState().toggleExplorer();
      },
    });

    // Add Toggle Preview action (Ctrl+P / Cmd+P)
    editor.addAction({
      id: 'webforge-toggle-preview',
      label: 'Toggle Live Preview',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyP,
      ],
      run: () => {
        useUIStore.getState().togglePreview();
      },
    });

    // Add Toggle Console action (Ctrl+J / Cmd+J)
    editor.addAction({
      id: 'webforge-toggle-console',
      label: 'Toggle Console Panel',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyJ,
      ],
      run: () => {
        useUIStore.getState().toggleConsole();
      },
    });

    // Add Toggle AI Chat action (Ctrl+Shift+A / Cmd+Shift+A)
    editor.addAction({
      id: 'webforge-toggle-chat',
      label: 'Toggle AI Assistant',
      keybindings: [
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyA,
      ],
      run: () => {
        useUIStore.getState().toggleChat();
      },
    });

    // Handle initial jump if present
    const jump = useEditorStore.getState().pendingJump;
    if (jump && jump.fileId === activeTabId) {
      editor.revealLineInCenter(jump.lineNumber);
      editor.setPosition({ lineNumber: jump.lineNumber, column: 1 });
      useEditorStore.setState({ pendingJump: null });
    }
  };

  // Jump to line when pendingJump updates
  useEffect(() => {
    if (pendingJump && editorRef.current && pendingJump.fileId === activeTabId) {
      editorRef.current.revealLineInCenter(pendingJump.lineNumber);
      editorRef.current.setPosition({ lineNumber: pendingJump.lineNumber, column: 1 });
      editorRef.current.focus();
      useEditorStore.setState({ pendingJump: null });
    }
  }, [pendingJump, activeTabId]);

  if (!activeNode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-vscode-dark-bg dark:bg-vscode-dark-bg light:bg-vscode-light-bg text-gray-500 select-none">
        <div className="flex flex-col items-center max-w-sm text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-vscode-dark-border">
            <Code2 className="w-8 h-8 text-[#007acc]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-300 dark:text-gray-300 light:text-gray-700">WebForge Editor</h2>
            <p className="text-xs text-gray-500 mt-1">Select a file from the explorer on the left or create a new file to start coding.</p>
          </div>
          <div className="w-full bg-white/5 rounded-lg p-3 text-xs font-mono space-y-1.5 border border-vscode-dark-border/50 text-left">
            <div className="flex justify-between items-center text-gray-400">
              <span>Save file</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-300">Ctrl+S</kbd>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Format document</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-300">Shift+Alt+F</kbd>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Rename file</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-gray-300">F2</kbd>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden bg-vscode-dark-bg dark:bg-vscode-dark-bg light:bg-vscode-light-bg">
      <Editor
        key={activeTabId}
        height="100%"
        width="100%"
        language={language}
        theme={theme === 'dark' ? 'vscode-dark-plus' : 'vscode-light-plus'}
        value={activeContent}
        onChange={(val) => {
          if (activeTabId && val !== undefined) {
            updateBuffer(activeTabId, val);
          }
        }}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: !isMobile, maxColumn: 80 },
          fontSize: isMobile ? 12 : 13,
          lineNumbersMinChars: isMobile ? 2 : 3,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 8, bottom: 8 },
          renderWhitespace: 'selection',
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
        }}
      />
    </div>
  );
}
