import { create } from 'zustand';
import { INote } from '@shared/index';


interface NotesStore {
  notes: INote[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotes: () => Promise<void>;
  fetchFullNote: (id: string) => Promise<void>;
  addNote: (content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, content: string) => Promise<void>;
}

//const API_URL = 'http://127.0.0.1:3000';
const API_URL = 'http://192.168.0.101:3000';

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/notes`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const notes: INote[] = await response.json();
      set({ notes, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchFullNote: async (id: string) => {
    set({ loading: true, error: null });
 //   console.log('fetchFullNote')
    try {
      const response = await fetch(`${API_URL}/notes/${id}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const note: INote = await response.json();

      set((state) => ({
        notes: state.notes.map((n) => {
          if (n.id === note.id) {
            return ({
              ...n,
              ...note,
            })
          }
          return n;
        }),
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch full note:', error);
      throw error;
    }
  },

  addNote: async (content) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const newNote: INote = await response.json();

      set((state) => ({
        notes: [newNote, ...state.notes],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateNote: async (id, content) => {
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Ошибка при обновлении');
      const updatedNote: NoteResponse = await response.json();

      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
