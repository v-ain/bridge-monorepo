import React, { useEffect, useState } from 'react';
import { NoteItem } from './NoteItem';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';
import styles from './NoteList.module.scss';
import { NoteDetail } from './NoteDetail';
import Modal from '../modal/Modal';
import { useNoteStore } from '@/store/useNoteStore';

export const NoteList = () => {
  const { notes, isLoading, error, fetchNotes } = useNoteStore();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const closeSelectModalWindow = () => { setSelectedNote(null) }

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  if (isLoading) {
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
    <>
      <div className={styles.list}>
        {notes.map((note) => (
          <NoteItem key={note.id} note={note} onModal={setSelectedNote} />
        ))}
      </div>
      {selectedNote && (<Modal isOpen={!!selectedNote} onClose={closeSelectModalWindow}>
        <NoteDetail noteId={selectedNote} />
      </Modal>
      )}
    </>
  );
};
