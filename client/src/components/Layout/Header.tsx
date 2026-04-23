// client/src/components/Layout/Header.tsx
import React from 'react';
import styles from './Header.module.scss';

export const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          📝 Bridge Notes
        </div>
        <nav className={styles.nav}>
          <a href="/" className={styles.link}>Notes</a>
          <a href="/about" className={styles.link}>About</a>
        </nav>
      </div>
    </header>
  );
};
