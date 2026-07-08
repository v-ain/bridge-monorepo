import { readFile, writeFile, rename } from 'node:fs/promises';
import { createNoteEntity, updateNoteEntity } from './note.mappers.js';
import path from 'node:path';

/**
 * @typedef {import('@bridge-monorepo/shared').NoteEntity} NoteEntity
 * @typedef {import('@bridge-monorepo/shared').CreateNoteDto} CreateNoteDto
 * @typedef {import('@bridge-monorepo/shared').DeleteNoteResponse} DeleteNoteResponse
 * @typedef {import('@bridge-monorepo/shared').INoteService} INoteService
 */

// Берем путь из .env, либо откатываемся на дефолтный относительный путь
const envPath = process.env.NOTES_PATH || './data/dev_notes_v2.json';

// Склеиваем абсолютный путь от корня запуска сервера
const NOTES_PATH = path.resolve(process.cwd(), envPath);
/**
 * @implements {INoteService}
 */
export class NoteService {
  constructor() {
    this._filePath = NOTES_PATH;
    /** @type {NoteEntity[]} */
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
        this._notes = JSON.parse(data);
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

  /** @returns {Promise<NoteEntity[]>} */
  async getAll() {
    await this._loadData();
    // TODO: Возвращать глубокую копию через structuredClone(), чтобы избежать мутации данных по ссылке снаружи
    return this._notes;
  }

  /**
   * @param {string} title
   * @returns {Promise<NoteEntity| null>}
   */
  async create(title) {
    await this._loadData();

    /** @type {NoteEntity} */
    const newNote = createNoteEntity(title);

    await this._sync([...this._notes, newNote]);
    return newNote;
  }

  /**
   * @param {string} id
   * @returns {Promise<NoteEntity| null>}
   */
  async getById(id) {
    await this._loadData();

    const note = this._notes.find((n) => n.id === id);

    // 3. Если не нашли — возвращаем null (контроллер потом ответит 404)
    if (!note) return null;

    // 4. Возвращаем заметку (здесь можно смапить в DTO, если нужно)
    return note;
  }

  /**
   * @param {string} id
   * @param {string} title
   * @returns {Promise<NoteEntity>}
   */
  async update(id, title) {
    await this._loadData();

    let updatedNote = null;

    // Создаем новый массив с измененной заметкой (иммутабельно)
    const nextNotes = this._notes.map((note) => {
      if (note.id === id) {
        // Используем наш маппер вместо ручного обновления
        updatedNote = updateNoteEntity(note, title);
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
   * @returns {Promise<DeleteNoteResponse>}
   */
  async delete(id) {
    // 1. Загружаем данные в кеш
    await this._loadData();

    // 2. Ищем индекс за ОДИН проход.
    // Метод остановится сразу, как только найдет совпадение.
    const index = this._notes.findIndex((note) => note.id === id);

    // Если индекс -1, значит заметки нет. Выходим мгновенно.
    if (index === -1) {
      return null;
    }

    // 3. Создаем новый массив БЕЗ этой заметки (иммутабельно)
    // Используем slice: копируем всё ДО индекса и всё ПОСЛЕ индекса.
    // Это работает быстрее, чем .filter(), так как V8 точно знает границы копирования.
    const nextNotes = [...this._notes.slice(0, index), ...this._notes.slice(index + 1)];

    // 4. Синхронизируем с диском только измененные данные
    await this._sync(nextNotes);

    return { id };
  }
}
