import { ApiResponse, NoteDetailsDto, NoteEntity, NotePreviewDto } from '@bridge-monorepo/shared';

const BASE_URL = 'http://192.168.0.101:3000';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}/api${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // Универсальная защита: если сервер ответил ошибкой (400, 404, 413, 500)
    if (!response.ok && response.status !== 413) {
      // Пытаемся распарсить ошибку из ApiResponse, если это возможно
      try {
        const errResult: ApiResponse<null> = await response.json();
        if (errResult.error) throw new Error(errResult.error);
      } catch {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Если сработал наш лимит 413, тело запроса уничтожено, json() вызвать не получится
    if (response.status === 413) {
      throw new Error('Payload Too Large');
    }

    // Парсим успешный ответ в формате ApiResponse
    const result: ApiResponse<T> = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }
    // Возвращаем чистые данные наружу в Zustand
    return result.data as T;
  } catch (error: any) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

// Объект API с жесткими типами на входе и выходе
export const notesApi = {
  getAll: () => apiRequest<NoteEntity[]>('/notes'),

  getById: (id: string) => apiRequest<NoteEntity>(`/notes/${id}`),

  create: (title: string) => apiRequest<NoteEntity>('/notes', {
    method: 'POST',
    body: JSON.stringify({ title })
  }),

  update: (id: string, title: string) => apiRequest<NoteEntity>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title })
  }),

  delete: (id: string) => apiRequest<{ id: string; deleted: boolean }>(`/notes/${id}`, {
    method: 'DELETE'
  }),
};
