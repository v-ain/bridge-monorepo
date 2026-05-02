export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  timestamp?: string;
}

export interface INote extends Note {
  preview: string;
  hasMore: boolean;
}

export type NoteConentType = Pick<Note, 'content'>;

export type NoteResponseDTO = Omit<Note, 'id'>;
