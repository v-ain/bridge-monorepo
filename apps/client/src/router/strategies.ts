import React from 'react';
import { AppNotes as LocalNotesApp } from '@/pages/notes';
import { AppBlogConsole as GithubNotesApp } from '@/pages/blog-console';

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
  getComponent: () => LocalNotesApp,
};

export const appRegistry: Record<string, IAppStrategy> = {
  '#/notes': LocalNotesStrategy,
};
