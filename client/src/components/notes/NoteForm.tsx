import React, { useState } from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import styles from './NoteForm.module.scss';

export const NoteForm = () => {
  const [content, setContent] = useState('');
  const { addNote, loading } = useNotesStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addNote(content);
    setContent('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        value={content}
        onChange={setContent}
        placeholder="Write your note here..."
        type="textarea"
        rows={3}
        disabled={loading}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={loading || !content.trim()}
        loading={loading}
      >
        Add Note
      </Button>
    </form>
  );
};
