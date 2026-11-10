import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useFileStore } from '../../stores/useFileStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { getFileIcon } from '../editor/EditorTabs.jsx';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

export function FileTreeNode({
  node,
  depth = 0,
  openFolders,
  toggleFolder,
  renamingNodeId,
  setRenamingNodeId,
  onContextMenu,
}) {
  const { activeTabId, openTab } = useEditorStore();
  const { project, renameNode, moveNode } = useFileStore();
  const { setStatusMessage } = useUIStore();

  const [renameValue, setRenameValue] = useState(node.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const isFolder = node.type === 'folder';
  const isOpen = openFolders[node.id] !== false; // Default folders to open
  const isActive = activeTabId === node.id;
  const isRenaming = renamingNodeId === node.id;

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(node.name);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIdx = node.name.lastIndexOf('.');
          if (dotIdx > 0 && !isFolder) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isRenaming, node.name, isFolder]);

  const handleRenameSubmit = () => {
    if (!isRenaming) return;
    if (renameValue.trim() !== node.name) {
      try {
        renameNode(node.id, renameValue);
        setStatusMessage(`Renamed to "${renameValue.trim()}"`);
      } catch (err) {
        setStatusMessage(`Rename error: ${err.message}`);
      }
    }
    setRenamingNodeId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenamingNodeId(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id) {
      try {
        const targetParentId = isFolder ? node.id : node.parentId;
        moveNode(draggedId, targetParentId);
        setStatusMessage('Item moved.');
      } catch (err) {
        setStatusMessage(`Move error: ${err.message}`);
      }
    }
  };

  const children = project.nodes.filter((n) => n.parentId === node.id);
  // Sort children: folders first, then files alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (isFolder) {
            toggleFolder(node.id);
          } else {
            openTab(node.id);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, node);
        }}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`group flex items-center h-6.5 text-xs font-mono cursor-pointer transition-colors border border-transparent ${
          isActive && !isFolder
            ? 'bg-[#094771] text-white'
            : isDragOver
            ? 'bg-[#007acc]/30 border-dashed border-[#007acc]'
            : 'hover:bg-[#2a2d2e] dark:hover:bg-[#2a2d2e] light:hover:bg-[#e8e8e8] text-gray-300 dark:text-gray-300 light:text-gray-800'
        }`}
      >
        {/* Folder expander */}
        {isFolder ? (
          <span className="w-4 h-4 flex items-center justify-center mr-0.5 text-gray-400">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-4 mr-0.5" />
        )}

        {/* Icon */}
        <span className="mr-1.5 flex items-center">
          {isFolder ? (
            isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400" />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        {/* Name / Inline rename */}
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-[#3c3c3c] text-white px-1 py-0.5 rounded outline-none border border-[#007acc] text-xs font-mono"
          />
        ) : (
          <span className="truncate select-none">{node.name}</span>
        )}
      </div>

      {/* Render children recursively if folder is open */}
      {isFolder && isOpen && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              renamingNodeId={renamingNodeId}
              setRenamingNodeId={setRenamingNodeId}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}
