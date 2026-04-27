import React, { useState } from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Note } from '@shared/index';
import styles from './NoteItem.module.scss';

interface NoteItemProps {
  note: Note;
}

export const NoteItem = ({ note }: NoteItemProps) => {
  const { deleteNote, updateNote, fetchFullNote, loading } = useNotesStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [fullNote, setFullNote] = useState<Note | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  const handleEditClick = async () => {
    setLoadingFull(true);
    setIsEditing(true);
    try {
      const full = await fetchFullNote(note.id);
      setFullNote(full);
      setEditContent(full.content);
    } catch (error) {
      console.error('Failed to load full note:', error);
      setEditContent(note.content);
    } finally {
      setLoadingFull(false);
    }
  };

  const handleSave = async () => {
    if (!editContent.trim()) return;
    await updateNote(note.id, editContent);
    setIsEditing(false);
    setFullNote(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFullNote(null);
  };

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await deleteNote(note.id);
    }
  };


  const formattedDate = new Date(note.timestamp).toLocaleString();

  if (isEditing) {
    return (
      <Card className={styles.editingCard}>
        <textarea
          className={styles.editTextarea}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className={styles.editActions}>
          <Button size="sm" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" variant="primary" onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </div>
      </Card>
    );
  }


  return (
    <Card hover className={styles.item}>
      <div className={styles.content}>
        <p className={styles.text}>{note.content}</p>
        <div className={styles.meta}>
          <span className={styles.date}>📅 {formattedDate}</span>
          {note.device && <span className={styles.device}>📱 {note.device}</span>}
        </div>
      </div>
      <div>
        <Button variant="secondary" size="sm" onClick={handleEditClick}>
          ✏️ Edit
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
          🗑️ Delete
        </Button>
      </div>

    </Card>
  );
};
