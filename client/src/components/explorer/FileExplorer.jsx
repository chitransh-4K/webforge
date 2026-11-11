import React, { useState, useRef } from 'react';
import { useFileStore } from '../../stores/useFileStore.js';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { FileTreeNode } from './FileTreeNode.jsx';
import { ContextMenu } from './ContextMenu.jsx';
import { exportProjectToZip, importZipToProject } from '../../utils/zipHandler.js';
import {
  calculateProjectSize,
  countFiles,
  MAX_FILES,
  MAX_PROJECT_SIZE_BYTES,
  buildNodePath,
} from '../../utils/fileTree.js';
import {
  FilePlus,
  FolderPlus,
  FolderArchive,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Trash2,
} from 'lucide-react';

export function FileExplorer() {
  const { project, addNode, deleteNode, duplicateNode, setProject } = useFileStore();
  const { openTab, closeTab } = useEditorStore();
  const { setStatusMessage } = useUIStore();

  const [openFolders, setOpenFolders] = useState({});
  const [renamingNodeId, setRenamingNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, targetNode }
  const [isCreating, setIsCreating] = useState(null); // { type: 'file' | 'folder', parentId: null }
  const [createName, setCreateName] = useState('');
  const [deleteConfirmNode, setDeleteConfirmNode] = useState(null);

  const fileInputRef = useRef(null);
  const createInputRef = useRef(null);

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: prev[folderId] === false ? true : false,
    }));
  };

  const handleStartCreate = (type, parentId = null) => {
    setIsCreating({ type, parentId });
    setCreateName('');
    if (parentId) {
      setOpenFolders((prev) => ({ ...prev, [parentId]: true }));
    }
    setTimeout(() => {
      createInputRef.current?.focus();
    }, 50);
  };

  const handleCreateSubmit = () => {
    if (!isCreating || !createName.trim()) {
      setIsCreating(null);
      return;
    }
    try {
      const newNode = addNode({
        parentId: isCreating.parentId,
        name: createName.trim(),
        type: isCreating.type,
        content: isCreating.type === 'file' ? '' : undefined,
      });
      if (isCreating.type === 'file') {
        openTab(newNode.id);
      }
      setStatusMessage(`Created ${isCreating.type} "${createName.trim()}"`);
    } catch (err) {
      setStatusMessage(`Create error: ${err.message}`);
    }
    setIsCreating(null);
    setCreateName('');
  };

  const handleDeleteConfirmed = () => {
    if (!deleteConfirmNode) return;
    try {
      const deletedIds = deleteNode(deleteConfirmNode.id);
      if (deletedIds) {
        deletedIds.forEach((id) => closeTab(id, true));
      }
      setStatusMessage(`Deleted "${deleteConfirmNode.name}"`);
    } catch (err) {
      setStatusMessage(`Delete error: ${err.message}`);
    }
    setDeleteConfirmNode(null);
  };

  const handleDuplicate = (nodeId) => {
    try {
      const copy = duplicateNode(nodeId);
      if (copy) {
        openTab(copy.id);
        setStatusMessage(`Duplicated "${copy.name}"`);
      }
    } catch (err) {
      setStatusMessage(`Duplicate error: ${err.message}`);
    }
  };

  const handleCopyPath = (node) => {
    const relPath = buildNodePath(node.id, project.nodes);
    navigator.clipboard.writeText(relPath);
    setStatusMessage(`Copied path: ${relPath}`);
  };

  const handleExportZip = async () => {
    try {
      setStatusMessage('Downloading project ZIP...');
      await exportProjectToZip(project);
      setStatusMessage('Project ZIP downloaded successfully.');
    } catch (err) {
      setStatusMessage(`Download ZIP error: ${err.message}`);
    }
  };

  const handleImportZipClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatusMessage('Uploading ZIP project...');
      const importedNodes = await importZipToProject(file);
      const updatedProject = {
        ...project,
        nodes: importedNodes,
        version: project.version + 1,
      };
      setProject(updatedProject);
      // Auto open index.html if present
      const indexNode = importedNodes.find((n) => n.name.toLowerCase() === 'index.html' && n.parentId === null);
      if (indexNode) {
        openTab(indexNode.id);
      }
      setStatusMessage(`Uploaded ${importedNodes.length} files/folders from ZIP.`);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
      setStatusMessage(`ZIP upload failed: ${err.message}`);
    }
    e.target.value = '';
  };

  // Root level nodes
  const rootNodes = project.nodes.filter((n) => n.parentId === null);
  rootNodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const fileCount = countFiles(project.nodes);
  const totalSizeBytes = calculateProjectSize(project.nodes);
  const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <div
      className="flex flex-col h-full w-full select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetNode: null });
      }}
    >
      {/* Hidden file input for ZIP import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Explorer Title & Actions Bar */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-vscode-dark-border dark:border-vscode-dark-border light:border-vscode-light-border bg-vscode-dark-sidebar dark:bg-vscode-dark-sidebar light:bg-vscode-light-sidebar text-xs">
        <span className="font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 truncate text-[11px]">
          Explorer: {project.name}
        </span>
        <div className="flex items-center gap-0.5 text-gray-400">
          <button
            onClick={() => handleStartCreate('file', null)}
            title="New File"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleStartCreate('folder', null)}
            title="New Folder"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportZip}
            title="Download ZIP"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleImportZipClick}
            title="Upload ZIP"
            className="p-1 rounded hover:text-white dark:hover:text-white light:hover:text-black hover:bg-white/10"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File Tree View */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Inline input for creating at root */}
        {isCreating && isCreating.parentId === null && (
          <div className="flex items-center px-4 py-1 text-xs font-mono">
            <span className="mr-2 text-sky-400">
              {isCreating.type === 'file' ? <FilePlus className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
            </span>
            <input
              ref={createInputRef}
              type="text"
              placeholder={`name.${isCreating.type === 'file' ? 'js' : ''}`}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSubmit();
                if (e.key === 'Escape') setIsCreating(null);
              }}
              className="flex-1 bg-[#3c3c3c] text-white px-1.5 py-0.5 rounded outline-none border border-[#007acc] text-xs font-mono"
            />
          </div>
        )}

        {/* Tree Nodes */}
        {rootNodes.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            depth={0}
            openFolders={openFolders}
            toggleFolder={toggleFolder}
            renamingNodeId={renamingNodeId}
            setRenamingNodeId={setRenamingNodeId}
            isCreating={isCreating}
            createName={createName}
            setCreateName={setCreateName}
            handleCreateSubmit={handleCreateSubmit}
            setIsCreating={setIsCreating}
            onContextMenu={(e, target) => {
              setContextMenu({ x: e.clientX, y: e.clientY, targetNode: target });
            }}
          />
        ))}

        {rootNodes.length === 0 && !isCreating && (
          <div className="p-4 text-center text-xs text-gray-500">
            No files in project. Right-click or use toolbar buttons to create files.
          </div>
        )}
      </div>

      {/* Storage & Limits Footer */}
      <div className="px-3 py-1.5 border-t border-vscode-dark-border dark:border-vscode-dark-border light:border-vscode-light-border text-[10px] text-gray-500 flex justify-between items-center font-mono">
        <span>Files: {fileCount}/{MAX_FILES}</span>
        <span>Size: {sizeMb}/5 MB</span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetNode={contextMenu.targetNode}
          onClose={() => setContextMenu(null)}
          onNewFile={(parentId) => handleStartCreate('file', parentId)}
          onNewFolder={(parentId) => handleStartCreate('folder', parentId)}
          onRename={(node) => setRenamingNodeId(node.id)}
          onDelete={(node) => setDeleteConfirmNode(node)}
          onDuplicate={handleDuplicate}
          onExportZip={handleExportZip}
          onImportZip={handleImportZipClick}
          onCopyPath={handleCopyPath}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#252526] border border-vscode-dark-border rounded-lg shadow-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-semibold text-white">Delete {deleteConfirmNode.type}?</h3>
            </div>
            <p className="text-xs text-gray-300">
              Are you sure you want to delete <span className="font-bold text-white">"{deleteConfirmNode.name}"</span>
              {deleteConfirmNode.type === 'folder' && ' and all of its contents'}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmNode(null)}
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-xs text-white font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
