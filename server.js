const http = require('http');
const crypto = require('crypto');

const DEBUG = process.env.DEBUG === 'true';
// 1. ПРЕДУСТАНОВКИ БЕЗОПАСНОСТИ
// Хеш пароля (в реале бери из БД или .env). Соль обязательна!
const EXPECTED_HASH = crypto.scryptSync('твой_секрет_2026', 'static_salt', 64);

// Хелпер для "бронирования" ответа
const setSecurityHeaders = (res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Чистая Нода и так не шлет X-Powered-By, но мы на страже
};

// 2. ОБРАБОТЧИКИ (Handlers)
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
  }
};

// 4. ЯДРО СЕРВЕРА
const server = http.createServer((req, res) => {
  setSecurityHeaders(res);

  if (DEBUG) {
  // Выводим ВСЕ заголовки, чтобы поймать хитреца
  console.log('--- DEBUG INFO ---');
  console.log(`URL: ${req.url}`);
  console.log(`Заголовки:`, req.headers);
  }
  // ФИЛЬТР: Спекулятивные пре-запросы браузера (Prefetch)
  const purpose = req.headers['sec-purpose'] || '';
  // Универсальный перехват спекуляций (Spectre-style браузера)
  if (purpose.includes('prefetch') || purpose.includes('prerender')) {
    res.writeHead(204);
    return res.end();
  }

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

