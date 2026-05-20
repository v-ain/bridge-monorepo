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

      return this._sendResponse(res, 200, notes, null);
    } catch (err) {
      // Перенаправляем в единый центр — он сам залогирует и отдаст 500
      return this._handleSystemError(res, err, null, '[GET /api/notes]');
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
        return this._sendResponse(res, 404, null, 'NOTE_NOT_FOUND');
      }

      return this._sendResponse(res, 200, note, null);

    } catch (err) {
      return this._handleSystemError(res, err, null, `[GET /api/notes/${id}]`);
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

      return this._sendResponse(res, 201, newNote, null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Явно кастим строку к типу AppErrorCode
        const errorCode = /** @type {import('@bridge-monorepo/shared').AppErrorCode} */ (
          error.issues?.[0]?.message || 'VALIDATION_ERROR'
        ); return this._sendResponse(res, 400, null, errorCode)
      }

      // Все остальные системные ошибки отправляем в наш новый обработчик
      return this._handleSystemError(res, error, req, '[POST /api/notes]');

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
        return this._sendResponse(res, 404, null, 'NOTE_NOT_FOUND');
      }

      return this._sendResponse(res, 200, updatedNote, null);

    } catch (error) {

      if (error instanceof z.ZodError) {
        const errorCode = /** @type {import('@bridge-monorepo/shared').AppErrorCode} */ (
          error.issues?.[0]?.message || 'VALIDATION_ERROR'
        );
        return this._sendResponse(res, 400, null, errorCode);
      }

      // Все остальные системные сбои (JSON, Payload, 500) отправляем в центральный обработчик
      return this._handleSystemError(res, error, null, `[PATCH /api/notes/${id}]`);

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
        return this._sendResponse(res, 404, null, 'NOTE_NOT_FOUND');
      }

      // Успешное удаление. Обычно возвращают либо { id }, либо статус 204 No Content.
      return this._sendResponse(res, 200, result, null);

    } catch (error) {

      return this._handleSystemError(res, error, null, `[DELETE /api/notes/${id}]`);

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
   * Универсальный метод отправки ответа.
   * Строго следует контракту ApiResponse<T> из shared.
   * 
   * @template T
   * @param {import('node:http').ServerResponse} res
   * @param {number} status - HTTP статус (201, 200, 400, 413, 500)
   * @param {T | null} data - Данные для успешного ответа (null при ошибке)
   * @param {import('@bridge-monorepo/shared').AppErrorCode | null} error - Код ошибки (null при успехе)
   * @param {import('node:http').IncomingMessage} [req] - Для экстренного закрытия соединения (413)
   */
  _sendResponse(res, status, data, error, req = null) {
    /** @type {import('@bridge-monorepo/shared').ApiResponse<T>} */
    const response = error
      ? { data: null, error: error }
      : { data: /** @type {T} */ (data), error: null };

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));

    if (status === 413 && req) {
      req.destroy();
    }
  }

  /**
   * Централизованный обработчик старых текстовых ошибок для блоков catch.
   * Принимает сырую ошибку и мапит её на строгие коды AppErrorCode.
   * 
   * @param {import('node:http').ServerResponse} res
   * @param {any} error
   * @param {import('node:http').IncomingMessage | null} req
   * @param {string} contextInfo
   */
  _handleSystemError(res, error, req, contextInfo) {
    if (error.message && error.message.includes('Invalid JSON')) {
      return this._sendResponse(res, 400, null, 'INVALID_JSON_FORMAT');
    }

    if (error.message === 'Payload Too Large' || error.status === 413) {
      return this._sendResponse(res, 413, null, 'PAYLOAD_TOO_LARGE', req);
    }

    // Любой другой форс-мажор (упала база данных, файловая система и т.д.)
    console.error(`[SERVER ERROR] ${contextInfo}:`, error);
    return this._sendResponse(res, 500, null, 'INTERNAL_SERVER_ERROR');
  }
}
