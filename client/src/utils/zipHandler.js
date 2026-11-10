import JSZip from 'jszip';
import {
  isAllowedFile,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_PROJECT_SIZE_BYTES,
  buildNodePath,
} from './fileTree.js';

export async function exportProjectToZip(project) {
  const zip = new JSZip();
  const { nodes, name } = project;

  // Map to store folder references inside zip
  const folderZipMap = { null: zip };

  // First sort nodes so parents come before children
  const folders = nodes.filter((n) => n.type === 'folder');
  const files = nodes.filter((n) => n.type === 'file');

  // Helper to ensure folder exists in zip
  function getZipFolder(folderId) {
    if (folderZipMap[folderId]) return folderZipMap[folderId];
    const node = nodes.find((n) => n.id === folderId);
    if (!node) return zip;
    const parentZip = getZipFolder(node.parentId);
    const created = parentZip.folder(node.name);
    folderZipMap[folderId] = created;
    return created;
  }

  // Create folder structure
  folders.forEach((f) => getZipFolder(f.id));

  // Add files
  files.forEach((file) => {
    const parentZip = getZipFolder(file.parentId);
    parentZip.file(file.name, file.content || '');
  });

  // Generate ZIP blob
  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${(name || 'codecanvas-project').replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;

  // Trigger download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importZipToProject(file) {
  const zip = await JSZip.loadAsync(file);
  const newNodes = [];
  let fileCount = 0;
  let totalSize = 0;

  // Map folder paths to node IDs
  const pathToFolderId = {};

  // Find all file entries
  const entries = Object.keys(zip.files).filter((entryPath) => {
    // Ignore OS junk like __MACOSX or .DS_Store
    return !entryPath.startsWith('__MACOSX') && !entryPath.includes('.DS_Store');
  });

  for (const entryPath of entries) {
    const entry = zip.files[entryPath];
    const parts = entryPath.replace(/\/+$/, '').split('/');

    if (entry.dir) {
      // It is a directory
      let currentPath = '';
      let parentId = null;

      for (const part of parts) {
        if (!part) continue;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!pathToFolderId[currentPath]) {
          const folderNode = {
            id: 'node-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
            parentId,
            name: part,
            type: 'folder',
          };
          newNodes.push(folderNode);
          pathToFolderId[currentPath] = folderNode.id;
        }
        parentId = pathToFolderId[currentPath];
      }
    } else {
      // It is a file
      const filename = parts[parts.length - 1];
      if (!isAllowedFile(filename)) {
        console.warn(`[ZIP Import] Skipping disallowed file: ${filename}`);
        continue;
      }

      fileCount++;
      if (fileCount > MAX_FILES) {
        throw new Error(`ZIP import exceeded file count limit of ${MAX_FILES} files.`);
      }

      // Ensure all parent directories exist
      let currentPath = '';
      let parentId = null;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!pathToFolderId[currentPath]) {
          const folderNode = {
            id: 'node-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
            parentId,
            name: part,
            type: 'folder',
          };
          newNodes.push(folderNode);
          pathToFolderId[currentPath] = folderNode.id;
        }
        parentId = pathToFolderId[currentPath];
      }

      // Read file content
      const content = await entry.async('string');
      const fileSize = new Blob([content]).size;

      if (fileSize > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File "${filename}" in ZIP exceeds 1 MB size limit.`);
      }

      totalSize += fileSize;
      if (totalSize > MAX_PROJECT_SIZE_BYTES) {
        throw new Error(`Total size of imported ZIP files exceeds 5 MB project limit.`);
      }

      newNodes.push({
        id: 'node-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        parentId,
        name: filename,
        type: 'file',
        content,
      });
    }
  }

  if (newNodes.length === 0) {
    throw new Error('No valid HTML/CSS/JS/JSON/MD files found in ZIP.');
  }

  return newNodes;
}
