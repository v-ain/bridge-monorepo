import { z } from 'zod';

// Схема для валидации одного распарсенного элемента
export const BlogIssueSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  path: z.string().startsWith('./cases/', "Path must point to a case folder"),
  topic: z.string().default("No topic provided"),
  result: z.string().default("No results recorded"),
  keyInsights: z.string().default("No insights available"),
});

// Схема для всего массива данных, который отдает эндпоинт /api/blog
export const BlogApiResponseSchema = z.array(BlogIssueSchema);

// Вытаскиваем TS-тип для ОДНОГО элемента (карточки)
export type BlogIssue = z.infer<typeof BlogIssueSchema>;

// Вытаскиваем TS-тип для ВСЕГО ответа API (массива)
export type BlogApiResponse = z.infer<typeof BlogApiResponseSchema>;
