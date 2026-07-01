export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export type NotePriority = 'low' | 'medium' | 'high';

export interface NoteEntity {
  id: string;
  title: string;
  body: string | null;

  isCompleted: boolean;
  priority: NotePriority;

  createdAt: string;
  updatedAt: string;

  tags?: string[];
}

export type CreateNoteDto = Pick<NoteEntity, 'title'>;

export type NotePreviewDto = Pick<NoteEntity, 'id' | 'title' | 'createdAt'>;

export type NoteDetailsDto = Pick<NoteEntity, 'body'> & NotePreviewDto;

export type UpdateNoteDto = CreateNoteDto;

export type DeleteNoteDto = Pick<NoteEntity, 'id'>;

export type DeleteNoteResponse = DeleteNoteDto;

export type CreateNoteResponse = Pick<NoteEntity, 'id' | 'title' | 'body' | 'createdAt' | 'updatedAt'>;

//export type GetNoteParamsDto = Pick<NoteEntity, 'id'>;

// Service Interface (Contract)
export interface INoteService {
  getAll(): Promise<NotePreviewDto[]>;
  getById(id: NoteEntity['id']): Promise<NoteDetailsDto | null>;
  create(title: string): Promise<NoteDetailsDto>;
  update(id: string, title: string): Promise<NoteDetailsDto>;
  delete(id: string): Promise<DeleteNoteResponse>;
}

export { z } from 'zod';
export type { ZodError } from 'zod';
export * from './schemas/note.schema.js';

export * from './schemas/blog.schema.js';

export type AppErrorCode =
  | 'NOTE_EMPTY'
  | 'NOTE_TOO_LONG'
  | 'INVALID_JSON_FORMAT'
  | 'VALIDATION_ERROR'
  | 'NOTE_NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_SERVER_ERROR';

export type ApiSuccessResponse<T> = {
  data: T;
  error: null;
};

export type ApiErrorResponse = {
  data: null;
  error: AppErrorCode;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

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
