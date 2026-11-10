import { create } from 'zustand';
import { apiClient } from '../api/client.js';
import { loadGuestProject, clearGuestProject } from '../utils/indexedDB.js';
import { useFileStore, createDefaultNodes } from './useFileStore.js';
import { useUIStore } from './useUIStore.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  projects: [],
  isLoading: true,
  guestNeedsImport: false,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await apiClient('/api/auth/me');
      set({ user: data.user, isLoading: false });
      if (data.user) {
        await get().fetchProjects();
        const projects = get().projects;
        const currentProject = useFileStore.getState().project;
        if (currentProject.isGuest && projects.length > 0) {
          const fullProj = await apiClient(`/api/projects/${projects[0]._id}`);
          useFileStore.getState().setProject(fullProj.project || fullProj);
        }
      }
    } catch (err) {
      // Guest mode
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const data = await apiClient('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    set({ user: data.user });
    await get().fetchProjects();

    // Check if guest project has modifications to offer import
    const guestProj = await loadGuestProject();
    if (guestProj && guestProj.nodes && guestProj.nodes.length > 0) {
      set({ guestNeedsImport: true });
      return data.user;
    }

    // Otherwise load existing cloud project or create one
    await get().ensureActiveCloudProject();
    useUIStore.getState().closeModal();
    return data.user;
  },

  register: async (email, password) => {
    const data = await apiClient('/api/auth/register', {
      method: 'POST',
      body: { email, password },
    });
    set({ user: data.user });
    await get().fetchProjects();

    const guestProj = await loadGuestProject();
    if (guestProj && guestProj.nodes && guestProj.nodes.length > 0) {
      set({ guestNeedsImport: true });
      return data.user;
    }

    await get().ensureActiveCloudProject();
    useUIStore.getState().closeModal();
    return data.user;
  },

  ensureActiveCloudProject: async () => {
    const projects = get().projects;
    if (projects.length > 0) {
      const fullProj = await apiClient(`/api/projects/${projects[0]._id}`);
      useFileStore.getState().setProject(fullProj.project || fullProj);
    } else {
      const created = await apiClient('/api/projects', {
        method: 'POST',
        body: {
          name: 'My First Project',
          nodes: createDefaultNodes(),
        },
      });
      await get().fetchProjects();
      useFileStore.getState().setProject(created.project || created);
    }
  },

  logout: async () => {
    try {
      await apiClient('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    set({ user: null, projects: [], guestNeedsImport: false });
    // Reinitialize as guest project
    await useFileStore.getState().initProject();
  },

  fetchProjects: async () => {
    try {
      const data = await apiClient('/api/projects');
      set({ projects: data.projects || [] });
    } catch (err) {
      console.error('[AuthStore] Failed to fetch projects:', err);
    }
  },

  importGuestToCloud: async () => {
    try {
      const guestProj = await loadGuestProject();
      if (!guestProj) return;

      const data = await apiClient('/api/projects/import-guest', {
        method: 'POST',
        body: {
          name: guestProj.name || 'Imported Guest Project',
          nodes: guestProj.nodes,
        },
      });

      set({ guestNeedsImport: false });
      await clearGuestProject();
      await get().fetchProjects();
      useFileStore.getState().setProject(data.project || data);
      useUIStore.getState().closeModal();
      useUIStore.getState().setStatusMessage('Guest project imported to your cloud account!');
    } catch (err) {
      alert(`Import error: ${err.message}`);
    }
  },

  dismissGuestImport: async () => {
    set({ guestNeedsImport: false });
    await clearGuestProject();
    await get().ensureActiveCloudProject();
    useUIStore.getState().closeModal();
  },
}));
