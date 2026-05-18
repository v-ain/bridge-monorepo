import { AppErrorCode } from "@shared/index";


/**
 * Словарь человекочитаемых сообщений об ошибках на русском языке.
 * Жестко завязан на AppErrorCode из shared.
 */
export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  // Валидация ввода (400)
  NOTE_EMPTY: 'Текст заметки не может быть пустым.',
  NOTE_TOO_LONG: 'Текст заметки слишком длинный.',
  INVALID_JSON_FORMAT: 'Неверный формат данных. Попробуйте обновить страницу.',
  VALIDATION_ERROR: 'Введенные данные не прошли проверку валидации.',

  // Ошибки ресурсов и сети (404, 413, 500)
  NOTE_NOT_FOUND: 'Заметка не найдена. Возможно, она уже удалена.',
  PAYLOAD_TOO_LARGE: 'Запрос слишком большой. Превышен лимит размера.',
  INTERNAL_SERVER_ERROR: 'Произошла ошибка на сервере. Мы уже чиним её.',
};

/**
 * Безопасное получение текста ошибки по её строгому коду
 */
export function getErrorMessage(code: AppErrorCode | null | undefined): string {
  if (!code) return '';
  return ERROR_MESSAGES[code] || 'Произошла непредвиденная ошибка.';
}
