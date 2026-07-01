import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { NoteInputSchema, NOTE_MAX_LENGTH, AppErrorCode } from '@bridge-monorepo/shared';
import { parseZodError } from '@/utils/parseZodError';
import { getErrorMessage } from '@/utils/errorMessages';
import styles from './NoteItem.module.scss';
import { IconButton } from '@/components/ui/icon-button/IconButton';

interface NoteEditFormProps {
  initialValue: string;
  onSave: (cleanText: string) => Promise<AppErrorCode | null>;
  onCancel: () => void;
}

export const NoteEditForm = ({ initialValue, onSave, onCancel }: NoteEditFormProps) => {
  const [text, setText] = useState(initialValue);
  // Стейт хранит строгий AppErrorCode или null
  const [errorKey, setErrorKey] = useState<AppErrorCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async () => {
    setErrorKey(null);

    // 1. Валидация через Zod. Схема сама сделает .trim()
    const result = NoteInputSchema.safeParse({ title: text });

    if (!result.success) {
      // 2. Извлекаем код ошибки из Zod
      const code = parseZodError(result.error);
      setErrorKey(code);
      return; // Блокируем отправку запроса в сеть
    }

    setIsSubmitting(true);

    // Отправка на сервер через проп onSave (который вызывает стор)
    const serverErrorCode = await onSave(result.data.title);

    setIsSubmitting(false);

    // 3. Если сервер вернул ошибку, просто сетим её в стейт
    if (serverErrorCode) {
      setErrorKey(serverErrorCode);
    }
    // Если ошибки нет, родитель NoteItem сам размонтирует форму
  };

  // Вычисляем, превышен ли лимит прямо сейчас в UI
  const isOverLimit = text.length > NOTE_MAX_LENGTH;

  return (
    <Card className={styles.editingCard}>
      <textarea
        className={`${styles.editTextarea} ${errorKey ? styles.inputError : ''}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (errorKey) setErrorKey(null); // Гасим ошибку, как только юзер начал вводить текст
        }}
        rows={4}
        autoFocus
      />

      <div className={styles.formMeta}>
        {/* Счетчик символов на основе константы из shared */}
        <span className={isOverLimit ? styles.errorLimit : styles.limit}>
          {text.length} / {NOTE_MAX_LENGTH}
        </span>

        {/* Рендерим русский текст с помощью функции getErrorMessage */}
        {errorKey && <span className={styles.errorMessage}>⚠️ {getErrorMessage(errorKey)}</span>}
      </div>

      <div className={styles.editActions}>
        <IconButton onClick={handleFormSubmit} disabled={isSubmitting || isOverLimit} title="Сохранить изменения">
          ✅
        </IconButton>
        <IconButton variant="danger" onClick={onCancel} disabled={isSubmitting} title="Отменить редактирование">
          ❌
        </IconButton>
      </div>
    </Card>
  );
};
