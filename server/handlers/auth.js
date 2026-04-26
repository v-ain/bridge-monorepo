import crypto from 'crypto';

const EXPECTED_HASH = crypto.scryptSync('твой_секрет_2026', 'static_salt', 64);

export const handleAuth = (req, res) => {
  let bodyChunks = [];

  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', () => {
    const rawBody = Buffer.concat(bodyChunks);
    try {
      const inputHash = crypto.scryptSync(rawBody, 'static_salt', 64);
      const isMatch = crypto.timingSafeEqual(inputHash, EXPECTED_HASH);

      if (isMatch) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('🔓 Доступ разрешен!');
      } else {
        res.writeHead(401);
        res.end('🚫 Ошибка доступа!');
      }
    } finally {
      rawBody.fill(0);
      console.log('--- Секрет затерт в RAM ---');
    }
  });
};
