export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface NoteEntity {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotePreviewDto extends Omit<NoteEntity, 'content'> {
  preview: string;
  hasMore: boolean;
}

// Service Interface (Contract)
export interface INoteService {
  getAll(): Promise<NotePreviewDto[]>;
  getById(id: string): Promise<NoteEntity | null>;
  create(content: string): Promise<NoteEntity>;
  update(id: string, content: string): Promise<NoteEntity>;
  delete(id: string): Promise<boolean>;
}

// Standard API Wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface INote extends Note {
  preview: string;
  hasMore: boolean;
}

export type NoteConentType = Pick<Note, 'content'>;

export type NoteResponseDTO = Omit<Note, 'id'>;
