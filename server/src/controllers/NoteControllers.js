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


  /**
   * GET /api/notes
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   */
  getAllNotesHandler = async (req, res) => {
    try {
      const notes = await this.noteService.getAll();

      return this._sendResponse(res, 200, notes);
    } catch (err) {
      console.error(`[SERVER ERROR] [GET /api/notes]:`, err);

      return this._sendResponse(res, 500, { error: 'INTERNAL_SERVER_ERROR' });
    }
  }

  /**
   * GET /api/notes:id
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} id
   */
  getNoteByIdHandler = async (req, res, id) => {
    try {
      const note = await this.noteService.getById(id);

      if (!note) {
        return this._sendResponse(res, 404, { error: 'NOTE_NOT_FOUND' });
      }

      return this._sendResponse(res, 200, note);

    } catch (err) {
      console.error(`[SERVER ERROR] [GET /api/notes/:id]:`, err);
      this._sendResponse(res, 500, { error: 'INTERNAL_SERVER_ERROR' })
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
  updateNoteHandler = async (req, res, id) => {
    let requestSize = 0;

    try {

      const { data, size } = await this._parseRequestBody(req);
      requestSize = size;

      const { title } = NoteInputSchema.parse(data);

      const updatedNote = await this.noteService.update(id, title);

      if (!updatedNote) {
        return this._sendResponse(res, 404, { error: 'NOTE_NOT_FOUND' });
      }

      return this._sendResponse(res, 200, updatedNote);

    } catch (error) {

      if (error instanceof z.ZodError) {
        const errorCode = error.issues?.[0]?.message || 'VALIDATION_ERROR';
        return this._sendResponse(res, 400, { error: errorCode });
      }

      if (error.message?.includes('Invalid JSON')) {
        return this._sendResponse(res, 400, { error: 'INVALID_JSON_FORMAT' });
      }

      if (error.message === 'Payload Too Large' || error.status === 413) {
        return this._sendResponse(res, 413, { error: 'PAYLOAD_TOO_LARGE' }, req);
      }

      console.error(`[SERVER ERROR] [PATCH /api/notes/:id]:`, error);
      return this._sendResponse(res, 500, { error: 'INTERNAL_SERVER_ERROR' });

    } finally {
      // Лог сработает ВСЕГДА и зафиксирует реальный размер обработанных байт
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] Note [${id}] UPDATED (${requestSize} bytes)`);
    }
  }


  /**
   * DELETE /api/notes/:id
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} id
   */
  deleteNoteHandler = async (req, res, id) => {
    try {
      const result = await this.noteService.delete(id);

      if (!result) {
        return this._sendResponse(res, 404, { error: 'NOTE_NOT_FOUND' });
      }

      // Успешное удаление. Обычно возвращают либо { id }, либо статус 204 No Content.
      return this._sendResponse(res, 200, result);

    } catch (error) {
      console.error(`[SERVER ERROR] [DELETE /api/notes/:id]:`, error);
      return this._sendResponse(res, 500, { error: 'INTERNAL_SERVER_ERROR' });

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
      // TODO: Убрать @ts-ignore в следующем спринте после типизации NoteService
      // @ts-ignore
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
