import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setCorsHeaders, handlePreflight } from './cors.js';
import { setSecurityHeaders, handlePrefetch } from './security.js';
import { findRoute } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEBUG = process.env.DEBUG === 'true';

// ========== SERVER ==========
const server = http.createServer(async (req, res) => {

  if (DEBUG) {
  console.log('--- DEBUG INFO ---');
  console.log(`URL: ${req.url}`);
  console.log(`Заголовки:`, req.headers);
  }

  // FILTER: SPECTRE PREFETCH
  if (handlePrefetch(req, res)) return;

  // 2. CORS HEADERS + PREFLIGHT
  setCorsHeaders(res);
  if (handlePreflight(req, res)) return;

  // SECURITY HEADERS
  setSecurityHeaders(res);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  console.log(`[${new Date().toLocaleTimeString()}] Вход: ${req.method} ${pathname}`);

  const route = findRoute(req.method, pathname);

  if (route) {
    if (route.params) {
      await route.handler(req, res, ...route.params);
    } else {
      await route.handler(req, res);
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404: Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(3000, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', '🛡️  Spectre-Safe Server started on port ${PORT}');
});
