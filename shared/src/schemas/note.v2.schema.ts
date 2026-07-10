import { z } from 'zod';

export const TITLE_MAX_LENGTH = 100;
export const CONTENT_MAX_LENGTH = 3500;
// export const NOTE_MAX_LENGTH = 3500;

export const BaseModelSchema = z.object({
  id: z.uuid({ message: 'INVALID_ID_FORMAT' }),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type BaseModel = z.infer<typeof BaseModelSchema>;

export const NoteSchema = BaseModelSchema.extend({
  title: z.string().trim().min(1, { message: 'TITLE_EMPTY' }).max(TITLE_MAX_LENGTH, { message: 'TITLE_TOO_LONG' }),
  content: z.string().max(CONTENT_MAX_LENGTH, { message: 'CONTENT_TOO_LONG' }).optional(),
  tags: z.array(z.string()).default([]),
});
export type NoteModel = z.infer<typeof NoteSchema>;

export const CreateNoteDtoSchema = NoteSchema.pick({
  title: true,
  content: true,
}).extend({
  id: z.uuid().optional(), // Опциональный UUID для оптимистичного интерфейса
  tags: z.array(z.string()).optional(), // На этапе ввода теги могут не прийти
});
export type CreateNoteDto = z.infer<typeof CreateNoteDtoSchema>;

export const UpdateNoteDtoSchema = NoteSchema.pick({
  title: true,
  content: true,
  tags: true,
}).partial(); // Все поля становятся string | undefined
export type UpdateNoteDto = z.infer<typeof UpdateNoteDtoSchema>;

/** DTO проверки ID в параметрах урла (GET /notes/:id) */
export const NoteIdParamDtoSchema = NoteSchema.pick({
  id: true,
});
export type NoteIdParamDto = z.infer<typeof NoteIdParamDtoSchema>;

export const NoteResponseDtoSchema = NoteSchema.extend({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type NoteResponseDto = z.infer<typeof NoteResponseDtoSchema>;

// ========================================================
// UI. СЛОЙ ИНТЕРФЕЙСА (UI MODELS)
// ========================================================
export type NoteUi = NoteResponseDto & {
  isEditing?: boolean;
  isSelected?: boolean;
  isSavingInProgress?: boolean;
};
