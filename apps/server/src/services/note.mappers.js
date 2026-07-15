import { randomUUID } from 'node:crypto';

/**
 * @typedef {import('@bridge-monorepo/shared').NoteEntity} NoteEntity
 */

const MAX_PREVIEW_LENGTH = 130;

/**
 * Внутренняя функция для подготовки заголовка и тела
 * @param {string} rawTitle
 */
function prepareNoteContent(rawTitle) {
  const isTooLong = rawTitle.length > MAX_PREVIEW_LENGTH;
  let displayTitle = rawTitle;
  let bodyContent = isTooLong ? rawTitle : null;

  if (isTooLong) {
    const chunk = rawTitle.slice(0, MAX_PREVIEW_LENGTH);
    const match = chunk.match(/(.+)\s/s);
    displayTitle = (match ? match[1].trimEnd() : chunk) + '...';
  }

  return { displayTitle, bodyContent };
}

/**
 * @param {string} title
 * @returns {NoteEntity}
 */
function createNoteEntity(title) {
  // valid if title undefined

  const { displayTitle, bodyContent } = prepareNoteContent(title);

  /** @type {NoteEntity} */
  const newNote = {
    id: randomUUID(),
    title: displayTitle,
    body: bodyContent,
    isCompleted: true,
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return newNote;
}

/**
 * @param {NoteEntity} oldNote
 * @param {string} newTitle
 * @returns {NoteEntity}
 */
function updateNoteEntity(oldNote, newTitle) {
  const { displayTitle, bodyContent } = prepareNoteContent(newTitle);

  return {
    ...oldNote, // Сохраняем id, createdAt и прочие поля
    title: displayTitle,
    body: bodyContent,
    updatedAt: new Date().toISOString(), // Обновляем только дату изменения
  };
}

export { createNoteEntity, updateNoteEntity };
