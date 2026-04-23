import React, { useEffect } from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import { NoteItem } from './NoteItem';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';
import styles from './NoteList.module.scss';

export const NoteList = () => {
  const { notes, loading, error, fetchNotes } = useNotesStore();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  if (loading && notes.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchNotes} />;
  }

  if (notes.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.icon}>📝</div>
        <p>No notes yet. Create your first note!</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} />
      ))}
    </div>
  );
};
