export const ALLOWED_EXTENSIONS = ['.html', '.css', '.js', '.json', '.md', '.txt', '.svg'];
export const MAX_FILES = 200;
export const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB
export const MAX_PROJECT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function getFileExtension(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx).toLowerCase();
}

export function isAllowedFile(filename) {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function getLanguageForFile(filename) {
  const ext = getFileExtension(filename);
  switch (ext) {
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.js':
      return 'javascript';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    case '.svg':
      return 'xml';
    default:
      return 'plaintext';
  }
}

export function validateNodeName(name, parentId, existingNodes, currentId = null) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'Name cannot be empty' };
  }
  const trimmed = name.trim();
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return { valid: false, error: 'Name cannot contain slashes ("/" or "\\")' };
  }
  const isDuplicate = existingNodes.some(
    (n) => n.id !== currentId && n.parentId === parentId && n.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    return { valid: false, error: `A file or folder named "${trimmed}" already exists in this folder` };
  }
  return { valid: true, error: null };
}

export function buildNodePath(nodeId, nodes) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return '';
  const segments = [node.name];
  let curr = node;
  while (curr.parentId) {
    curr = nodes.find((n) => n.id === curr.parentId);
    if (!curr) break;
    segments.unshift(curr.name);
  }
  return '/' + segments.join('/');
}

export function findNodeByPath(path, nodes) {
  const normalized = path.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalized) return null;
  const parts = normalized.split('/');
  
  let currentParentId = null;
  let targetNode = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    targetNode = nodes.find(
      (n) => n.parentId === currentParentId && n.name.toLowerCase() === part.toLowerCase()
    );
    if (!targetNode) return null;
    currentParentId = targetNode.id;
  }
  return targetNode;
}

export function calculateProjectSize(nodes) {
  let total = 0;
  for (const n of nodes) {
    if (n.type === 'file' && typeof n.content === 'string') {
      total += new Blob([n.content]).size;
    }
  }
  return total;
}

export function countFiles(nodes) {
  return nodes.filter((n) => n.type === 'file').length;
}

export function getFileDescendants(folderId, nodes) {
  const results = [];
  function recurse(parentId) {
    const children = nodes.filter((n) => n.parentId === parentId);
    for (const child of children) {
      results.push(child);
      if (child.type === 'folder') {
        recurse(child.id);
      }
    }
  }
  recurse(folderId);
  return results;
}
