import http from 'http';
import { setCorsHeaders, handlePreflight } from './cors.js';
import { setSecurityHeaders, handlePrefetch } from './security.js';
import { findRoute } from './routes.js';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(import.meta.dirname, '../.env');

if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
    console.log('Environment variables successfully loaded from the monorepo root');
  } catch (err) {
    console.warn('Error reading .env file, using default settings');
  }
} else {
  console.log('.env file not found in root, server starting on default ports');
}

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

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
