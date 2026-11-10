import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useUIStore } from '../../stores/useUIStore.js';
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

export function MainLayout() {
  const {
    isExplorerOpen,
    isPreviewOpen,
    isChatOpen,
    isConsoleOpen,
    activeModal,
  } = useUIStore();

  const isRightRegionOpen = isPreviewOpen || isChatOpen;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-vscode-dark-bg text-vscode-dark-text dark:bg-vscode-dark-bg light:bg-vscode-light-bg font-sans">
      {/* Top Workspace Area */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Activity Bar */}
        <ActivityBar />

        {/* Resizable Panels Container */}
        <div className="flex-1 h-full overflow-hidden relative">
          <PanelGroup direction="horizontal" autoSaveId="codecanvas-h-layout">
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
              <PanelGroup direction="vertical" autoSaveId="codecanvas-v-layout">
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

            {/* Right Region: Live Preview and AI Chat (both open = side by side) */}
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
                  <PanelGroup direction="horizontal" autoSaveId="codecanvas-right-layout">
                    {/* Live Preview Panel */}
                    {isPreviewOpen && (
                      <Panel
                        id="panel-preview"
                        order={1}
                        defaultSize={isChatOpen ? 50 : 100}
                        minSize={25}
                        className="h-full overflow-hidden bg-vscode-dark-bg"
                      >
                        <PreviewPanel />
                      </Panel>
                    )}

                    {/* Resize handle between Preview and Chat if both open */}
                    {isPreviewOpen && isChatOpen && (
                      <PanelResizeHandle className="w-1 bg-vscode-dark-border/40 hover:bg-[#007acc] transition-colors cursor-col-resize z-10" />
                    )}

                    {/* AI Chat Panel */}
                    {isChatOpen && (
                      <Panel
                        id="panel-chat"
                        order={2}
                        defaultSize={isPreviewOpen ? 50 : 100}
                        minSize={25}
                        className="h-full overflow-hidden bg-[#1e1e1e]"
                      >
                        <AIChatPanel />
                      </Panel>
                    )}
                  </PanelGroup>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
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
