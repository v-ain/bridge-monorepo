import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CONTENT_MAX_LENGTH, TITLE_MAX_LENGTH, type AppErrorCode } from '@bridge-monorepo/shared';
import { getErrorMessage } from '@/utils/errorMessages';
import styles from './NoteItem.module.scss';
import { IconButton } from '@/components/ui/icon-button/IconButton';

interface NoteEditFormProps {
  initialValue: string; // Сюда родитель уже передаст собранную "простыню" текста
  onSave: (cleanText: string) => Promise<AppErrorCode | null>;
  onCancel: () => void;
}

export const NoteEditForm = ({ initialValue, onSave, onCancel }: NoteEditFormProps) => {
  const [text, setText] = useState(initialValue);
  const [errorKey, setErrorKey] = useState<AppErrorCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async () => {
    setErrorKey(null);

    const trimmedText = text.trim();
    if (!trimmedText) {
      setErrorKey('TITLE_EMPTY' as AppErrorCode);
      return;
    }

    setIsSubmitting(true);

    // Стор сам внутри нарежет текст, провалидирует Zod-ом и сходит на бэкенд!
    const errorCode = await onSave(trimmedText);

    setIsSubmitting(false);

    // Если стор нашел ошибку (в Zod v4 на клиенте или при ответе сервера) — просто подсвечиваем её
    if (errorCode) {
      setErrorKey(errorCode);
    }
    // Если всё успешно, Zustand-стор поменяет флаг isEditing на false,
    // и родительский NoteItem сам размонтирует эту форму!
  };

  // Максимальный лимит для всего текста (например 5000 символов)
  const MAX_TOTAL_NOTE_LENGTH = TITLE_MAX_LENGTH + CONTENT_MAX_LENGTH + 1; // 100 + 3500 + 1 = 3601

  const isOverLimit = text.length > MAX_TOTAL_NOTE_LENGTH;

  return (
    <Card className={styles.editingCard}>
      <textarea
        className={`${styles.editTextarea} ${errorKey ? styles.inputError : ''}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (errorKey) setErrorKey(null); // Гасим ошибку при начале ввода
        }}
        rows={4}
        autoFocus
        disabled={isSubmitting}
      />

      <div className={styles.formMeta}>
        {/* Информативный счетчик общей длины текста */}
        <span className={isOverLimit ? styles.errorLimit : styles.limit}>
          {text.length} / {MAX_TOTAL_NOTE_LENGTH}
        </span>

        {/* Рендерим текст ошибки через твой хелпер */}
        {errorKey && <span className={styles.errorMessage}>⚠️ {getErrorMessage(errorKey)}</span>}
      </div>

      <div className={styles.editActions}>
        <IconButton
          onClick={handleFormSubmit}
          disabled={isSubmitting || isOverLimit || !text.trim()}
          title="Сохранить изменения"
        >
          ✅
        </IconButton>
        <IconButton variant="danger" onClick={onCancel} disabled={isSubmitting} title="Отменить редактирование">
          ❌
        </IconButton>
      </div>
    </Card>
  );
};
