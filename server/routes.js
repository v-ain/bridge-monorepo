import { handleGetNotes, handleSaveNote, handleDeleteNote } from './handlers/notes.js';
import { handleAuth } from './handlers/auth.js';

// ========== СТАТИЧЕСКИЕ МАРШРУТЫ ==========
const routes = {
  'GET /': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Node Bridge</h1><p>API: /notes, /status, /auth</p>');
  },
  'GET /status': (req, res) => {
    res.writeHead(200);
    res.end('System OK');
  },
  'GET /favicon.ico': (req, res) => {
    res.writeHead(204);
    res.end();
  },

  'POST /auth': handleAuth,
  'POST /notes': handleSaveNote,
  'GET /notes': handleGetNotes
};

// ========== ДИНАМИЧЕСКИЕ МАРШРУТЫ (пока пустые) ==========
export const dynamicRoutes = [];

// ========== ПОИСК МАРШРУТА ==========
export const findRoute = (method, pathname) => {
  // 1. Проверяем статические маршруты
  const staticKey = `${method} ${pathname}`;
  if (routes[staticKey]) {
    return { handler: routes[staticKey], params: null };
  }

  // 2. Проверяем динамические маршруты (пока пусто)
  for (const route of dynamicRoutes) {
    const match = route.pattern.exec(pathname);
    if (match && route.method === method) {
      return { handler: route.handler, params: match.slice(1) };
    }
  }

  return null;
};
