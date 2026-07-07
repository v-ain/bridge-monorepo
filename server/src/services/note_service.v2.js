import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * @typedef {import('@bridge-monorepo/shared').NoteModel} NoteModel
 * @typedef {import('@bridge-monorepo/shared').INoteServiceV2} INoteService
 */

// Берем путь из .env, либо откатываемся на дефолтный относительный путь
// const envPath = process.env.NOTES_PATH || './data/dev_notes_v3.json';
const envPath = './data/dev_notes_v3.json';

// Склеиваем абсолютный путь от корня запуска сервера
const NOTES_PATH = path.resolve(process.cwd(), envPath);
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
        console.log('Reading from file ' + this._filePath);
        const data = await readFile(this._filePath, 'utf-8');
        /** @type {any[]} */
        const rawEntities = JSON.parse(data);

        this._notes = rawEntities.map((note) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log('File not found, initializing empty state');
          this._notes = [];
        } else {
          throw err; // Пробрасываем критические ошибки (права доступа и т.д.)
        }
      } finally {
        this._isLoaded = true;
        this._loadingPromise = null;
      }
    })();

    return this._loadingPromise;
  }
  /**
   * @param {NoteModel[]} nextNotes
   */
  async _sync(nextNotes) {
    const tempPath = this._filePath + '.tmp';

    this._writeLock = this._writeLock.then(async () => {
      try {
        // Пишем в файл
        await writeFile(tempPath, JSON.stringify(nextNotes, null, 2));

        await rename(tempPath, this._filePath);
        // Если запись успешна, обновляем состояние
        this._notes = nextNotes;
        this._isLoaded = true;
      } catch (err) {
        // В случае ошибки сбрасываем флаг, чтобы при следующем запросе
        // данные были перечитаны с диска
        this._isLoaded = false;
        throw err;
      }
    });

    return this._writeLock;
  }

  /** @returns {Promise<NoteModel[]>} */
  async getAll() {
    await this._loadData();
    // TODO: Возвращать глубокую копию через structuredClone(), чтобы избежать мутации данных по ссылке снаружи
    return this._notes;
  }

  /**
   * @param {import('@bridge-monorepo/shared').CreateNoteDto} dtoNote
   * @returns {Promise<NoteModel | null>}
   */
  async create(dtoNote) {
    await this._loadData();

    /** @type {NoteModel} */
    const newDomainNote = {
      // Если фронтенд прислал ID (оптимистичный интерфейс), берем его, иначе генерируем новый UUID v4
      id: dtoNote.id || randomUUID(),
      title: dtoNote.title,
      content: dtoNote.content || '',
      tags: dtoNote.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this._sync([...this._notes, newDomainNote]);
    return newDomainNote;
  }

  /**
   * @param {string} id
   * @returns {Promise<NoteModel | null>}
   */
  async getById(id) {
    await this._loadData();

    const note = this._notes.find((n) => n.id === id);

    // 3. Если не нашли — возвращаем null (контроллер потом ответит 404)
    if (!note) return null;

    return note;
  }

  /**
   * @param {string} id
   * @param {import('@bridge-monorepo/shared').UpdateNoteDto} dtoUpdateNote
   * @returns {Promise<NoteModel>}
   */
  async update(id, dtoUpdateNote) {
    await this._loadData();

    let updatedNote = null;

    // TODO: RaseCondition with paralel write _notes
    const nextNotes = this._notes.map((note) => {
      if (note.id === id) {
        updatedNote = {
          ...note,
          title: dtoUpdateNote.title !== undefined ? dtoUpdateNote.title : note.title,
          content: dtoUpdateNote.content !== undefined ? dtoUpdateNote.content : note.content,
          tags: dtoUpdateNote.tags !== undefined ? dtoUpdateNote.tags : note.tags,
          updatedAt: new Date(),
        };
        return updatedNote;
      }
      return note;
    });

    if (!updatedNote) {
      return null;
    }

    await this._sync(nextNotes);

    // Возвращаем обновленный объект
    return updatedNote;
  }

  /**
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    // 1. Загружаем данные в кеш
    await this._loadData();

    // 2. Ищем индекс за ОДИН проход.
    // Метод остановится сразу, как только найдет совпадение.
    const index = this._notes.findIndex((note) => note.id === id);

    // Если индекс -1, значит заметки нет. Выходим мгновенно.
    if (index === -1) {
      return false;
    }

    // 3. Создаем новый массив БЕЗ этой заметки (иммутабельно)
    // Используем slice: копируем всё ДО индекса и всё ПОСЛЕ индекса.
    // Это работает быстрее, чем .filter(), так как V8 точно знает границы копирования.
    const nextNotes = [...this._notes.slice(0, index), ...this._notes.slice(index + 1)];

    // 4. Синхронизируем с диском только измененные данные
    await this._sync(nextNotes);

    return true;
  }
}
