let prettierPromise = null;

async function loadPrettier() {
  if (!prettierPromise) {
    prettierPromise = Promise.all([
      import('prettier/standalone'),
      import('prettier/plugins/html'),
      import('prettier/plugins/postcss'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree'),
      import('prettier/plugins/markdown'),
    ]).then(([prettier, htmlPlugin, postcssPlugin, babelPlugin, estreePlugin, markdownPlugin]) => {
      return {
        format: prettier.format,
        plugins: [
          htmlPlugin.default || htmlPlugin,
          postcssPlugin.default || postcssPlugin,
          babelPlugin.default || babelPlugin,
          estreePlugin.default || estreePlugin,
          markdownPlugin.default || markdownPlugin,
        ],
      };
    });
  }
  return prettierPromise;
}

export async function formatCode(code, language) {
  const { format, plugins } = await loadPrettier();
  
  let parser = null;
  switch (language) {
    case 'html':
      parser = 'html';
      break;
    case 'css':
      parser = 'css';
      break;
    case 'javascript':
    case 'js':
      parser = 'babel';
      break;
    case 'json':
      parser = 'json';
      break;
    case 'markdown':
    case 'md':
      parser = 'markdown';
      break;
    default:
      return code; // Unsupported format, return as is
  }

  try {
    const formatted = await format(code, {
      parser,
      plugins,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      bracketSpacing: true,
      arrowParens: 'avoid',
    });
    return formatted;
  } catch (err) {
    console.warn('[Prettier] Formatting failed:', err);
    throw err;
  }
}
