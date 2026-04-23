// client/src/components/Layout/Container.tsx
import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ children, className = '' }: ContainerProps) => {
  return (
    <div className={`container ${className}`}>
      {children}
    </div>
  );
};
