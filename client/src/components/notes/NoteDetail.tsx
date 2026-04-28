import { useNotesStore } from '../../store/useNotesStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import styles from './NoteDetail.module.scss';

interface NoteDetailProps {
  noteId: string;
  onClose: () => void;
}

export const NoteDetail = ({ noteId, onClose }: NoteDetailProps) => {
  const { notes } = useNotesStore();
  const note = notes.find(n => n.id === noteId);

  if (!note) {
    return (
      <Card>
        <p>Note not found</p>
        <Button onClick={onClose}>Close</Button>
      </Card>
    );
  }

  return (
    <Card className={styles.detail}>
      <div className={styles.header}>
        <h3>Note Details</h3>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
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
