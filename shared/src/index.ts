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

export type NotePreviewDto = Pick<NoteEntity, 'id' | 'title' | 'createdAt'>;

export type NoteDetailsDto = Pick<NoteEntity, 'body'> & NotePreviewDto;

export type DeleteNoteDto = Pick<NoteEntity, 'id'>;

export type DeleteNoteResponse = DeleteNoteDto;

export type CreateNoteResponse = Pick<NoteEntity, 'id' | 'title' | 'body' | 'createdAt' | 'updatedAt'>;

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

export * from './schemas/note.v2.schema.js';
import { NoteModel, CreateNoteDto, UpdateNoteDto } from './schemas/note.v2.schema.js';

export * from './schemas/blog.schema.js';

export type AppErrorCode =
  | 'NOTE_EMPTY'
  | 'NOTE_TOO_LONG'
  | 'TITLE_EMPTY'
  | 'TITLE_TOO_LONG'
  | 'CONTENT_TOO_LONG'
  | 'INVALID_JSON_FORMAT'
  | 'VALIDATION_ERROR'
  | 'NOTE_NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_ID_FORMAT';

export type ApiSuccessResponse<T> = {
  data: T;
  error: null;
};

export type ApiErrorResponse = {
  data: null;
  error: AppErrorCode;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Service Interface (Contract)
export interface INoteServiceV2 {
  getAll(): Promise<NoteModel[]>;
  getById(id: string): Promise<NoteModel | null>;
  create(newNote: CreateNoteDto): Promise<NoteModel>;
  update(id: string, newNote: UpdateNoteDto): Promise<NoteModel>;
  delete(id: string): Promise<boolean>;
}
