import './styles/global.scss';

import { Layout } from './components/Layout/Layout';
import { UserCard } from './components/UserCard';
import { User } from '@shared/index';
import { Button, Card, Input } from './components/ui';
import { useState } from 'react';
import { NoteForm, NoteList } from './components/notes';


// Демо-пользователь (тип из shared)
const demoUser: User = {
  id: 1,
  name: 'AdminName',
  email: 'admin@bridge.local',
  role: 'admin',
};

function App() {
  const [text, setText] = useState('');
  const handleGreet = (user: User) => {
    alert(`Привет, ${user.name}! Твоя роль: ${user.role}`);
  };

  return (
    <Layout>
      <h1>Bridge Monorepo</h1>
      <p>Your personal notes — stored on the server</p>

      <div style={{ margin: '32px', padding: '16px', background: '#e2e8f0', borderRadius: '8px' }}>
        <UserCard user={demoUser} onGreet={handleGreet} />
      </div>

      <NoteForm />
      <NoteList />

    </Layout>

  );
}

export default App;
