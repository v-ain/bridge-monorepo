import fs from 'node:fs/promises';
import { fileURLToPath } from 'url';
import { BlogApiResponseSchema } from '@bridge-monorepo/shared';

function parseJournalIssues(markdownText) {
  const lines = markdownText.split('\n');
  const issues = [];
  let currentIssue = null;

  for (let line of lines) {
    line = line.trim();

    // 1. Ищем заголовки H3: ### ⚡ [Issue #1...](...)
    if (line.startsWith('###')) {
      // Сохраняем предыдущий issue, если он был готов
      if (currentIssue) {
        issues.push(currentIssue);
      }

      // Вытаскиваем текст ссылки и саму ссылку
      // Регулярка ищет [Текст](Ссылка)
      const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);

      if (linkMatch) {
        const titleText = linkMatch[1]; // "Issue #1: Bitwise State..."
        const path = linkMatch[2];      // "./cases/01-bitmasks-branch-prediction/"
        const cleanTitle = titleText.replace(/^Issue\s+#\d+:\s*/i, '');
        currentIssue = {
          title: cleanTitle,
          path: path,
          topic: '',
          result: '',
          keyInsights: ''
        };
      }
      continue;
    }

    // Если мы еще не встретили первый H3, пропускаем строки (например, H2 заголовок)
    if (!currentIssue) continue;

    // 2. Парсим свойства внутри элементов списка
    if (line.startsWith('*')) {

      // Убираем маркер списка "*" и лишние пробелы в начале
      // const content = line.replace(/^[\*\-\s]+/, '');
      const content = line;
      if (content.startsWith('*   **Topic:**')) {
        currentIssue.topic = content.replace('*   **Topic:**', '').trim();
      }
      else if (content.startsWith('*   **Result:**')) {
        // Очищаем от Markdown жирности (**) внутри строки результата
        currentIssue.result = content.replace('*   **Result:**', '').replace(/\*\*/g, '').trim();
      }
      else if (content.startsWith('*   **Key Insights:**')) {
        currentIssue.keyInsights = content.replace('*   **Key Insights:**', '').trim();
      }
    }
  }

  // Не забываем пушнуть последний элемент после выхода из цикла
  if (currentIssue) {
    issues.push(currentIssue);
  }

  return issues;
}

const pathFileMd = fileURLToPath(new URL('../../data/blog/README.md', import.meta.url));

export let getFileString = async () => {
  const rawText = await fs.readFile(pathFileMd, 'utf-8');
  let rawParsedObjects = parseJournalIssues(rawText);


  // Безопасная валидация
  const validation = BlogApiResponseSchema.safeParse(rawParsedObjects);

  if (!validation.success) {
    // Если разметка сломалась, мы не ломаем сервер, а логируем ошибку Zod 
    // и можем либо выкинуть контролируемый ApiResponse err, либо вернуть то, что удалось спасти
    console.error('⚠️ Ошибка валидации Markdown структуры:', validation.error.format());

    // Возвращаем дефолтные отвалидированные данные (сработают дефолтные значения Zod)
    return rawParsedObjects;
  }

  // Здесь лежат 100% валидные данные, полностью соответствующие вашим TS типам
  return validation.data;
}

export class BlogService {
  constructor() {
    this.githubRawUrl = 'https://raw.githubusercontent.com/v-ain/b0-log/main/README.md';
  }

  async getRemoteMarkdown() {
    try {
      const response = await fetch(this.githubRawUrl, {
        headers: {
          'User-Agent': 'NodeJS-Minimal-Blog-Console'
        }
      });

      // Обрабатываем HTTP ошибки (404, 500 и т.д.)
      if (!response.ok) {
        throw new Error(`GitHub API ответил ошибкой: ${response.status} ${response.statusText}`);
      }

      const markdownText = await response.text();

      let rawParsedObjects = parseJournalIssues(markdownText);
      return rawParsedObjects;

    } catch (error) {
      // Выводим ошибку в консоль сервера для отладки
      console.error('Ошибка при получении блога с GitHub:', error.message);

      throw error;
    }
  }
}
