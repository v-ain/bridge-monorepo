import React from 'react';
import type { AppErrorCode, NoteUi } from '@bridge-monorepo/shared';
import { useNoteStore } from '../store/useNoteStore';
import { NoteEditForm } from './NoteEditForm';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/icon-button/IconButton';
import styles from './NoteItem.module.scss';

interface NoteItemProps {
  note: NoteUi;
  onModal: (id: string) => void;
}

export const NoteItem = ({ note, onModal }: NoteItemProps) => {
  // Достаем новые централизованные экшены из Zustand-стора
  const updateNote = useNoteStore((state) => state.updateNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);
  const toggleEditMode = useNoteStore((state) => state.toggleEditMode);
  // TODO: Implement note selection feature and reactive store hooks
  // const toggleSelect = useNoteStore((state) => state.toggleSelect);

  const handleSave = async (cleanText: string): Promise<AppErrorCode | null> => {
    // Шлем простыню текста в стор V2. Он сам её нарежет на title и content
    return await updateNote(note.id, cleanText);
  };

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await deleteNote(note.id);
    }
  };

  // Бэкенд v2 гарантирует ISO-строку. Но на фронте в DTO это всё еще строка,
  // поэтому легкий парсинг в объект даты оставляем для локализации локали
  const formattedDate = new Date(note.updatedAt).toLocaleString();

  // Собираем обратно в простыню для редактирования в одном инпуте.
  // Если есть контент, склеиваем через перенос строки, если нет — только заголовок.
  const fullRawText = note.content ? `${note.title}\n${note.content}` : note.title;

  // Реактивно смотрим на флаг из стора вместо локального useState!
  if (note.isEditing) {
    return (
      <NoteEditForm
        initialValue={fullRawText}
        onSave={handleSave}
        onCancel={() => toggleEditMode(note.id, false)} // Закрываем через стор
      />
    );
  }

  return (
    // Если карточка выделена — подсвечиваем её (задел под будущую фичу пакетов/тегов!)
    <Card hover className={note.isSelected ? styles.selectedCard : ''}>
      <div className={styles.itemLayout}>
        <div className={styles.header}>
          {/* TODO: Implement note selection feature and reactive store hooks*/}
          {/* <input */}
          {/*   type="checkbox" */}
          {/*   checked={!!note.isSelected} */}
          {/*   onChange={() => toggleSelect(note.id)} */}
          {/*   className={styles.checkbox} */}
          {/* /> */}

          <div
            className={styles.content}
            onClick={() => {
              onModal(note.id);
            }}
          >
            {/* Текст заметки — теперь это title, а ниже можно вывести теги */}
            <p className={styles.text}>{note.title}</p>
            {note.content && (
              <p className={styles.subText} style={{ opacity: 0.7, fontSize: '0.9em' }}>
                {note.content}
              </p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.meta}>
            <span className={styles.date}>{note.isSavingInProgress ? '⏳ Сохранение...' : `📅 ${formattedDate}`}</span>
          </div>

          <div className={styles.actions}>
            {/* Открываем режим редактирования через экшен стора */}
            <IconButton onClick={() => toggleEditMode(note.id, true)} title="Редактировать">
              ✏️
            </IconButton>
            <IconButton variant="danger" onClick={handleDelete} title="Удалить">
              🗑️
            </IconButton>
          </div>
        </div>
      </div>
    </Card>
  );
};
