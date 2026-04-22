import './styles/global.scss';

import { Layout } from './components/Layout/Layout';
import { UserCard } from './components/UserCard';
import { User } from '@shared/index';
import { Button, Card, Input } from './components/ui';
import { useState } from 'react';


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
      <p>Клиент работает, shared типы подключены! ✅</p>

      <UserCard user={demoUser} onGreet={handleGreet} />

      <div style={{ marginTop: '32px', padding: '16px', background: '#e2e8f0', borderRadius: '8px' }}>
        <small>
          🔍 Проверка: <code>User</code> тип из <code>@shared/index</code> работает
        </small>
      </div>
      <div className='pt-2'>
        <h1>UI Kit Demo</h1>
        <p>Testing Button, Input, and Card components</p>

        <Card hover>
          <h3>Card Component</h3>
          <p>This card has hover effect</p>
          <Input
            value={text}
            onChange={setText}
            placeholder="Type something..."
            label="Test Input"
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Card>
      </div>

    </Layout>

  );
}

export default App;
