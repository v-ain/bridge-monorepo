import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './NoteForm.module.scss';
import { useNoteStore } from './store/useNoteStore';
import { NoteInputSchema, NOTE_MAX_LENGTH, AppErrorCode } from '@bridge-monorepo/shared';
import { parseZodError } from '../../utils/parseZodError'; // проверь путь до утилит
import { getErrorMessage } from '../../utils/errorMessages'; // проверь путь до утилит

export const NoteForm = () => {
  const addNote = useNoteStore((state) => state.addNote);
  // Оставляем isLoading, если он нужен для глобального дизейбла
  const isLoading = useNoteStore((state) => state.isLoading);

  const [text, setText] = useState('');
  const [errorKey, setErrorKey] = useState<AppErrorCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorKey(null);

    // 1. Клиентская валидация через Zod (с авто-тримом)
    const result = NoteInputSchema.safeParse({ title: text });

    if (!result.success) {
      const code = parseZodError(result.error);
      setErrorKey(code);
      return; // Сеть не трогаем, если Zod завершился ошибкой
    }

    setIsSubmitting(true);

    // 2. Отправка на сервер очищенного текста (результат Zod)
    const serverErrorCode = await addNote(result.data.title);

    setIsSubmitting(false);

    if (serverErrorCode) {
      // 3. Если сервер вернул ошибку, выводим её в форму
      setErrorKey(serverErrorCode);
    } else {
      // 4. Если всё успешно — очищаем поле ввода для новой заметки
      setText('');
    }
  };

  const isOverLimit = text.length > NOTE_MAX_LENGTH;
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
        placeholder="Write your note here..."
        rows={3}
        disabled={isLoading || isSubmitting}
      />

      <div className={styles.formMeta}>
        {/* Счетчик символов на основе константы из shared */}
        <span className={isOverLimit ? styles.errorLimit : styles.limit}>
          {text.length} / {NOTE_MAX_LENGTH}
        </span>

        {/* Вывод ошибки на русском языке */}
        {errorKey && (
          <span className={styles.errorMessage}>
            ⚠️ {getErrorMessage(errorKey)}
          </span>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isButtonDisabled}
        loading={isLoading || isSubmitting}
      >
        {isLoading || isSubmitting ? 'Сохранение...' : 'Создать заметку'}
      </Button>
    </form>
  );
};

