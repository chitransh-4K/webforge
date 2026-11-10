import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useFileStore, createDefaultNodes } from '../../stores/useFileStore.js';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { apiClient } from '../../api/client.js';
import {
  FolderSync,
  Plus,
  Edit2,
  Trash2,
  Copy,
  X,
  Check,
  Lock,
  Cloud,
} from 'lucide-react';

export function ProjectSwitcherModal() {
  const { user, projects, fetchProjects } = useAuthStore();
  const { project: currentProject, setProject } = useFileStore();
  const { closeAllTabs, openTab } = useEditorStore();
  const { closeModal, openModal, setStatusMessage } = useUIStore();

  const [newProjectName, setNewProjectName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // If user is guest
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-[#252526] border border-vscode-dark-border rounded-xl shadow-2xl p-6 text-center space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Guest Mode</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              You are currently using WebForge as a Guest. Your project is automatically saved in your browser's IndexedDB.
              Sign in to create multiple projects, sync them across devices, and unlock AI assistant features!
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-xs text-gray-300 transition"
            >
              Continue as Guest
            </button>
            <button
              onClick={() => openModal('auth')}
              className="px-4 py-2 rounded bg-[#007acc] hover:bg-[#0098ff] text-xs text-white font-medium transition"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectProject = async (proj) => {
    try {
      const fullProj = await apiClient(`/api/projects/${proj._id}`);
      const targetProj = fullProj.project || fullProj;
      closeAllTabs(true);
      setProject(targetProj);
      // Open index.html if exists
      const idxNode = targetProj.nodes?.find((n) => n.name.toLowerCase() === 'index.html');
      if (idxNode) openTab(idxNode.id);
      closeModal();
      setStatusMessage(`Switched to "${targetProj.name}"`);
    } catch (err) {
      alert(`Failed to load project: ${err.message}`);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const created = await apiClient('/api/projects', {
        method: 'POST',
        body: {
          name: newProjectName.trim(),
          nodes: createDefaultNodes(),
        },
      });
      await fetchProjects();
      const newP = created.project || created;
      closeAllTabs(true);
      setProject(newP);
      const idxNode = newP.nodes?.find((n) => n.name.toLowerCase() === 'index.html');
      if (idxNode) openTab(idxNode.id);
      setIsCreating(false);
      setNewProjectName('');
      closeModal();
      setStatusMessage(`Created project "${newP.name}"`);
    } catch (err) {
      alert(`Create error: ${err.message}`);
    }
  };

  const handleRename = async (projId) => {
    if (!renameVal.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      const res = await apiClient(`/api/projects/${projId}`, {
        method: 'PUT',
        body: { name: renameVal.trim() },
      });
      await fetchProjects();
      if (currentProject._id === projId) {
        setProject({ ...currentProject, name: renameVal.trim() });
      }
      setRenamingId(null);
      setStatusMessage('Project renamed.');
    } catch (err) {
      alert(`Rename error: ${err.message}`);
    }
  };

  const handleDelete = async (projId, name) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient(`/api/projects/${projId}`, { method: 'DELETE' });
      await fetchProjects();
      if (currentProject._id === projId) {
        const remaining = projects.filter((p) => p._id !== projId);
        if (remaining.length > 0) {
          handleSelectProject(remaining[0]);
        }
      }
      setStatusMessage(`Deleted project "${name}"`);
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleDuplicate = async (proj) => {
    try {
      const full = await apiClient(`/api/projects/${proj._id}`);
      const created = await apiClient('/api/projects', {
        method: 'POST',
        body: {
          name: `${full.project.name} (Copy)`,
          nodes: full.project.nodes,
        },
      });
      await fetchProjects();
      setStatusMessage(`Duplicated "${full.project.name}"`);
    } catch (err) {
      alert(`Duplicate error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#252526] border border-vscode-dark-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vscode-dark-border bg-[#1f1f1f]">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Cloud className="w-5 h-5 text-sky-400" />
            <span>Cloud Projects</span>
          </div>
          <button onClick={closeModal} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-4 border-b border-vscode-dark-border/50 bg-[#1e1e1e]">
          {isCreating ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="New project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                className="flex-1 bg-[#252526] border border-[#007acc] rounded px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                onClick={handleCreateProject}
                className="px-3 py-1.5 rounded bg-[#007acc] hover:bg-[#0098ff] text-white text-xs font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-2 py-1.5 rounded text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#007acc]/20 hover:bg-[#007acc]/30 text-sky-300 text-xs font-medium border border-sky-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
          )}
        </div>

        {/* Project List */}
        <div className="p-4 overflow-y-auto space-y-2">
          {projects.map((proj) => {
            const isCurrent = currentProject._id === proj._id;
            const isEditing = renamingId === proj._id;

            return (
              <div
                key={proj._id}
                className={`flex items-center justify-between p-3 rounded-lg border transition ${
                  isCurrent
                    ? 'bg-[#094771]/30 border-sky-500/50'
                    : 'bg-black/20 hover:bg-black/30 border-white/5'
                }`}
              >
                {/* Name */}
                <div className="flex-1 mr-3 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(proj._id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="bg-[#3c3c3c] text-white px-2 py-1 rounded text-xs outline-none border border-[#007acc] w-full"
                      />
                      <button
                        onClick={() => handleRename(proj._id)}
                        className="p-1 rounded text-emerald-400 hover:bg-white/10"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleSelectProject(proj)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-xs truncate">
                          {proj.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 bg-[#007acc] text-white text-[10px] rounded font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Version: {proj.version} • Updated: {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 text-gray-400 shrink-0">
                  <button
                    onClick={() => {
                      setRenamingId(proj._id);
                      setRenameVal(proj.name);
                    }}
                    title="Rename"
                    className="p-1.5 rounded hover:text-white hover:bg-white/10"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(proj)}
                    title="Duplicate"
                    className="p-1.5 rounded hover:text-white hover:bg-white/10"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj._id, proj.name)}
                    title="Delete"
                    className="p-1.5 rounded hover:text-red-400 hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-500">
              No cloud projects found. Click "Create New Project" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
