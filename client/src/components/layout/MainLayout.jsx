import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useUIStore } from '../../stores/useUIStore.js';
import { useResponsive } from '../../hooks/useResponsive.js';
import { ActivityBar } from './ActivityBar.jsx';
import { StatusBar } from './StatusBar.jsx';
import { EditorTabs } from '../editor/EditorTabs.jsx';
import { EditorContainer } from '../editor/EditorContainer.jsx';
import { FileExplorer } from '../explorer/FileExplorer.jsx';
import { PreviewPanel } from '../preview/PreviewPanel.jsx';
import { ConsolePanel } from '../preview/ConsolePanel.jsx';
import { AIChatPanel } from '../ai/AIChatPanel.jsx';
import { ShortcutsModal } from './ShortcutsModal.jsx';
import { AuthModal } from '../auth/AuthModal.jsx';
import { ProjectSwitcherModal } from '../auth/ProjectSwitcherModal.jsx';
import { MonacoDiffModal } from '../editor/MonacoDiffModal.jsx';
import { Code2, Eye, Sparkles, Terminal, X } from 'lucide-react';

export function MainLayout() {
  const {
    isExplorerOpen,
    toggleExplorer,
    isPreviewOpen,
    isChatOpen,
    isConsoleOpen,
    toggleConsole,
    activeModal,
    mobileView,
    setMobileView,
  } = useUIStore();

  const { isMobile } = useResponsive();
  const isRightRegionOpen = isPreviewOpen || isChatOpen;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-vscode-dark-bg text-vscode-dark-text dark:bg-vscode-dark-bg light:bg-vscode-light-bg font-sans">
      {/* Top Workspace Area */}
      <div className="flex flex-1 w-full overflow-hidden relative">
        {/* Left Activity Bar */}
        <ActivityBar />

        {/* --- MOBILE LAYOUT (< 768px) --- */}
        {isMobile ? (
          <div className="flex-1 h-full flex flex-col overflow-hidden relative">
            {/* Mobile View Switcher Top Bar */}
            <div className="flex items-center justify-between h-9 bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar border-b border-vscode-dark-border px-2 text-xs shrink-0 z-10">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setMobileView('editor')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    mobileView === 'editor'
                      ? 'bg-[#007acc] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>

                <button
                  onClick={() => setMobileView('preview')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    mobileView === 'preview'
                      ? 'bg-[#007acc] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => setMobileView('chat')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    mobileView === 'chat'
                      ? 'bg-[#007acc] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleConsole}
                  title="Toggle Console"
                  className={`p-1.5 rounded transition ${
                    isConsoleOpen && mobileView === 'editor'
                      ? 'text-sky-400 bg-sky-500/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Main Content Screen */}
            <div className="flex-1 w-full h-full overflow-hidden relative">
              {/* 1. Mobile Editor View */}
              {mobileView === 'editor' && (
                <div className="flex flex-col h-full w-full overflow-hidden">
                  <EditorTabs />
                  <div className="flex-1 w-full overflow-hidden relative">
                    <EditorContainer />
                  </div>

                  {/* Mobile Console Bottom Drawer */}
                  {isConsoleOpen && (
                    <div className="h-52 w-full bg-[#181818] border-t border-vscode-dark-border flex flex-col shrink-0">
                      <ConsolePanel />
                    </div>
                  )}
                </div>
              )}

              {/* 2. Mobile Live Preview View */}
              {mobileView === 'preview' && (
                <div className="h-full w-full overflow-hidden">
                  <PreviewPanel />
                </div>
              )}

              {/* 3. Mobile AI Assistant View */}
              {mobileView === 'chat' && (
                <div className="h-full w-full overflow-hidden bg-[#1e1e1e]">
                  <AIChatPanel />
                </div>
              )}
            </div>

            {/* Mobile File Explorer Slide-Out Drawer */}
            {isExplorerOpen && (
              <>
                {/* Backdrop */}
                <div
                  onClick={toggleExplorer}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity"
                />
                {/* Drawer */}
                <div className="fixed inset-y-0 left-11 sm:left-12 z-40 w-72 max-w-[82vw] bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar border-r border-vscode-dark-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-vscode-dark-border">
                    <span className="text-xs font-semibold text-gray-300">Project Files</span>
                    <button
                      onClick={toggleExplorer}
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <FileExplorer />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* --- DESKTOP / TABLET LAYOUT (>= 768px) --- */
          <div className="flex-1 h-full overflow-hidden relative">
            <PanelGroup direction="horizontal" autoSaveId="webforge-h-layout">
              {/* Left Sidebar: File Explorer */}
              {isExplorerOpen && (
                <>
                  <Panel
                    id="panel-explorer"
                    order={1}
                    defaultSize={20}
                    minSize={14}
                    maxSize={40}
                    className="h-full bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar border-r border-vscode-dark-border dark:border-vscode-dark-border light:border-vscode-light-border overflow-hidden"
                  >
                    <FileExplorer />
                  </Panel>
                  <PanelResizeHandle className="w-1 bg-vscode-dark-border/40 hover:bg-[#007acc] transition-colors cursor-col-resize z-10" />
                </>
              )}

              {/* Center Area: Editor Tabs + Editor + Bottom Console */}
              <Panel id="panel-center" order={2} minSize={30} className="h-full flex flex-col overflow-hidden">
                <PanelGroup direction="vertical" autoSaveId="webforge-v-layout">
                  {/* Editor Section */}
                  <Panel id="panel-editor" order={1} minSize={25} className="h-full flex flex-col overflow-hidden">
                    <EditorTabs />
                    <div className="flex-1 w-full overflow-hidden relative">
                      <EditorContainer />
                    </div>
                  </Panel>

                  {/* Bottom Console Panel */}
                  {isConsoleOpen && (
                    <>
                      <PanelResizeHandle className="h-1 bg-vscode-dark-border/40 hover:bg-[#007acc] transition-colors cursor-row-resize z-10" />
                      <Panel
                        id="panel-console"
                        order={2}
                        defaultSize={30}
                        minSize={15}
                        maxSize={60}
                        className="h-full bg-[#181818] border-t border-vscode-dark-border overflow-hidden flex flex-col"
                      >
                        <ConsolePanel />
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </Panel>

              {/* Right Region: Live Preview OR AI Chat (mutually exclusive) */}
              {isRightRegionOpen && (
                <>
                  <PanelResizeHandle className="w-1 bg-vscode-dark-border/40 hover:bg-[#007acc] transition-colors cursor-col-resize z-10" />
                  <Panel
                    id="panel-right-region"
                    order={3}
                    defaultSize={38}
                    minSize={22}
                    maxSize={70}
                    className="h-full overflow-hidden border-l border-vscode-dark-border"
                  >
                    {isPreviewOpen && <PreviewPanel />}
                    {isChatOpen && <AIChatPanel />}
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals */}
      {activeModal === 'shortcuts' && <ShortcutsModal />}
      {activeModal === 'auth' && <AuthModal />}
      {activeModal === 'projectSwitcher' && <ProjectSwitcherModal />}
      {activeModal === 'diff' && <MonacoDiffModal />}
    </div>
  );
}
