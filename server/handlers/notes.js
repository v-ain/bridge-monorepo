import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_PATH = path.join(__dirname, '..', 'data', 'notes.json');
const MAX_SIZE = 1 * 1024 * 1024;

/** @typedef {import('@bridge-monorepo/shared').CreateNoteDto} CreateNoteDto */
/** @typedef {import('@bridge-monorepo/shared').NoteResponse} NoteResponse */
/** @typedef {import('@bridge-monorepo/shared').Note} Note */
/** @typedef {import('@bridge-monorepo/shared').CreateNoteDto} UpdateNoteDto */

// GET /notes
export const handleGetNotes = async (req, res) => {
  try {
    const data = await fs.readFile(NOTES_PATH, 'utf-8');

    /** @type {Note[]} */
    const notes = JSON.parse(data);
    const MAX_PREVIEW_LENGTH = 100;

    /** @type {NoteResponse[]} */
    const previewNotes = notes.map(note => {
      let content = note.content;

      if (content.length > MAX_PREVIEW_LENGTH) {
        // Режем до лимита и ищем последний пробел
        const chunk = content.slice(0, MAX_PREVIEW_LENGTH);
        const match = chunk.match(/(.+)\s/s);

        // Если нашли пробел — берем группу [1], если нет (одно длинное слово) — режем жестко
        content = match ? match[1].trimEnd() + '...' : chunk + '...';
      }

      const { device, ...rest } = note;
      // Если длина меньше лимита, условие не выполнится и вернется оригинал
      return { ...rest, content };
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(previewNotes));
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
  }
};

// GET /notes/:id — получить одну заметку
export const handleGetNoteById = async (req, res, id) => {
  // 1. Простая проверка: если ID пустой (на случай кривого роутинга)
  if (!id || typeof id !== 'string') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid note ID' }));
    return;
  }

  try {
    const data = await fs.readFile(NOTES_PATH, 'utf-8');

    /** @type {Note[]} */
    const notes = JSON.parse(data);
    const note = notes.find(note => note.id === id);

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
      /** @type {CreateNoteDto} */
      const noteContent = JSON.parse(rawBody.toString('utf-8'));

      /** @type {Note} */
      const newNote = {
        id: randomUUID(),
        content: noteContent.content,
        timestamp: new Date().toISOString(),
        device: req.headers['user-agent'] || 'unknown',
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

      const MAX_PREVIEW_LENGTH = 100;
      let previewContent = newNote.content;

      if (previewContent.length > MAX_PREVIEW_LENGTH) {
        const chunk = previewContent.slice(0, MAX_PREVIEW_LENGTH);
        const match = chunk.match(/(.+)\s/s);
        previewContent = match ? match[1].trimEnd() + '...' : chunk + '...';
      }

      const responseNote = {
        id: newNote.id,
        content: previewContent,
        timestamp: newNote.timestamp
      };

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseNote));

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

// DELETE /notes/:id
export const handleDeleteNote = async (req, res, id) => {

  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Note ID is required' }));
    return;
  }

  try {
    const data = await fs.readFile(NOTES_PATH, 'utf-8');

    /** @type {Note[]} */
    let notes = JSON.parse(data);
    const filtered = notes.filter(note => note.id !== id);

    if (notes.length === filtered.length) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Note not found' }));
      return;
    }

    await fs.writeFile(NOTES_PATH, JSON.stringify(filtered, null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    // Возвращаем id удаленной заметки (полезно для фронтенда, чтобы убрать из стейта)
    res.end(JSON.stringify({ message: 'Deleted successfully', id: id }));
  } catch (e) {
    console.error('Delete error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  }
};

// PATCH /notes/:id
export const handleUpdateNote = async (req, res, id) => {
  if (!id) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Note ID is required' }));
    return;
  }

  let body = '';

  try {
    // 1. Читаем тело запроса
    for await (const chunk of req) {
      body += chunk;
    }

    /** @type {UpdateNoteDto} */
    const parsedBody = JSON.parse(body);

    if (!parsedBody.content) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Content is required' }));
      return;
    }

    // 2. Читаем файл с диска
    const data = await fs.readFile(NOTES_PATH, 'utf-8');
    /** @type {Note[]} */
    const notes = JSON.parse(data);

    // 3. Ищем индекс нужной заметки
    const index = notes.findIndex(n => n.id === id);

    if (index === -1) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Note not found' }));
      return;
    }

    // 4. Обновляем заметку (сохраняем старый id, но меняем контент и дату)
    const updatedNote = {
      ...notes[index],           // копируем всё старое (id, device и т.д.)
      content: parsedBody.content, // обновляем текст
      timestamp: new Date().toISOString() // обновляем время правки
    };

    notes[index] = updatedNote;

    // 5. Записываем обратно в файл
    await fs.writeFile(NOTES_PATH, JSON.stringify(notes, null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(updatedNote));

  } catch (e) {
    console.error('Update error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error' }));
  }
};
