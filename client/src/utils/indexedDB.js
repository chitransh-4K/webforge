import { get, set, del } from 'idb-keyval';

const GUEST_PROJECT_KEY = 'codecanvas_guest_project';
const GUEST_CHAT_KEY = 'codecanvas_guest_chat';

export async function saveGuestProject(project) {
  try {
    await set(GUEST_PROJECT_KEY, project);
  } catch (err) {
    console.error('[IndexedDB] Error saving guest project:', err);
  }
}

export async function loadGuestProject() {
  try {
    return await get(GUEST_PROJECT_KEY);
  } catch (err) {
    console.error('[IndexedDB] Error loading guest project:', err);
    return null;
  }
}

export async function clearGuestProject() {
  try {
    await del(GUEST_PROJECT_KEY);
    await del(GUEST_CHAT_KEY);
  } catch (err) {
    console.error('[IndexedDB] Error clearing guest project:', err);
  }
}
