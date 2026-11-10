/**
 * Script injected into the preview iframe to intercept console output,
 * runtime errors, and unhandled promise rejections, forwarding them
 * to the parent CodeCanvas window via postMessage.
 */
export const CONSOLE_BOOTSTRAP_SCRIPT = `
(function() {
  function serializeArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'function') return arg.toString();
    if (arg instanceof Error) {
      return {
        message: arg.message,
        stack: arg.stack,
        name: arg.name
      };
    }
    if (typeof arg === 'object') {
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch (e) {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  }

  function parseErrorLocation(stack) {
    if (!stack || typeof stack !== 'string') return null;
    const lines = stack.split('\\n');
    for (const line of lines) {
      // Match file:line:col or blob:...:line:col
      const match = line.match(/(?:blob:[^:]+|[^\\s()]+):(\\d+):(\\d+)/);
      if (match) {
        return {
          line: parseInt(match[1], 10),
          column: parseInt(match[2], 10)
        };
      }
    }
    return null;
  }

  function sendToParent(level, args, stack, file, line, col) {
    try {
      const serialized = args.map(serializeArg);
      window.parent.postMessage({
        type: 'CODECANVAS_CONSOLE',
        payload: {
          id: Math.random().toString(36).substring(2) + Date.now(),
          level: level,
          args: serialized,
          timestamp: Date.now(),
          stack: stack || null,
          file: file || null,
          line: line || null,
          column: col || null
        }
      }, '*');
    } catch (err) {
      // Fallback
    }
  }

  // Intercept console methods
  const methods = ['log', 'info', 'warn', 'error', 'debug'];
  methods.forEach(function(m) {
    const original = console[m];
    console[m] = function() {
      const args = Array.prototype.slice.call(arguments);
      sendToParent(m, args);
      if (original) {
        original.apply(console, arguments);
      }
    };
  });

  // Intercept uncaught errors
  window.addEventListener('error', function(e) {
    const loc = parseErrorLocation(e.error ? e.error.stack : '');
    sendToParent('error', [e.message || 'Script error'], e.error ? e.error.stack : null, e.filename, loc ? loc.line : e.lineno, loc ? loc.column : e.colno);
  });

  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    const reason = e.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : null;
    const loc = parseErrorLocation(stack);
    sendToParent('error', ['Unhandled Promise Rejection: ' + msg], stack, null, loc ? loc.line : null, loc ? loc.column : null);
  });
})();
`;
