import { create } from 'zustand';
import { notesApi } from '@/api/apiClient';
import { AppErrorCode, NoteEntity } from '@bridge-monorepo/shared';

interface NoteState {
  notes: NoteEntity[];
  isLoading: boolean;
  // Переименовали в globalError со строгим типом для системных ошибок
  globalError: AppErrorCode | null;

  // Экшены теперь возвращают код ошибки или null при успехе
  fetchNotes: () => Promise<AppErrorCode | null>;
  addNote: (title: string) => Promise<AppErrorCode | null>;
  updateNote: (id: string, title: string) => Promise<AppErrorCode | null>;
  deleteNote: (id: string) => Promise<AppErrorCode | null>;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  isLoading: false,
  globalError: null,

  // 1. Получение всех заметок
  fetchNotes: async () => {
    set({ isLoading: true, globalError: null });

    const response = await notesApi.getAll();

    if (response.error) {
      set({ globalError: response.error, isLoading: false });
      return response.error; // Возвращаем код ошибки для UI
    }

    set({ notes: response.data, isLoading: false });
    return null; // Успех
  },

  // 2. Создание заметки
  addNote: async (title: string) => {
    set({ isLoading: true, globalError: null });

    const response = await notesApi.create(title);

    if (response.error) {
      set({ isLoading: false }); // Снимаем флаг загрузки
      return response.error;     // Возвращаем код ошибки форме
    }

    // Иммутабельно добавляем новую заметку в конец списка
    set((state) => ({
      notes: [...state.notes, response.data],
      isLoading: false
    }));

    return null;
  },

  // 3. Обновление заметки
  updateNote: async (id: string, title: string) => {
    set({ globalError: null });

    const response = await notesApi.update(id, title);

    if (response.error) {
      return response.error;
    }

    // Иммутабельно заменяем обновленную заметку через .map()
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? response.data : note)),
    }));

    return null;
  },

  // 4. Удаление заметки
  deleteNote: async (id: string) => {
    set({ globalError: null });

    const response = await notesApi.delete(id);

    if (response.error) {
      return response.error;
    }

    // Бэкенд возвращает { id }. Иммутабельно фильтруем массив
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== response.data.id),
    }));

    return null;
  },
}));

