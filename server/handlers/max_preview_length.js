/** @typedef {import('@bridge-monorepo/shared').INote} INote */


export const createPreviewNote  = (note) => {
const MAX_PREVIEW_LENGTH = 100;
  let content = note.content;
  if (content.length > MAX_PREVIEW_LENGTH) {
    // Режем до лимита и ищем последний пробел
    const chunk = content.slice(0, MAX_PREVIEW_LENGTH);
    const match = chunk.match(/(.+)\s/s);

    // Если нашли пробел — берем группу [1], если нет (одно длинное слово) — режем жестко
    content = match ? match[1].trimEnd() + '...' : chunk + '...';
  }

  /** @type {INote} */
  const noteDto = {
    preview: content,
    content: note.content,
    id: note.id,
    hasMore: false,
    createdAt: note.timestamp,
    updatedAt: note.timestamp,
    timestamp: note.timestamp,
  }

  return noteDto;
}
