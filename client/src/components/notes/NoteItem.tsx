import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AppErrorCode, NoteEntity } from '@bridge-monorepo/shared';
import styles from './NoteItem.module.scss';
import { useNoteStore } from '@/store/useNoteStore';
import { NoteEditForm } from './NoteEditForm';

interface NoteItemProps {
  note: NoteEntity;
  onModal: (id: string) => void;
}

export const NoteItem = ({ note, onModal }: NoteItemProps) => {
  const updateNote = useNoteStore((state) => state.updateNote);
  const deleteNote = useNoteStore((state) => state.deleteNote);

  const [isEditing, setIsEditing] = useState(false);

  const [text, setText] = useState(note.body ? note.body : note.title);

  // Явно подсвечиваем тип возвращаемого значения для соответствия контракту NoteEditForm
  const handleSave = async (cleanText: string): Promise<AppErrorCode | null> => {
    // Обязательно возвращаем результат выполнения экшена стора наружу!
    const serverError = await updateNote(note.id, cleanText);

    if (serverError) {
      return serverError; // Возвращаем код ошибки в форму
    }

    setIsEditing(false); // Если null, закрываем режим редактирования
    return null;
  };

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await deleteNote(note.id);
    }
  };

  const formattedDate = new Date(note.createdAt).toLocaleString();

  if (isEditing) {
    return (
      <NoteEditForm
        initialValue={note.body || note.title}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }


  return (
    <Card hover >
      <div className={styles.itemLayout}>
        <div className={styles.content} onClick={() => {
          onModal(note.id)
        }}>
          <p className={styles.text}>{note.title}</p>
        </div>

        <div className={styles.footer}>
          <div className={styles.meta}>
            <span className={styles.date}>📅 {formattedDate}</span>
            {/* {note.updatedAt && <span className={styles.device}>📱 {new Date(note.updatedAt).toLocaleString()}</span>} */}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.iconBtn} ${styles.editBtn}`}
              onClick={(e) => {
                setIsEditing(true);
              }}
              title="Редактировать"
            >
              ✏️
            </button>
            <button
              className={`${styles.iconBtn} ${styles.deleteBtn}`}
              onClick={(e) => {
                handleDelete()
              }}
              title="Удалить"
            >
              🗑️
            </button>
          </div>


        </div>
      </div>


    </Card>
  );
};
