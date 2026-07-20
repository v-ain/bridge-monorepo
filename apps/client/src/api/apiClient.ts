import { ApiResponse, CreateNoteDto, NoteResponseDto, UpdateNoteDto } from '@bridge-monorepo/shared';

// Используем дефолтные значения на случай, если env переменные не прокинулись в бандл Webpack
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '3000';
const BASE_URL = `http://${API_HOST}:${API_PORT}`;

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}/api/v2${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // Если бэкенд вернул ошибку (статусы 4xx, 5xx, включая ваш бывший 413)
    if (!response.ok) {
      try {
        // Пробуем прочитать тело ошибки (например, { error: 'PAYLOAD_TOO_LARGE' })
        const errorResult = (await response.json()) as ApiResponse<T>;
        return errorResult;
      } catch {
        // Если бэкенд упал так, что даже JSON не отдал (битый nginx, сырая 500-я)
        return { data: null, error: 'INTERNAL_SERVER_ERROR' };
      }
    }

    // Если всё хорошо (response.ok === true)
    try {
      const result: ApiResponse<T> = await response.json();
      return result;
    } catch {
      return { data: null, error: 'INTERNAL_SERVER_ERROR' };
    }
  } catch (error: unknown) {
    // <-- 1. Пофиксили any: перевели на безопасный unknown
    // 2. Пофиксили no-console: вместо сырого console.error вытаскиваем сообщение безопасно
    let errorMessage = 'Unknown network error';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Вместо console.error здесь в будущем будет вызов уведомления на клиенте (например, showToast)
    // А пока, чтобы линтер временно пропустил эту строку, можно поставить eslint-disable комментарий,
    // либо перенаправить лог в кастомный обработчик. Сделаем аскетичный игнор одной строки:
    /* eslint-disable-next-line no-console */
    console.error(`[API Network Error] ${endpoint}:`, errorMessage);

    return { data: null, error: 'INTERNAL_SERVER_ERROR' };
  }
}

// Объект API с жесткими типами на входе и выходе
export const notesApi = {
  getAll: () => apiRequest<NoteResponseDto[]>('/notes'),

  getById: (id: string) => apiRequest<NoteResponseDto>(`/notes/${id}`),

  create: (dto: CreateNoteDto) =>
    apiRequest<NoteResponseDto>('/notes', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateNoteDto) =>
    apiRequest<NoteResponseDto>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  delete: (id: string) =>
    apiRequest<boolean>(`/notes/${id}`, {
      method: 'DELETE',
    }),
};
