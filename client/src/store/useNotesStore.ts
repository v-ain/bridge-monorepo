import { Note } from '@shared/index';
import { create } from 'zustand';


interface NotesStore {
  notes: Note[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotes: () => Promise<void>;
  addNote: (content: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}

const API_URL = 'http://127.0.0.1:3000';

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/notes`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const notes = await response.json();
      set({ notes, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addNote: async (content: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();

      const newNote: Note = {
        id: result.id,
        content,
        timestamp: new Date().toISOString(),
      };

      set((state) => ({
        notes: [newNote, ...state.notes],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteNote: async (id: number) => {
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
