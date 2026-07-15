import { handleAuth } from './handlers/auth.js';
import { BlogController } from './src/controllers/BlogController.js';
import { NoteController_v2 } from './src/controllers/note_controller.v2.js';
import { NoteController } from './src/controllers/NoteControllers.js';
import { BlogService } from './src/services/BlogService.js';
import { NoteService_v2 } from './src/services/note_service.v2.js';
import { NoteService } from './src/services/NoteService.js';

const noteService = new NoteService();
const noteController = new NoteController(noteService);

const blogService = new BlogService();
const blogContoller = new BlogController(blogService);

const noteService_v2 = new NoteService_v2();
const noteController_v2 = new NoteController_v2(noteService_v2);
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
  'POST /api/notes': noteController.createNoteHandler,
  'GET /api/notes': noteController.getAllNotesHandler,
  'GET /blog': blogContoller.getBlogData,
  'GET /api/v2/notes': noteController_v2.getAllNotesHandler,
  'POST /api/v2/notes': noteController_v2.createNoteHandler,
};

// ========== ДИНАМИЧЕСКИЕ МАРШРУТЫ (пока пустые) ==========
export const dynamicRoutes = [
  { method: 'GET', pattern: /^\/api\/notes\/(.+)$/, handler: noteController.getNoteByIdHandler },
  { method: 'DELETE', pattern: /^\/api\/notes\/(.+)$/, handler: noteController.deleteNoteHandler },
  { method: 'PATCH', pattern: /^\/api\/notes\/([a-zA-Z0-9-]+)$/, handler: noteController.updateNoteHandler },
  { method: 'GET', pattern: /^\/api\/v2\/notes\/(.+)$/, handler: noteController_v2.getNoteByIdHandler },
  { method: 'PATCH', pattern: /^\/api\/v2\/notes\/(.+)$/, handler: noteController_v2.updateNoteHandler },
  { method: 'DELETE', pattern: /^\/api\/v2\/notes\/(.+)$/, handler: noteController_v2.deleteNoteHandler },
];

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
