import React, { useEffect, useRef } from 'react';
import {
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  Link2,
} from 'lucide-react';

export function ContextMenu({
  x,
  y,
  targetNode,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onDuplicate,
  onExportZip,
  onImportZip,
  onCopyPath,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust positioning to keep inside viewport
  const style = {
    top: Math.min(y, window.innerHeight - 240),
    left: Math.min(x, window.innerWidth - 200),
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 min-w-[180px] bg-[#252526] text-vscode-dark-text border border-vscode-dark-border rounded-lg shadow-2xl py-1 text-xs font-sans select-none animate-scale-in"
    >
      {targetNode && targetNode.type === 'folder' && (
        <>
          <button
            onClick={() => { onNewFile(targetNode.id); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-sky-400" />
            <span>New File...</span>
          </button>
          <button
            onClick={() => { onNewFolder(targetNode.id); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder...</span>
          </button>
          <div className="h-[1px] bg-vscode-dark-border my-1" />
        </>
      )}

      {targetNode ? (
        <>
          <button
            onClick={() => { onRename(targetNode); onClose(); }}
            className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Edit2 className="w-3.5 h-3.5 text-gray-400" />
              <span>Rename...</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">F2</span>
          </button>

          {targetNode.type === 'file' && (
            <button
              onClick={() => { onDuplicate(targetNode.id); onClose(); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              <span>Duplicate File</span>
            </button>
          )}

          <button
            onClick={() => { onCopyPath(targetNode); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <Link2 className="w-3.5 h-3.5 text-gray-400" />
            <span>Copy Relative Path</span>
          </button>

          <div className="h-[1px] bg-vscode-dark-border my-1" />

          <button
            onClick={() => { onDelete(targetNode); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => { onNewFile(null); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-sky-400" />
            <span>New File...</span>
          </button>
          <button
            onClick={() => { onNewFolder(null); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Folder...</span>
          </button>
          <div className="h-[1px] bg-vscode-dark-border my-1" />
          <button
            onClick={() => { onExportZip(); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download ZIP</span>
          </button>
          <button
            onClick={() => { onImportZip(); onClose(); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#094771] hover:text-white transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Upload ZIP...</span>
          </button>
        </>
      )}
    </div>
  );
}
