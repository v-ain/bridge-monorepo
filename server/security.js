// server/security.js
/**
 * Устанавливает security headers для защиты от атак
 * @param {import('http').ServerResponse} res
 */
export const setSecurityHeaders = (res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('X-Content-Type-Options', 'nosniff');
};

/**
 * Проверяет prefetch/prerender запросы (Spectre защита)
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {boolean} true если запрос обработан
 */
export const handlePrefetch = (req, res) => {
  const purpose = req.headers['sec-purpose'] || '';
  if (purpose.includes('prefetch') || purpose.includes('prerender')) {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
};
