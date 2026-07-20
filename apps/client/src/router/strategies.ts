import React from 'react';

export interface IAppStrategy {
  id: 'notes' | 'github';
  title: string;
  hash: string;
  techStack: string[];
  getComponent(): React.ComponentType;
}

export const LocalNotesStrategy: IAppStrategy = {
  id: 'notes',
  title: 'Локальные заметки',
  hash: '#/notes',
  techStack: ['Node.js', 'JSON FS', 'Zod'],
  getComponent: () => React.lazy(() => import('@/pages/notes').then((module) => ({ default: module.AppNotes }))),
};

export const appRegistry: Record<string, IAppStrategy> = {
  '#/notes': LocalNotesStrategy,
};
