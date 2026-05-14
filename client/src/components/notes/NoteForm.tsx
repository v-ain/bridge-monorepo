import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import styles from './NoteForm.module.scss';
import { useNoteStoreV2 } from '@/store/useNoteStoreV2';

export const NoteForm = () => {
  const addNote = useNoteStoreV2((state) => state.addNote);
  const isLoading = useNoteStoreV2((state) => state.isLoading);
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Простая защита от пустых строк
    if (!text.trim()) return;

    try {
      await addNote(text);
      setText('');
    } catch (err) {
      // Ошибку можно не обрабатывать локально, она уже запишется в глобальный стейт стора
      console.error('Ошибка при создании заметки в UI');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        value={text}
        onChange={setText}
        placeholder="Write your note here..."
        type="textarea"
        rows={3}
        disabled={isLoading}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={isLoading || !text.trim()}
        loading={isLoading}
      >
        {isLoading ? 'Сохранение...' : 'Создать заметку'}
      </Button>
    </form>
  );
};
