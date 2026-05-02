import { useEffect } from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './NoteDetail.module.scss';

interface NoteDetailProps {
  noteId: string;
}

export const NoteDetail = ({ noteId }: NoteDetailProps) => {
  const { notes, fetchFullNote } = useNotesStore();
  const note = notes.find(n => n.id === noteId);

  useEffect(() => {
    fetchFullNote(noteId)
  },[])
if (!note) {
    return (
      <Card>
        <p>Note not found</p>
      </Card>
    );
  }

  return (
    <Card className={''}>
      <div className={styles.header}>
        <h3>Note Details</h3>
      </div>
      <div className={styles.content}>
        <p>{note.content}</p>
        <div className={styles.meta}>
          <span>📅 {new Date(note.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
};
