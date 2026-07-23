export { z } from 'zod';
export type { ZodError } from 'zod';

export * from './schemas/note.v2.schema.js';
import { NoteModel, CreateNoteDto, UpdateNoteDto } from './schemas/note.v2.schema.js';

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
  | 'INVALID_ID_FORMAT'
  | 'DUPLICATE_ID';

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
