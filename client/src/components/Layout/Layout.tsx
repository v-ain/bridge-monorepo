// client/src/components/Layout/Layout.tsx
import React from 'react';
import { Header } from './Header';
import { Container } from './Container';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Container>
          {children}
        </Container>
      </main>
    </div>
  );
};
