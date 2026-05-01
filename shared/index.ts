export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
  device?: string;
}

export interface INote extends Note {
  preview: string;
  hasMore: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteDto = Pick<Note, 'content'>;

export type NoteResponse = Omit<Note, 'device'>;
