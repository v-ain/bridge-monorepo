import { z } from 'zod';

export const NoteInputSchema: z.ZodObject<{
  title: z.ZodString;
}>;

export type NoteInput = z.infer<typeof NoteInputSchema>;

