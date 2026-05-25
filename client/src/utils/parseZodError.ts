import { AppErrorCode, ZodError } from "@bridge-monorepo/shared";

const VALID_ERROR_CODES: AppErrorCode[] = [
  "NOTE_EMPTY",
  "NOTE_TOO_LONG",
  "INVALID_JSON_FORMAT",
  "VALIDATION_ERROR",
  "NOTE_NOT_FOUND",
  "PAYLOAD_TOO_LARGE",
  "INTERNAL_SERVER_ERROR"
];

/**
 * Хелпер для извлечения AppErrorCode из ошибок валидации Zod
 * Используем экземпляр z.ZodError для строгой типизации аргумента
 */
export const parseZodError = (error: ZodError): AppErrorCode => {
  // Берем самую первую ошибку из массива
  const firstIssue = error.issues[0];

  if (!firstIssue) {
    return 'VALIDATION_ERROR';
  }

  // Проверяем, совпадает ли message с одним из наших AppErrorCode
  const messageAsErrorCode = firstIssue.message as AppErrorCode;

  if (VALID_ERROR_CODES.includes(messageAsErrorCode)) {
    return messageAsErrorCode;
  }

  // Если Zod выдал стандартную ошибку без нашего кастомного message
  return 'VALIDATION_ERROR';
};
