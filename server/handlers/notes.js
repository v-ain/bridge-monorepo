import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_PATH = path.join(__dirname, '..', 'data', 'notes.json');
const MAX_SIZE = 1 * 1024 * 1024;

// GET /notes
export const handleGetNotes = async (req, res) => {
  try {
    const data = await fs.readFile(NOTES_PATH, 'utf-8');
    const notes = JSON.parse(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(notes));
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
  }
};

// GET /notes/:id — получить одну заметку
export const handleGetNoteById = async (req, res, id) => {
  const noteId = parseInt(id, 10);
  if (isNaN(noteId)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid note ID' }));
    return;
  }

  try {
    const data = await fs.readFile(NOTES_PATH, 'utf-8');
    const notes = JSON.parse(data);
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Note not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(note));
  } catch (e) {
    console.error('Get note by ID error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  }
};

// POST /notes
export const handleSaveNote = async (req, res) => {
  let bodyChunks = [];
  let currentSize = 0;

  req.on('data', chunk => {
    currentSize += chunk.length;
    if (currentSize > MAX_SIZE) {
      console.error('!!! DoS attempt detected !!!');
      res.statusCode = 413;; // Payload Too Large
      res.end('Payload Too Large');
      req.destroy();
      return;
    }
    bodyChunks.push(chunk);
  });

  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyChunks);

    try {
      // Превращаем буфер в строку только в момент парсинга
      const noteContent = rawBody.toString('utf-8');

      // ПРОВЕРКА SHARED ТИПОВ
      /** @type {import('@bridge-monorepo/shared').Note} */
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
      res.end('Invalid data format');
    } finally {
      // ФИНАЛЬНЫЙ ШТРИХ: Стираем сырые данные из памяти (Spectre-safe!)
      rawBody.fill(0);
      console.log(`[${new Date().toLocaleTimeString()}] Note saved (${currentSize} bytes)`);
    }
  });
};

// DELETE /notes/:id (заготовка)
export const handleDeleteNote = async (req, res, id) => {
  res.writeHead(501);
  res.end(JSON.stringify({ error: 'Not implemented yet' }));
};
