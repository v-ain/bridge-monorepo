import { ApiResponse, CreateNoteDto, NoteResponseDto, UpdateNoteDto } from '@bridge-monorepo/shared';

const BASE_URL = `http://${process.env.API_HOST}:${process.env.API_PORT}`;

// Изменили Promise<T> на Promise<ApiResponse<T>>
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}/api/v2${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // 1. Обработка жесткого лимита 413 Node.js сервера (соединение оборвано, тело читать нельзя)
    if (response.status === 413) {
      return { data: null, error: 'PAYLOAD_TOO_LARGE' };
    }

    // 2. Безопасный парсинг JSON.
    // Поскольку наш бэкенд ТЕПЕРЬ ВСЕГДА возвращает структуру ApiResponse (и при 200, и при 400/404/500),
    // мы можем просто попытаться прочитать этот объект.
    try {
      const result: ApiResponse<T> = await response.json();

      // Сервер вернул валидный JSON в нашем формате. Просто отдаем его наружу!
      // Там уже лежит либо { data: T, error: null }, либо { data: null, error: AppErrorCode }
      return result;
    } catch {
      // Сюда мы попадем, если сервер упал настолько жестко, что выдал не JSON, а битый текст/HTML
      return { data: null, error: 'INTERNAL_SERVER_ERROR' };
    }
  } catch (error: any) {
    // 3. Перехват критических сетевых аварий (у пользователя пропал Wi-Fi, DNS не разрешился и т.д.)
    console.error(`[API Network/System Error] ${endpoint}:`, error.message);

    // Вместо падения приложения возвращаем безопасный объект ошибки
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
