import { create } from 'zustand';
import { notesApi } from '../api/apiClient';
import { NoteEntity } from '@bridge-monorepo/shared';

interface NoteState {
  notes: NoteEntity[];
  isLoading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  addNote: (title: string) => Promise<void>;
  updateNote: (id: string, title: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await notesApi.getAll();
      set({ notes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addNote: async (title: string) => {
    set({ isLoading: true, error: null });
    try {
      const newNote = await notesApi.create(title);
      set((state) => ({ notes: [...state.notes, newNote], isLoading: false }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateNote: async (id: string, title: string) => {
    set({ error: null });
    try {
      const updatedNote = await notesApi.update(id, title);
      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteNote: async (id: string) => {
    set({ error: null });
    try {
      const result = await notesApi.delete(id);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== result.id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
