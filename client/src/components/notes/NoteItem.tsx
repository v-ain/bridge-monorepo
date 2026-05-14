import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { NoteEntity } from '@shared/index';
import styles from './NoteItem.module.scss';
import { useNoteStoreV2 } from '@/store/useNoteStoreV2';

interface NoteItemProps {
  note: NoteEntity;
  onModal: (id: string) => void;
}

export const NoteItem = ({ note, onModal }: NoteItemProps) => {
  const updateNote = useNoteStoreV2((state) => state.updateNote);
  const deleteNote = useNoteStoreV2((state) => state.deleteNote);

  const [isEditing, setIsEditing] = useState(false);

  const [text, setText] = useState(note.body ? note.body : note.title);

  const handleSave = async () => {
    await updateNote(note.id, text);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await deleteNote(note.id);
    }
  };

  const formattedDate = new Date(note.createdAt).toLocaleString();

  if (isEditing) {
    return (
      <Card className={styles.editingCard}>
        <textarea
          className={styles.editTextarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className={styles.editActions}>
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(false)}>
            Отмена
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} disabled={false}>
            Сохранить
          </Button>
        </div>
      </Card>
    );
  }


  return (
    <Card hover className={styles.item}>
      <div className={styles.content} onClick={() => {
        onModal(note.id)
      }}>
        <p className={styles.text}>{note.title}</p>
        <div className={styles.meta}>
          <span className={styles.date}>📅 {formattedDate}</span>
          {note.updatedAt && <span className={styles.device}>📱 {new Date(note.updatedAt).toLocaleString()}</span>}
        </div>
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
          ✏️ Редактировать
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={false}>
          🗑️ Удалить
        </Button>
      </div>

    </Card>
  );
};
