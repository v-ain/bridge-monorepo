import React from 'react';
import styles from './NoteDetail.module.scss';
import { useNoteStore_v2 } from '../store/useNoteStore_v2';

interface NoteDetailProps {
  noteId: string;
}

export const NoteDetail = ({ noteId }: NoteDetailProps) => {
  // Селектор реактивно вытаскивает обновленную модель NoteUi из стора
  const note = useNoteStore_v2((state) => state.notes.find((n) => n.id === noteId));

  if (!note) {
    return (
      <div className={styles.wrapper}>
        <p>Заметка не найдена или была удалена.</p>
      </div>
    );
  }

  // Локализация даты создания (в DTO v2 это гарантированная ISO-строка)
  const formattedDate = new Date(note.createdAt).toLocaleString();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {/* Всегда выводим четкий, валидированный заголовок заметки */}
        <h3 className={styles.title}>{note.title}</h3>
      </div>

      <div className={styles.content}>
        {/* Если контент есть, выводим его с сохранением переносов строк (whitespace-pre-line) */}
        {note.content ? (
          <p className={styles.text} style={{ whiteSpace: 'pre-line' }}>
            {note.content}
          </p>
        ) : (
          <p className={styles.emptyText} style={{ opacity: 0.5, fontStyle: 'italic' }}>
            Нет дополнительного текста.
          </p>
        )}
      </div>

      <div className={styles.meta}>
        <span>📅 Создано: {formattedDate}</span>
        {/* Сюда в будущем идеально встанет список тегов карточки! */}
      </div>
    </div>
  );
};
