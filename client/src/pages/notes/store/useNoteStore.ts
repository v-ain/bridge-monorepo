import { create } from 'zustand';
import { notesApi } from '@/api/apiClient';
import { CreateNoteDtoSchema, UpdateNoteDtoSchema } from '@bridge-monorepo/shared';
import type { AppErrorCode, NoteUi } from '@bridge-monorepo/shared';

/**
 * Чистая функция для нарезки "простыни" текста.
 * Возвращает объект с гарантированными строками (пустыми, если текста нет).
 */
function splitRawText(rawText: string) {
  const trimmed = rawText.trim();
  const lines = trimmed.split('\n');
  const title = lines[0] || '';
  const content = lines.slice(1).join('\n').trim();

  return { title, content };
}

// ==========================================
// 2. ИНТЕРФЕЙС СОСТОЯНИЯ И ЭКШЕНОВ СТОРА
// ==========================================

interface NoteState {
  notes: NoteUi[];
  isLoading: boolean;
  globalError: AppErrorCode | null; // Активируется только при падении сервера/сети

  // Сетевые экшены
  fetchNotes: () => Promise<AppErrorCode | null>;
  addNote: (rawText: string) => Promise<AppErrorCode | null>;
  updateNote: (id: string, rawText: string) => Promise<AppErrorCode | null>;
  deleteNote: (id: string) => Promise<AppErrorCode | null>;

  // Локальные UI экшены
  toggleEditMode: (id: string, isEditing: boolean) => void;
  toggleSelect: (id: string) => void;
}

// ==========================================
// 3. РЕАЛИЗАЦИЯ ZUSTAND-СТОРА
// ==========================================

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  isLoading: false,
  globalError: null,

  // Экшен 1: Получение всех заметок с сервера
  fetchNotes: async () => {
    set({ isLoading: true, globalError: null });
    const response = await notesApi.getAll();

    if (response.error) {
      set({ isLoading: false });
      set({ globalError: response.error }); // Выставляем глобальный сбой для списка
      return response.error;
    }

    set({
      notes: response.data || [], // Паттерн защитного программирования
      isLoading: false,
    });

    return null;
  },

  // 2. Создание заметки (Чистый KISS вариант)
  addNote: async (rawText: string) => {
    // Шаг 1: Нарезаем строку
    const { title, content } = splitRawText(rawText);

    // Шаг 2: Валидируем родной схемой. Для Zod v4 пустой контент передаем как undefined
    const clientValidation = CreateNoteDtoSchema.safeParse({
      title,
      content: content || undefined,
    });

    if (!clientValidation.success) {
      const errorCode = clientValidation.error.issues[0].message as AppErrorCode;
      return errorCode; // Локальный возврат ошибки в форму
    }

    // Шаг 3: Сеть
    set({ isLoading: true });
    const response = await notesApi.create(clientValidation.data);

    if (response.error) {
      set({ isLoading: false });
      if (response.error === 'INTERNAL_SERVER_ERROR') {
        set({ globalError: response.error });
      }
      return response.error;
    }

    // Шаг 4: Успех
    const newNoteUi: NoteUi = { ...response.data, isEditing: false, isSavingInProgress: false };
    set((state) => ({
      notes: [...state.notes, newNoteUi],
      isLoading: false,
      globalError: null,
    }));

    return null;
  },

  // 3. Обновление заметки (Чистый KISS вариант)
  updateNote: async (id: string, rawText: string) => {
    // Шаг 1: Нарезаем строку
    const { title, content } = splitRawText(rawText);

    // Шаг 2: Валидируем родной схемой обновления. Тут все типы сойдутся идеально!
    const clientValidation = UpdateNoteDtoSchema.safeParse({
      title,
      content: content || undefined,
    });

    if (!clientValidation.success) {
      const errorCode = clientValidation.error.issues[0].message as AppErrorCode;
      return errorCode;
    }

    // Шаг 3: Сеть
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, isSavingInProgress: true } : note)),
    }));

    const response = await notesApi.update(id, clientValidation.data);

    if (response.error) {
      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? { ...note, isSavingInProgress: false } : note)),
      }));
      if (response.error === 'INTERNAL_SERVER_ERROR') {
        set({ globalError: response.error });
      }
      return response.error;
    }

    // Шаг 4: Успех
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...response.data, isEditing: false, isSavingInProgress: false } : note
      ),
      globalError: null,
    }));

    return null;
  },

  // Экшен 4: Удаление заметки
  deleteNote: async (id: string) => {
    const response = await notesApi.delete(id);

    if (response.error) {
      if (response.error === 'INTERNAL_SERVER_ERROR') {
        set({ globalError: response.error });
      }
      return response.error;
    }

    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      globalError: null,
    }));

    return null;
  },

  // Экшен 5: Локальное переключение режима редактирования
  toggleEditMode: (id, isEditing) => {
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, isEditing } : note)),
    }));
  },

  // Экшен 6: Локальное выделение карточки
  toggleSelect: (id) => {
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, isSelected: !note.isSelected } : note)),
    }));
  },
}));
