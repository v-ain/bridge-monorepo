import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * @typedef {import('@bridge-monorepo/shared').NoteModel} NoteModel
 * @typedef {import('@bridge-monorepo/shared').INoteServiceV2} INoteService
 */

const envPath = process.env.NOTES_V3_PATH || './data/dev_notes_v3.json';
const NOTES_PATH = path.resolve(process.cwd(), envPath);

/**
 * NoteService_v2
 *
 * Реализация файлового хранилища с in-memory кэшем.
 * ВАЖНО: Данная реализация рассчитана на запуск в ОДНОМ процессе (single-instance).
 * Механизм защиты от гонок (_writeLock) работает только внутри памяти одного процесса.
 *
 * Для запуска в нескольких процессах (PM2 cluster, Kubernetes replicas) необходимо:
 * 1. Заменить слой хранения на СУБД (SQLite/PostgreSQL) с использованием транзакций.
 * ИЛИ
 * 2. Внедрить внешнюю блокировку файлов (proper-lockfile) и инвалидацию кэша по mtime.
 */
/**
 * @implements {INoteService}
 */
export class NoteService_v2 {
  constructor() {
    this._filePath = NOTES_PATH;
    /** @type {NoteModel[]} */
    this._notes = [];
    this._isLoaded = false;
    this._loadingPromise = null;
    this._writeLock = Promise.resolve();
  }

  async _loadData() {
    if (this._isLoaded) return;
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = (async () => {
      try {
        console.info(`[INFO] Reading the database: ${this._filePath}`);
        const data = await readFile(this._filePath, 'utf-8');

        // ЗАЩИТА: Если файл физически есть, но он пустой — это аномалия (битый файл)
        if (!data || data.trim() === '') {
          throw new Error('The database file is empty. Overwriting is not possible to avoid data loss.');
        }

        // Парсим JSON. Если он сломан — SyntaxError вылетит наружу и спасет файл.
        const rawEntities = JSON.parse(data);

        if (!Array.isArray(rawEntities)) {
          throw new Error('Critical error: Data in JSON file is not an array!');
        }

        // Маппинг типов (строки -> Date)
        this._notes = rawEntities.map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));

        this._isLoaded = true;
      } catch (err) {
        if (err.code === 'ENOENT') {
          // УДОБСТВО: Файла вообще нет? Это не ошибка, это первый запуск. Инициализируем пустой массив.
          console.info('[INFO] File not found, initializing empty state');
          this._notes = [];
          this._isLoaded = true;
        } else {
          // АВАРИЯ: Файл битый, пустой или заблокирован ОС.
          console.error(`\n[CRITICAL DB ERROR] [${new Date().toISOString()}] File reading failure!`);
          console.error(`Details: ${err.message}\n`);

          this._loadingPromise = null; // Сбрасываем обещание, чтобы система не зависла
          throw new Error('Database Corrupted or Inaccessible. Operation aborted.');
        }
      }
    })();

    return this._loadingPromise;
  }

  /**
   * Атомарная синхронизация с диском через очередь
   * @param {(currentNotes: NoteModel[]) => NoteModel[]} updateFn
   */
  async _sync(updateFn) {
    const tempPath = this._filePath + '.tmp';

    this._writeLock = this._writeLock.then(async () => {
      try {
        const nextNotes = updateFn(this._notes);

        await writeFile(tempPath, JSON.stringify(nextNotes, null, 2));
        await rename(tempPath, this._filePath); // Атомарная замена

        this._notes = nextNotes;
        this._isLoaded = true;
      } catch (err) {
        // При ошибке записи сбрасываем кэш, чтобы система перечитала данные с диска
        this._isLoaded = false;
        console.error('[ERROR] Error writing to file:', err.message);
        throw err;
      }
    });

    return this._writeLock;
  }

  /** @returns {Promise<NoteModel[]>} */
  async getAll() {
    await this._loadData();
    return [...this._notes];
  }

  /**
   * @param {string} id
   * @returns {Promise<NoteModel | null>}
   */
  async getById(id) {
    await this._loadData();
    const note = this._notes.find((n) => n.id === id);
    return note || null;
  }

  /**
   * @param {import('@bridge-monorepo/shared').CreateNoteDto} dtoNote
   * @returns {Promise<NoteModel>}
   */
  async create(dtoNote) {
    await this._loadData();

    // 1. Определяем ID. Если клиент не прислал — генерируем сами.
    const proposedId = dtoNote.id ? dtoNote.id : randomUUID();

    let createdNote = null;

    // 2. Встаем в очередь. Внутри этой функции currentNotes — это самые свежие данные.
    await this._sync((currentNotes) => {
      // 3. ПРОВЕРКА НА ДУБЛИКАТ (Критически важно!)
      const exists = currentNotes.some((note) => note.id === proposedId);

      if (exists) {
        // Выбрасываем ошибку прямо здесь. _sync перехватит её, откатит состояние и пробросит наверх.
        throw new Error(`Note with id '${proposedId}' already exists.`);
      }

      // 4. Создаем объект заметки
      createdNote = {
        id: proposedId,
        title: dtoNote.title,
        content: dtoNote.content || '',
        tags: dtoNote.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 5. Возвращаем новый массив с добавленной заметкой
      return [...currentNotes, createdNote];
    });

    // 6. Возвращаем созданную заметку
    return createdNote;
  }

  /**
   * @param {string} id
   * @param {import('@bridge-monorepo/shared').UpdateNoteDto} dtoUpdateNote
   * @returns {Promise<NoteModel | null>}
   */
  async update(id, dtoUpdateNote) {
    await this._loadData();

    let updatedNote = null;

    await this._sync((currentNotes) => {
      const index = currentNotes.findIndex((note) => note.id === id);

      if (index === -1) {
        return currentNotes;
      }

      const oldNote = currentNotes[index];

      updatedNote = {
        ...oldNote,

        title: dtoUpdateNote.title !== undefined ? dtoUpdateNote.title : oldNote.title,
        content: dtoUpdateNote.content !== undefined ? dtoUpdateNote.content : oldNote.content,
        tags: dtoUpdateNote.tags !== undefined ? dtoUpdateNote.tags : oldNote.tags,

        updatedAt: new Date(),
      };

      const nextNotes = [...currentNotes];
      nextNotes[index] = updatedNote;

      return nextNotes;
    });

    return updatedNote;
  }

  /**
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    await this._loadData();
    let wasFound = false;

    await this._sync((currentNotes) => {
      return currentNotes.filter((note) => {
        if (note.id === id) {
          wasFound = true;
          return false;
        }
        return true;
      });
    });
    return wasFound;
  }
}
