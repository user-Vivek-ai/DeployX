import { ProjectFile } from './types';

export class PreviewRuntime {
  /**
   * Bundles virtual project files into a standalone sandboxed HTML document
   */
  public static compileToSrcDoc(files: ProjectFile[]): string {
    const htmlFile = files.find(f => f.path === 'index.html' || f.path.endsWith('.html'));
    const cssFile = files.find(f => f.path === 'styles.css' || f.path.endsWith('.css'));
    const jsFile = files.find(f => f.path === 'app.js' || f.path.endsWith('.js'));

    if (!htmlFile) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 flex items-center justify-center min-h-screen p-6 font-sans">
  <div class="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
    <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
      📄
    </div>
    <h2 class="text-xl font-bold text-slate-800">No HTML Entrypoint Found</h2>
    <p class="text-slate-500 text-sm mt-2">DeployX requires an index.html file to mount the live preview.</p>
  </div>
</body>
</html>`;
    }

    let html = htmlFile.content;

    // Inject Error Bridge & Console logger
    const errorBridgeScript = `
<script>
  window.addEventListener('error', function(e) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DEPLOYX_RUNTIME_ERROR',
        payload: {
          message: e.message || 'Script error',
          filename: e.filename || 'app.js',
          lineno: e.lineno || 0,
          colno: e.colno || 0
        }
      }, '*');
    }
  });

  // Capture console logs
  const _origLog = console.log;
  console.log = function(...args) {
    _origLog.apply(console, args);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'DEPLOYX_RUNTIME_LOG',
        payload: { message: args.join(' ') }
      }, '*');
    }
  };
</script>
`;

    // Inject styles.css if present
    if (cssFile) {
      const styleTag = `<style id="deployx-custom-styles">\n${cssFile.content}\n</style>`;
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleTag}\n${errorBridgeScript}\n</head>`);
      } else {
        html = `${styleTag}\n${errorBridgeScript}\n${html}`;
      }
    } else {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${errorBridgeScript}\n</head>`);
      }
    }

    // Inject app.js if present
    if (jsFile) {
      const scriptTag = `<script id="deployx-custom-script">\n${jsFile.content}\n</script>`;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        html = `${html}\n${scriptTag}`;
      }
    }

    return html;
  }
}
