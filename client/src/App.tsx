import './styles/global.scss';

import { Layout } from './components/Layout/Layout';
import { UserCard } from './components/UserCard';
import { User } from '@shared/index';


// Демо-пользователь (тип из shared)
const demoUser: User = {
  id: 1,
  name: 'AdminName',
  email: 'admin@bridge.local',
  role: 'admin',
};

function App() {
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
    </Layout>

  );
}

export default App;
