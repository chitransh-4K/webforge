import { CONSOLE_BOOTSTRAP_SCRIPT } from './consoleBootstrap.js';
import { findNodeByPath, buildNodePath } from './fileTree.js';
import { useConsoleStore } from '../stores/useConsoleStore.js';

let previousBlobUrls = [];

function revokePreviousBlobs() {
  for (const url of previousBlobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }
  }
  previousBlobUrls = [];
}

/**
 * Normalizes relative reference paths (e.g., './script.js', 'style.css', '/assets/logo.svg')
 * against the base HTML location (root).
 */
function resolvePath(refPath) {
  if (!refPath) return '';
  let clean = refPath.trim();
  // Strip query params or hash
  clean = clean.split('?')[0].split('#')[0];
  // Remove leading ./ or /
  return clean.replace(/^(\.\/|\/)+/, '');
}

export function buildPreviewHTML(nodes, buffers = {}, options = {}) {
  const { inlineAll = false } = options;

  // 1. Clean up old blob URLs (only when not inlining)
  if (!inlineAll) {
    revokePreviousBlobs();
  }
  const currentBlobs = [];

  // Helper to get effective file content (buffer if modified, else node content)
  function getEffectiveContent(node) {
    if (buffers[node.id] !== undefined) {
      return buffers[node.id];
    }
    return node.content || '';
  }

  // 2. Find entry index.html
  const indexNode = nodes.find((n) => n.name.toLowerCase() === 'index.html' && n.parentId === null) ||
    nodes.find((n) => n.name.toLowerCase() === 'index.html');

  if (!indexNode) {
    return {
      html: `<!DOCTYPE html>
<html>
<head><title>No index.html</title></head>
<body style="font-family:sans-serif;background:#1e1e1e;color:#f87171;padding:24px;">
  <h2>index.html Not Found</h2>
  <p>Create an <code>index.html</code> file in the root of your project to render live preview.</p>
</body>
</html>`,
      blobUrls: [],
    };
  }

  const rawHtml = getEffectiveContent(indexNode);

  // 3. Collect all JS and SVG files and generate Blob URLs
  const fileNodes = nodes.filter((n) => n.type === 'file');
  const jsFiles = fileNodes.filter((n) => n.name.toLowerCase().endsWith('.js'));
  const svgFiles = fileNodes.filter((n) => n.name.toLowerCase().endsWith('.svg'));
  const cssFiles = fileNodes.filter((n) => n.name.toLowerCase().endsWith('.css'));

  const importMap = { imports: {} };
  const jsBlobMap = {}; // nodeId -> blobUrl
  const svgBlobMap = {}; // nodeId -> blobUrl

  // Create JS Blobs and populate Import Map
  for (const js of jsFiles) {
    const code = getEffectiveContent(js);
    const relPath = buildNodePath(js.id, nodes).replace(/^\/+/, '');
    if (!inlineAll) {
      const blob = new Blob([code], { type: 'application/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      currentBlobs.push(url);

      // Map by id and by all path variants
      jsBlobMap[js.id] = url;
      importMap.imports[js.name] = url;
      importMap.imports[`./${js.name}`] = url;
      importMap.imports[`/${js.name}`] = url;
      if (relPath && relPath !== js.name) {
        importMap.imports[relPath] = url;
        importMap.imports[`./${relPath}`] = url;
        importMap.imports[`/${relPath}`] = url;
      }
    } else {
      jsBlobMap[js.id] = null;
    }
  }

  // Create SVG Blobs
  for (const svg of svgFiles) {
    const code = getEffectiveContent(svg);
    if (!inlineAll) {
      const blob = new Blob([code], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      currentBlobs.push(url);
      svgBlobMap[svg.id] = url;
    } else {
      svgBlobMap[svg.id] = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(code)}`;
    }
  }

  // 4. Parse the HTML using DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const missingFiles = [];

  // Inject Console Bootstrap Script as first item in <head>
  const bootstrapScript = doc.createElement('script');
  bootstrapScript.textContent = CONSOLE_BOOTSTRAP_SCRIPT;
  if (doc.head) {
    doc.head.insertBefore(bootstrapScript, doc.head.firstChild);
  } else {
    const head = doc.createElement('head');
    head.appendChild(bootstrapScript);
    doc.documentElement.insertBefore(head, doc.body);
  }

  // Inject Import Map for ES module imports (skip when inlining)
  if (!inlineAll && Object.keys(importMap.imports).length > 0) {
    const mapScript = doc.createElement('script');
    mapScript.type = 'importmap';
    mapScript.textContent = JSON.stringify(importMap, null, 2);
    doc.head.appendChild(mapScript);
  }

  // 5. Resolve CSS stylesheets: <link rel="stylesheet" href="...">
  const linkElements = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  for (const link of linkElements) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      continue; // External link, keep as is
    }

    const resolved = resolvePath(href);
    const targetCssNode = findNodeByPath(resolved, nodes);

    if (targetCssNode && targetCssNode.type === 'file') {
      const cssContent = getEffectiveContent(targetCssNode);
      const styleEl = doc.createElement('style');
      styleEl.setAttribute('data-href', href);
      styleEl.textContent = cssContent;
      link.parentNode.replaceChild(styleEl, link);
    } else {
      missingFiles.push(`Missing stylesheet: "${href}"`);
      // Replace with comment to prevent 404
      const comment = doc.createComment(` Missing stylesheet: ${href} `);
      link.parentNode.replaceChild(comment, link);
    }
  }

  // 6. Resolve Scripts: <script src="...">
  const scriptElements = Array.from(doc.querySelectorAll('script[src]'));
  for (const script of scriptElements) {
    const src = script.getAttribute('src');
    if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      continue; // External script, keep
    }

    const resolved = resolvePath(src);
    const targetJsNode = findNodeByPath(resolved, nodes);

    if (targetJsNode && targetJsNode.type === 'file') {
      if (inlineAll) {
        // Inline the script content directly
        const jsContent = getEffectiveContent(targetJsNode);
        script.removeAttribute('src');
        script.textContent = jsContent;
      } else {
        const blobUrl = jsBlobMap[targetJsNode.id];
        if (blobUrl) {
          script.setAttribute('src', blobUrl);
        }
      }
    } else {
      missingFiles.push(`Missing script: "${src}"`);
      const comment = doc.createComment(` Missing script: ${src} `);
      script.parentNode.replaceChild(comment, script);
    }
  }

  // 7. Resolve Images & SVGs: <img src="...">
  const imgElements = Array.from(doc.querySelectorAll('img[src]'));
  for (const img of imgElements) {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:')) {
      continue;
    }
    const resolved = resolvePath(src);
    const targetSvg = findNodeByPath(resolved, nodes);
    if (targetSvg && targetSvg.type === 'file') {
      const blobUrl = svgBlobMap[targetSvg.id];
      if (blobUrl) {
        img.setAttribute('src', blobUrl);
      }
    }
  }

  // 8. Log missing file warnings into Console Store
  if (missingFiles.length > 0) {
    const consoleStore = useConsoleStore.getState();
    missingFiles.forEach((msg) => {
      consoleStore.addLog({
        id: Math.random().toString(36).substring(2),
        level: 'warn',
        args: [`[Preview Builder] ${msg}`],
        timestamp: Date.now(),
        file: 'index.html',
        line: 1,
      });
    });
  }

  if (!inlineAll) {
    previousBlobUrls = currentBlobs;
  }
  const builtHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  return { html: builtHtml, blobUrls: currentBlobs };
}
