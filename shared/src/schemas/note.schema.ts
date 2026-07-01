import { z } from 'zod';

export const NOTE_MAX_LENGTH = 3500;

export const NoteInputSchema = z.object({
  title: z.string().trim().min(1, { message: 'NOTE_EMPTY' }).max(NOTE_MAX_LENGTH, { message: 'NOTE_TOO_LONG' }),
});

export type NoteInput = z.infer<typeof NoteInputSchema>;
