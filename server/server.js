import http from 'http';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-совместимый __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ПРОВЕРКА SHARED ТИПОВ
/** @type {import('@bridge-monorepo/shared').User} */
const testUser = {
  id: "1",
  name: 'Test',
  email: 'test@example.com',
  role: 'superadmin'
};
console.log('✅ Shared types loaded!');
console.log('Test user:', testUser);

const DEBUG = process.env.DEBUG === 'true';
// 1. ПРЕДУСТАНОВКИ БЕЗОПАСНОСТИ
// Хеш пароля (в реале бери из БД или .env). Соль обязательна!
const EXPECTED_HASH = crypto.scryptSync('твой_секрет_2026', 'static_salt', 64);

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};
// Хелпер для "бронирования" ответа
const setSecurityHeaders = (res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Чистая Нода и так не шлет X-Powered-By, но мы на страже
};

// 2. ОБРАБОТЧИКИ (Handlers)
const NOTES_PATH = path.join(__dirname, 'data', 'notes.json');
const MAX_SIZE = 1 * 1024 * 1024; // 1 Мегабайт

const handleSaveNote = async (req, res) => {
  let bodyChunks = [];
  let currentSize = 0;

  req.on('data', chunk => {
    currentSize += chunk.length;
    // ЖЕСТКАЯ ПРОВЕРКА: Если данных слишком много — обрываем соединение
    if (currentSize > MAX_SIZE) {
      console.error('!!! Попытка переполнения памяти (DoS) !!!');
      res.statusCode = 413;; // Payload Too Large
      res.end('Payload Too Large');
      return req.destroy(); // Обрываем сокет физически
    }
    bodyChunks.push(chunk);
  });

  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyChunks);

    try {
      // Превращаем буфер в строку только в момент парсинга
      const noteContent = rawBody.toString('utf-8');
      const newNote = {
        id: Date.now(),
        content: noteContent,
        device: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString()
      };

      // Читаем текущую базу (если файла нет - создаем пустой массив)
      let notes = [];
      try {
        const data = await fs.readFile(NOTES_PATH, 'utf-8');
        notes = JSON.parse(data);
      } catch (e) { /* Файл еще не создан */ }

      notes.push(newNote);

      // Записываем обновленный список
      await fs.writeFile(NOTES_PATH, JSON.stringify(notes, null, 2), 'utf-8');

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Saved successfully', id: newNote.id }));

    } catch (err) {
      res.writeHead(400);
      res.end('Ошибка формата данных');
    } finally {
      // ФИНАЛЬНЫЙ ШТРИХ: Стираем сырые данные из памяти (Spectre-safe!)
      rawBody.fill(0);
      console.log(`[${new Date().toLocaleTimeString()}] Заметка сохранена (${currentSize} байт)`);
    }
  });
};


const handleAuth = (req, res) => {
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', () => {
    // Собираем в Buffer (не в строку!), чтобы не мусорить в Heap
    const rawBody = Buffer.concat(bodyChunks);

    try {
      const inputHash = crypto.scryptSync(rawBody, 'static_salt', 64);
      // Сравнение за фиксированное время (защита от Timing Attack)
      const isMatch = crypto.timingSafeEqual(inputHash, EXPECTED_HASH);

      if (isMatch) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('🔓 Доступ разрешен. Добро пожаловать в крепость!');
      } else {
        res.writeHead(401);
        res.end('🚫 Ошибка доступа');
      }
    } finally {
      // ФИЗИЧЕСКОЕ ЗАТИРАНИЕ ПАМЯТИ (Spectre mitigation)
      rawBody.fill(0);
      console.log('--- Секрет затерт в RAM ---');
    }
  });
};

// 3. КАРТА МАРШРУТОВ (Routing)
const routes = {
  'GET /': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Node Bridge</h1><p>Сервер готов к работе.</p>');
  },
  'POST /auth': handleAuth,
  'GET /status': (req, res) => {
    res.writeHead(200);
    res.end('System OK');
  },
    // Заглушка для иконки — возвращаем 204 (No Content)
  'GET /favicon.ico': (req, res) => {
    res.writeHead(204);
    res.end();
  },

  'POST /notes': handleSaveNote
};

// 4. ЯДРО СЕРВЕРА
const server = http.createServer((req, res) => {

  if (DEBUG) {
  // Выводим ВСЕ заголовки, чтобы поймать хитреца
  console.log('--- DEBUG INFO ---');
  console.log(`URL: ${req.url}`);
  console.log(`Заголовки:`, req.headers);
  }

  // FILTER: SPECTRE PREFETCH
  const purpose = req.headers['sec-purpose'] || '';
  // Универсальный перехват спекуляций (Spectre-style браузера)
  if (purpose.includes('prefetch') || purpose.includes('prerender')) {
    res.writeHead(204);
    return res.end();
  }

  // 2. CORS (добавить эту секцию)
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // SECURITY HEADERS
  setSecurityHeaders(res);

  console.log(`[${new Date().toLocaleTimeString()}] Вход: ${req.method} ${req.url}`);

  const routeKey = `${req.method} ${req.url}`;
  const handler = routes[routeKey];

  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404);
    res.end('404: Not Found');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('\x1b[32m%s\x1b[0m', '🛡️  Spectre-Safe Server started on port 3000');
});
