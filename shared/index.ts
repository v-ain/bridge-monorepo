export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}