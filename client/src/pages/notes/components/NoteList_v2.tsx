import React, { useEffect, useState } from 'react';
import { NoteItem } from './NoteItem_v2';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import styles from './NoteList.module.scss';
import { NoteDetail } from './NoteDetail_v2';
import Modal from '@/components/modal/Modal';
import { useNoteStore_v2 } from '../store/useNoteStore_v2';
import { getErrorMessage } from '@/utils/errorMessages';

export const NoteList = () => {
  // Вытаскиваем свойства через селекторы — это гарантирует, что список
  // не будет лишний раз перерисовываться при изменении локальных UI-флагов (например, isEditing)
  const notes = useNoteStore_v2((state) => state.notes);
  const isLoading = useNoteStore_v2((state) => state.isLoading);
  const globalError = useNoteStore_v2((state) => state.globalError);
  const fetchNotes = useNoteStore_v2((state) => state.fetchNotes);

  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const closeSelectModalWindow = () => {
    setSelectedNote(null);
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Лоадер показываем только при первой загрузке, когда массив пустой,
  // чтобы экран не моргал при фоновых обновлениях (добавлении/удалении)
  if (isLoading && notes.length === 0) {
    return <LoadingSpinner />;
  }

  if (globalError) {
    return <ErrorMessage message={getErrorMessage(globalError)} onRetry={fetchNotes} />;
  }

  if (notes.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.icon}>📝</div>
        <p>Заметок пока нет. Создайте свою первую заметку простынёй!</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.list}>
        {notes.map((note) => (
          // Передаем обновленную модель NoteUi в дочерний компонент
          <NoteItem key={note.id} note={note} onModal={setSelectedNote} />
        ))}
      </div>

      {selectedNote && (
        <Modal isOpen={!!selectedNote} onClose={closeSelectModalWindow}>
          <NoteDetail noteId={selectedNote} />
        </Modal>
      )}
    </>
  );
};
