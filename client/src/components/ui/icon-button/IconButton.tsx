import React from 'react';
import styles from './IconButton.module.scss';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}

export const IconButton = ({ children, variant = 'default', className = '', ...props }: IconButtonProps) => {
  return (
    <button
      className={`${styles.iconBtn} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

