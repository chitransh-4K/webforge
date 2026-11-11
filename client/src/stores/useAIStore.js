import { create } from 'zustand';
import { useAuthStore } from './useAuthStore.js';
import { useFileStore } from './useFileStore.js';
import { useEditorStore } from './useEditorStore.js';
import { useUIStore } from './useUIStore.js';
import { findNodeByPath, buildNodePath } from '../utils/fileTree.js';
import { apiClient, API_BASE } from '../api/client.js';

export const useAIStore = create((set, get) => ({
  messages: [],
  isStreaming: false,
  error: null,

  setMessages: (messages) => set({ messages }),

  loadChat: async (projectId) => {
    if (!projectId || projectId.startsWith('guest-')) return;
    try {
      const data = await apiClient(`/api/projects/${projectId}/chat`);
      set({ messages: data.messages || [] });
    } catch (err) {
      console.warn('[AIStore] Failed to load chat history:', err);
    }
  },

  clearChat: async () => {
    const project = useFileStore.getState().project;
    if (project._id && !project.isGuest) {
      try {
        await apiClient(`/api/projects/${project._id}/chat`, { method: 'DELETE' });
      } catch (err) {
        console.warn('[AIStore] Failed to clear cloud chat:', err);
      }
    }
    set({ messages: [] });
    useUIStore.getState().setStatusMessage('Chat history cleared.');
  },

  // Check if any open proposals are now stale because target file changed
  checkStaleProposals: () => {
    const { messages } = get();
    const { project } = useFileStore.getState();
    const { getBuffer } = useEditorStore.getState();

    let updated = false;
    const nextMessages = messages.map((msg) => {
      if (!msg.proposals || msg.proposals.length === 0) return msg;

      const nextProposals = msg.proposals.map((prop) => {
        if (prop.status !== 'pending') return prop;
        // Check current content of target file
        const node = findNodeByPath(prop.path, project.nodes);
        if (node) {
          const currentContent = getBuffer(node.id);
          if (prop.originalContent !== undefined && currentContent !== prop.originalContent) {
            updated = true;
            return { ...prop, status: 'stale' };
          }
        }
        return prop;
      });

      return { ...msg, proposals: nextProposals };
    });

    if (updated) {
      set({ messages: nextMessages });
    }
  },

  acceptProposal: (proposalId) => {
    const { messages } = get();
    const fileStore = useFileStore.getState();
    const editorStore = useEditorStore.getState();
    const uiStore = useUIStore.getState();

    let targetProp = null;

    // Find proposal
    for (const msg of messages) {
      if (msg.proposals) {
        const found = msg.proposals.find((p) => p.id === proposalId);
        if (found) {
          targetProp = found;
          break;
        }
      }
    }

    if (!targetProp) return;

    try {
      if (targetProp.type === 'create') {
        // Resolve parent folder
        const cleanPath = targetProp.path.replace(/^\/+/, '');
        const segments = cleanPath.split('/');
        const filename = segments.pop();
        let parentId = null;

        if (segments.length > 0) {
          let currentParentId = null;
          let cumulativePath = '';
          for (const seg of segments) {
            cumulativePath = cumulativePath ? `${cumulativePath}/${seg}` : seg;
            let folderNode = findNodeByPath(cumulativePath, fileStore.project.nodes);
            if (!folderNode) {
              folderNode = fileStore.addNode({
                parentId: currentParentId,
                name: seg,
                type: 'folder',
              });
            }
            currentParentId = folderNode.id;
          }
          parentId = currentParentId;
        }

        const newNode = fileStore.addNode({
          parentId,
          name: filename,
          type: 'file',
          content: targetProp.content,
        });

        editorStore.openTab(newNode.id);
      } else {
        // Edit existing file
        const node = findNodeByPath(targetProp.path, fileStore.project.nodes);
        if (!node) {
          throw new Error(`Target file "${targetProp.path}" not found.`);
        }

        // Apply as unsaved edit in editor buffer so user can Undo!
        editorStore.openTab(node.id);
        editorStore.updateBuffer(node.id, targetProp.content);
      }

      // Mark proposal as accepted
      set((state) => ({
        messages: state.messages.map((m) => ({
          ...m,
          proposals: m.proposals?.map((p) =>
            p.id === proposalId ? { ...p, status: 'accepted' } : p
          ),
        })),
      }));

      uiStore.setStatusMessage(`Accepted changes for "${targetProp.path}". Unsaved in editor buffer.`);
    } catch (err) {
      uiStore.setStatusMessage(`Failed to apply proposal: ${err.message}`);
    }
  },

  rejectProposal: (proposalId) => {
    set((state) => ({
      messages: state.messages.map((m) => ({
        ...m,
        proposals: m.proposals?.map((p) =>
          p.id === proposalId ? { ...p, status: 'rejected' } : p
        ),
      })),
    }));
    useUIStore.getState().setStatusMessage('Proposal rejected.');
  },

  acceptAll: (messageId) => {
    const { messages, acceptProposal } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.proposals) return;

    msg.proposals.forEach((p) => {
      if (p.status === 'pending') {
        acceptProposal(p.id);
      }
    });
  },

  rejectAll: (messageId) => {
    const { messages, rejectProposal } = get();
    const msg = messages.find((m) => m.id === messageId);
    if (!msg || !msg.proposals) return;

    msg.proposals.forEach((p) => {
      if (p.status === 'pending') {
        rejectProposal(p.id);
      }
    });
  },

  // Stream send to server via fetch + SSE
  sendMessage: async (userPrompt) => {
    const authStore = useAuthStore.getState();
    const fileStore = useFileStore.getState();
    const editorStore = useEditorStore.getState();
    const uiStore = useUIStore.getState();

    if (!authStore.user) {
      uiStore.openModal('auth');
      return;
    }

    if (!userPrompt.trim()) return;

    const userMsgId = 'msg-' + Date.now();
    const assistantMsgId = 'msg-' + (Date.now() + 1);

    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: userPrompt.trim(),
      createdAt: new Date().toISOString(),
    };

    const assistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      proposals: [],
      truncatedFiles: [],
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      error: null,
    }));

    // Prepare context: file tree + prioritized file contents
    const activeTabId = editorStore.activeTabId;
    const activeNode = activeTabId ? fileStore.getNode(activeTabId) : null;
    const activePath = activeNode ? buildNodePath(activeNode.id, fileStore.project.nodes) : null;

    // Build payload of files
    const filesPayload = fileStore.project.nodes
      .filter((n) => n.type === 'file')
      .map((f) => ({
        id: f.id,
        path: buildNodePath(f.id, fileStore.project.nodes),
        name: f.name,
        content: editorStore.getBuffer(f.id),
      }));

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: fileStore.project._id,
          prompt: userPrompt.trim(),
          activePath,
          files: filesPayload,
          history: get().messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'token') {
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: m.content + parsed.token } : m
                  ),
                }));
              } else if (parsed.type === 'proposal') {
                // Attach original content for diff comparison
                const targetNode = findNodeByPath(parsed.proposal.path, fileStore.project.nodes);
                const originalContent = targetNode ? editorStore.getBuffer(targetNode.id) : '';

                const enrichedProposal = {
                  ...parsed.proposal,
                  originalContent,
                  status: 'pending',
                };

                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          proposals: [...(m.proposals || []), enrichedProposal],
                        }
                      : m
                  ),
                }));
              } else if (parsed.type === 'truncated') {
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, truncatedFiles: parsed.truncatedFiles || [] }
                      : m
                  ),
                }));
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch (jsonErr) {
              // ignore malformed chunks
            }
          }
        }
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        ),
        isStreaming: false,
      }));
    } catch (err) {
      console.error('[AI] Stream error:', err);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: m.content || 'An error occurred while communicating with the AI service.',
                isStreaming: false,
              }
            : m
        ),
        isStreaming: false,
        error: err.message,
      }));
    }
  },
}));
