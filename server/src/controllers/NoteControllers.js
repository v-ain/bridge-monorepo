/**
 * @typedef {import('@bridge-monorepo/shared').INoteService} INoteService
 */

import { NoteInputSchema, z } from '@bridge-monorepo/shared';


export class NoteController {
  /** @param {INoteService} noteService */
  constructor(noteService) {
    /** @type {INoteService} */
    this.noteService = noteService;
  }

  // GET /api/notes
  handleGetAll = async (req, res) => {
    try {
      const notes = await this.noteService.getAll();
      this._sendResponse(res, 200, notes);
    } catch (err) {
      this._sendResponse(res, 500, { error: err.message });
    }
  }

  // GET /notes/:id
  handleGetNoteById = async (req, res, id) => {
    // console.log('handler get note :' + id);
    try {
      const note = await this.noteService.getById(id);
      this._sendResponse(res, 200, note);
    } catch (err) {
      this._sendResponse(res, 500, { error: err.message })
    }
  }


  /**
   * POST /api/notes
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  createNoteHandler = async (req, res) => {
    let requestSize = 0; // Для доступа в блоке finally
    let createdNoteId = 'new'; // Заглушка, если заметка не создастся

    try {
      const { data, size } = await this._parseRequestBody(req);
      requestSize = size;

      const { title } = NoteInputSchema.parse(data)

      const newNote = await this.noteService.create(title);
      createdNoteId = newNote.id;

      return this._sendResponse(res, 201, newNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // .format() вернет объект, где для каждого поля будет массив его ошибок
        // Для нашего поля 'title' мы берем самую первую ошибку из массива
        //  const errorCode = error.format().text?._errors[0] || 'VALIDATION_ERROR';
        const errorCode = error.issues?.[0]?.message || 'VALIDATION_ERROR';

        return this._sendResponse(res, 400, errorCode)
      }

      if (error.message.includes('Invalid JSON')) {
        this._sendResponse(res, 400, { error: 'INVALID_JSON_FORMAT' })
      }

      if (error.message === 'Payload Too Large' || error.status === 413) {
        return this._sendResponse(res, 413, { error: 'PAYLOAD_TOO_LARGE' }, req);
      }

      // Любой другой форс-мажор (упала база данных, файловая система и т.д.)
      console.error(`[SERVER ERROR] [POST /api/notes]:`, error);
      return this._sendResponse(res, 500, { error: 'INTERNAL_SERVER_ERROR' });

    } finally {
      // Выполнится в любом случае (и в случае успеха, и после ошибки)
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] Note [${createdNoteId}] processed (${requestSize} bytes)`);
    }
  }

  /**
   * PATCH /api/notes/:id
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} id
   */
  handleUpdateNote = async (req, res, id) => {
    let requestSize = 0;

    // if (!id) {
    //   return this._sendResponse(res, 400, { error: 'ID is missing' });
    // }
    //

    try {

      const { data, size } = await this._parseRequestBody(req);
      requestSize = size;

      // Для PATCH мы проверяем наличие хотя бы одного поля для обновления
      // if (!id || !body.title) {
      //   return this._sendResponse(res, 400, { error: 'ID and Title are required for patch' });
      // }

      // Валидация на уровне контроллера (проверяем "форму" запроса)
      if (!data.title || typeof data.title !== 'string') {
        return this._sendResponse(res, 400, { error: 'Title is required and must be a string' });
      }

      // Вызываем сервис (который внутри использует маппер для обрезки)
      const updatedNote = await this.noteService.update(id, data.title);

      this._sendResponse(res, 200, updatedNote);
    } catch (err) {
      //const status = err.message.includes('not found') ? 404 : 500;
      let status = 500;
      if (err.message === 'Payload Too Large') status = 413;
      if (err.message.includes('not found')) status = 404;
      if (err.message.includes('Invalid JSON')) status = 400;

      this._sendResponse(res, status, { error: err.message }, req);
    } finally {
      console.log(`[${new Date().toLocaleTimeString()}] Note [${id}] UPDATED (${requestSize} bytes)`);
    }
  }


  // DELETE /api/notes/:id
  handleRemoveNote = async (req, res, id) => {
    // service.delete(id), ответил 204 No Content (или 200 OK).
    try {
      await this.noteService.delete(id);
      this._sendResponse(res, 200, { id, deleted: true })
    } catch (err) {
      const status = err.message.includes('not found') ? 404 : 500;
      this._sendResponse(res, status, { error: err.message });
    } finally {
      console.log(`[${new Date().toLocaleTimeString()}] Note [${id}] DELETED`);
    }
  }


  _parseRequestBody = (req) => {
    const MAX_BODY_SIZE = 1024 * 1024;

    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];

      req.on('data', (chunk) => {
        size += chunk.length;

        if (size > MAX_BODY_SIZE) {
          console.error('!!! DoS attempt detected !!!');
          // res.statusCode = 413;; // Payload Too Large
          // res.end('Payload Too Large');
          // req.destroy();

          reject(new Error('Payload Too Large'));
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        try {
          const data = JSON.parse(rawBody.toString('utf-8') || '{}');
          resolve({ data, size });
          // const bodyString = rawBody.toString('utf-8');
          // resolve(bodyString ? JSON.parse(bodyString) : {});
        } catch (e) {
          reject(new Error('Invalid JSON format'));
        } finally {
          rawBody.fill(0)
        }
      });

      req.on('error', (err) => reject(err));
    });
  };

  /**
  * Универсальный метод отправки ответа
  * @template T
  * @param {import('node:http').ServerResponse} res
  * @param {number} status
  * @param {T | {error: string}} payload
  * @param {import('node:http').IncomingMessage} [req] - Опционально для destroy
  */
  _sendResponse(res, status, payload, req = null) {
    const isError = status >= 400;

    /** @type {import('@bridge-monorepo/shared').ApiResponse<T>} */
    const response = {
      data: isError ? null : /** @type {T} */ (payload),
      error: isError
        ? (typeof payload === 'object' && payload !== null && 'error' in payload
          ? String(payload.error)
          : String(payload || 'Unknown Error'))
        : null,
    };

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    // res.end(JSON.stringify(payload));

    if (status === 413 && req) {
      req.destroy();
    }
  }
}
