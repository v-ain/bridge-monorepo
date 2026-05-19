import { z } from 'zod';

export const NoteInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'NOTE_EMPTY' })
    .max(10000, { message: 'NOTE_TOO_LONG' }),
});

export type NoteInput = z.infer<typeof NoteInputSchema>;
