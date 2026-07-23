/**
 * @typedef {import('@bridge-monorepo/shared').INoteServiceV2} INoteService
 */

import {
  NoteIdParamDtoSchema,
  CreateNoteDtoSchema,
  NoteResponseDtoSchema,
  UpdateNoteDtoSchema,
  z,
} from '@bridge-monorepo/shared';

export class NoteController_v2 {
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
      const domainNotes = await this.noteService.getAll();

      const responsePayload = domainNotes.map((note) => ({
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      }));

      const NotesArraySchema = z.array(NoteResponseDtoSchema);
      const validatedData = NotesArraySchema.parse(responsePayload);
      return this._sendResponse(res, 200, validatedData, null);
    } catch (err) {
      return this._handleSystemError(res, err, null, '[GET /api/notes]');
    }
  };

  /**
   * GET /api/notes:id
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} id
   */
  getNoteByIdHandler = async (req, res, id) => {
    try {
      const idValidation = NoteIdParamDtoSchema.safeParse({ id });
      if (!idValidation.success) {
        return this._sendResponse(res, 400, null, 'INVALID_ID_FORMAT');
      }
      const domainNote = await this.noteService.getById(idValidation.data.id);

      if (!domainNote) {
        return this._sendResponse(res, 404, null, 'NOTE_NOT_FOUND');
      }

      const responsePayload = {
        ...domainNote,
        createdAt: domainNote.createdAt.toISOString(),
        updatedAt: domainNote.updatedAt.toISOString(),
      };
      return this._sendResponse(res, 200, NoteResponseDtoSchema.parse(responsePayload), null);
    } catch (err) {
      return this._handleSystemError(res, err, null, `[GET /api/notes/${id}]`);
    }
  };

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

      const bodyValidation = CreateNoteDtoSchema.safeParse(data);

      if (!bodyValidation.success) {
        // 1. Извлекаем первую ошибку из массива (он гарантированно существует, если success === false)
        const [firstIssue] = bodyValidation.error.issues;

        // 2. Берем сообщение или ставим фоллбек, сразу приводя к типу AppErrorCode через JSDoc
        /** @type {import('@bridge-monorepo/shared').AppErrorCode} */
        const errorCode = /** @type {any} */ (firstIssue?.message) || 'VALIDATION_ERROR';
        return this._sendResponse(res, 400, null, errorCode);
      }

      const createdDomainNote = await this.noteService.create(bodyValidation.data);
      createdNoteId = createdDomainNote.id;

      const formattedNote = {
        ...createdDomainNote,
        createdAt: createdDomainNote.createdAt.toISOString(),
        updatedAt: createdDomainNote.updatedAt.toISOString(),
      };
      const responseDto = NoteResponseDtoSchema.parse(formattedNote);
      return this._sendResponse(res, 201, responseDto, null);
    } catch (error) {
      // Все остальные системные ошибки отправляем в наш новый обработчик
      return this._handleSystemError(res, error, req, '[POST /api/notes]');
    } finally {
      // Выполнится в любом случае (и в случае успеха, и после ошибки)
      const time = new Date().toLocaleTimeString();
      console.info(`[${time}] Note [${createdNoteId}] processed (${requestSize} bytes)`);
    }
  };

  /**
   * PATCH /api/notes/:id
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} id
   */
  updateNoteHandler = async (req, res, id) => {
    let requestSize = 0;

    try {
      const idValidation = NoteIdParamDtoSchema.safeParse({ id });
      if (!idValidation.success) {
        return this._sendResponse(res, 400, null, 'INVALID_ID_FORMAT');
      }
      const { data, size } = await this._parseRequestBody(req);
      requestSize = size;

      const bodyValidation = UpdateNoteDtoSchema.safeParse(data);
      // 2. Если валидация провалена — вытаскиваем первую ошибку через деструктуризацию .issues
      if (!bodyValidation.success) {
        const [firstIssue] = bodyValidation.error.issues;

        /** @type {import('@bridge-monorepo/shared').AppErrorCode} */
        const errorCode = /** @type {any} */ (firstIssue?.message) || 'VALIDATION_ERROR';

        return this._sendResponse(res, 400, null, errorCode);
      }

      const updatedDomainNote = await this.noteService.update(idValidation.data.id, bodyValidation.data);
      if (!updatedDomainNote) {
        return this._sendResponse(res, 404, null, 'NOTE_NOT_FOUND');
      }

      const responsePayload = {
        ...updatedDomainNote,
        createdAt: updatedDomainNote.createdAt.toISOString(),
        updatedAt: updatedDomainNote.updatedAt.toISOString(),
      };
      const responseDto = NoteResponseDtoSchema.parse(responsePayload);

      return this._sendResponse(res, 200, responseDto, null);
    } catch (error) {
      // Все остальные системные сбои (JSON, Payload, 500) отправляем в центральный обработчик
      return this._handleSystemError(res, error, null, `[PATCH /api/notes/${id}]`);
    } finally {
      // Лог сработает ВСЕГДА и зафиксирует реальный размер обработанных байт
      const time = new Date().toLocaleTimeString();
      console.info(`[${time}] Note [${id}] UPDATED (${requestSize} bytes)`);
    }
  };

  /**
   * DELETE /api/notes/:id
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {string} id
   */
  deleteNoteHandler = async (req, res, id) => {
    try {
      const idValidation = NoteIdParamDtoSchema.safeParse({ id });
      if (!idValidation.success) {
        return this._sendResponse(res, 400, null, 'INVALID_ID_FORMAT');
      }
      const isDeleted = await this.noteService.delete(idValidation.data.id);

      if (!isDeleted) {
        return this._sendResponse(res, 404, null, 'NOTE_NOT_FOUND');
      }

      // Успешное удаление. Обычно возвращают либо { id }, либо статус 204 No Content.
      return this._sendResponse(res, 200, true, null);
    } catch (error) {
      return this._handleSystemError(res, error, null, `[DELETE /api/notes/${id}]`);
    } finally {
      console.info(`[${new Date().toLocaleTimeString()}] Note [${id}] DELETED`);
    }
  };

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
          /* eslint-disable-next-line */
        } catch (e) {
          reject(new Error('Invalid JSON format'));
        } finally {
          rawBody.fill(0);
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
    const response = error ? { data: null, error: error } : { data: /** @type {T} */ (data), error: null };

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

    if (error.message && error.message.includes('already exists')) {
      console.warn(`[CONFLICT] ${contextInfo}: Duplicate ID detected.`);
      return this._sendResponse(res, 409, null, 'DUPLICATE_ID');
    }

    // Любой другой форс-мажор (упала база данных, файловая система и т.д.)
    console.error(`[SERVER ERROR] ${contextInfo}:`, error);
    return this._sendResponse(res, 500, null, 'INTERNAL_SERVER_ERROR');
  }
}
