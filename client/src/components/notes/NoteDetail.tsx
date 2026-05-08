import { useEffect } from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import styles from './NoteDetail.module.scss';

interface NoteDetailProps {
  noteId: string;
}

export const NoteDetail = ({ noteId }: NoteDetailProps) => {
  const { notes, fetchFullNote } = useNotesStore();
  const note = notes.find(n => n.id === noteId);

  useEffect(() => {
    fetchFullNote(noteId)
  }, [])
  if (!note) {
    return (
      <div>
        <p>Note not found</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Note Details</h3>
      </div>
      <div className={styles.content}>
        <p>{note.content}</p>
      </div>
      <div className={styles.meta}>
        <span>📅 {new Date(note.createdAt).toLocaleString()}</span>
      </div>

    </div>
  );
};
