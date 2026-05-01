// server/cors.js
const CORS_ORIGIN = process.env.NODE_ENV === 'production'
  ? 'https://yourdomain.com'
  : 'http://192.168.0.101:3001';

/**
 * Устанавливает CORS заголовки
 * @param {import('http').ServerResponse} res
 */
export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

/**
 * Обрабатывает preflight (OPTIONS) запрос
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} true если запрос обработан
 */
export const handlePreflight = (req, res) => {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
};
