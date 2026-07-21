import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rm, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Создаем пути во временной папке, чтобы тесты не затирали реальную базу данных
const TEST_DATA_DIR = path.resolve(process.cwd(), './data-test');
const TEST_FILE_PATH = path.join(TEST_DATA_DIR, 'notes_test.json');

// Прокидываем путь к тестовому файлу через env, как заложено в вашей архитектуре
process.env.NOTES_V3_PATH = TEST_FILE_PATH;

describe('NoteService_v2 - Конкурентность и Потокобезопасность', () => {
  beforeEach(async () => {
    await mkdir(TEST_DATA_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Чистим модули кэша Vitest, чтобы переменная env не залипала между другими тестами
    vi.resetModules();
    await rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  it('должен без ошибок обработать 50 параллельных запросов на создание', async () => {
    // 2. Импортируем сервис ЛЕНИВО прямо внутри теста.
    // Теперь он гарантированно прочитает наш TEST_FILE_PATH!
    const { NoteService_v2 } = await import('./note_service.v2.js');

    const service = new NoteService_v2();

    // Генерируем 50 параллельных вызовов create() одновременно
    const promises = Array.from({ length: 50 }).map((_, index) =>
      service.create({
        title: `Заметка №${index}`,
        content: 'Проверка работы асинхронного мьютекса _writeLock',
      })
    );

    const results = await Promise.all(promises);

    expect(results.length).toBe(50);

    const finalNotes = await service.getAll();
    expect(finalNotes.length).toBe(50);

    const titles = finalNotes.map((n) => n.title);
    expect(titles).toContain('Заметка №0');
    expect(titles).toContain('Заметка №25');
    expect(titles).toContain('Заметка №49');
  });
});
