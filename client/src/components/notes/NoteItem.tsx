import React from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Note } from '@shared/index';
import styles from './NoteItem.module.scss';

interface NoteItemProps {
  note: Note;
}

export const NoteItem = ({ note }: NoteItemProps) => {
  const { deleteNote, loading } = useNotesStore();

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await deleteNote(note.id);
    }
  };

  const formattedDate = new Date(note.timestamp).toLocaleString();

  return (
    <Card hover className={styles.item}>
      <div className={styles.content}>
        <p className={styles.text}>{note.content}</p>
        <div className={styles.meta}>
          <span className={styles.date}>📅 {formattedDate}</span>
          {note.device && <span className={styles.device}>📱 {note.device}</span>}
        </div>
      </div>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
      >
        🗑️ Delete
      </Button>
    </Card>
  );
};
