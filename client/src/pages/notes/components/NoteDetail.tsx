import styles from './NoteDetail.module.scss';
import { useNoteStore } from '../store/useNoteStore';

interface NoteDetailProps {
  noteId: string;
}

export const NoteDetail = ({ noteId }: NoteDetailProps) => {
  const note = useNoteStore((state) => state.notes.find((n) => n.id === noteId));

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
        <p>{note.body ?? note.title}</p>
      </div>
      <div className={styles.meta}>
        <span>📅 {new Date(note.createdAt).toLocaleString()}</span>
      </div>

    </div>
  );
};
