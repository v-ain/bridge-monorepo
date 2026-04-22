import React from 'react';
import styles from './LoadingSpinner.module.scss';

export const LoadingSpinner = () => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      <p>Loading notes...</p>
    </div>
  );
};
