import React from 'react';
import styles from './Input.module.scss';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'textarea';
  rows?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export const Input = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  rows = 3,
  disabled = false,
  error,
  label,
}: InputProps) => {
  const id = React.useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={id}
          className={`${styles.input} ${error ? styles.error : ''}`}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={`${styles.input} ${error ? styles.error : ''}`}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
