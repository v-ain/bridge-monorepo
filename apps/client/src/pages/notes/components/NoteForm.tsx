import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './NoteForm.module.scss';
import { useNoteStore } from '../store/useNoteStore';
import { CONTENT_MAX_LENGTH, TITLE_MAX_LENGTH, type AppErrorCode } from '@bridge-monorepo/shared';
import { getErrorMessage } from '@/utils/errorMessages';

export const NoteForm = () => {
  const addNote = useNoteStore((state) => state.addNote);
  const isLoading = useNoteStore((state) => state.isLoading);

  const [text, setText] = useState('');
  const [errorKey, setErrorKey] = useState<AppErrorCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorKey(null);

    const trimmedText = text.trim();
    if (!trimmedText) {
      setErrorKey('TITLE_EMPTY' as AppErrorCode);
      return;
    }

    setIsSubmitting(true);

    // 1. Отправляем ВСЮ "простыню" текста в стор.
    // Стор сам нарежет её, отвалидирует через Zod v4 и вернет ошибку, если что-то не так!
    const serverErrorCode = await addNote(trimmedText);

    setIsSubmitting(false);

    if (serverErrorCode) {
      // 2. Если стор или бэк вернули код ошибки, просто выводим её в форму
      setErrorKey(serverErrorCode);
    } else {
      // 3. Успех — очищаем поле ввода для новой заметки
      setText('');
    }
  };

  // Максимальный лимит для всей "простыни" текста на клиенте (например, 5000 символов)
  const MAX_TOTAL_NOTE_LENGTH = TITLE_MAX_LENGTH + CONTENT_MAX_LENGTH + 1; // 100 + 3500 + 1 = 3601

  const isOverLimit = text.length > MAX_TOTAL_NOTE_LENGTH;
  const isButtonDisabled = isLoading || isSubmitting || isOverLimit || !text.trim();

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={`${styles.editTextarea} ${errorKey ? styles.inputError : ''}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (errorKey) setErrorKey(null); // Гасим ошибку, когда юзер начинает вводить текст
        }}
        placeholder="Первая строка станет заголовком, остальные — текстом заметки..."
        rows={3}
        disabled={isLoading || isSubmitting}
      />

      <div className={styles.formMeta}>
        {/* Информативный счетчик символов всей заметки */}
        <span className={isOverLimit ? styles.errorLimit : styles.limit}>
          {text.length} / {MAX_TOTAL_NOTE_LENGTH}
        </span>

        {/* Вывод ошибки на русском языке через хелпер */}
        {errorKey && <span className={styles.errorMessage}>⚠️ {getErrorMessage(errorKey)}</span>}
      </div>

      <Button type="submit" variant="primary" disabled={isButtonDisabled} loading={isLoading || isSubmitting}>
        {isLoading || isSubmitting ? 'Сохранение...' : 'Создать заметку'}
      </Button>
    </form>
  );
};
