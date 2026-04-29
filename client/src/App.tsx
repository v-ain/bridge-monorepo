import './styles/global.scss';

import { Layout } from './components/Layout/Layout';
import { NoteForm, NoteList } from './components/notes';

function App() {
  return (
    <Layout>
      <div>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1>Bridge Notes Monorepo</h1>
          <p style={{ color: 'var(--gray-500)' }}>Your personal notes — stored on the server</p>
        </div>
        <NoteForm />
        <NoteList />
      </div>
      <div id='modal-root' />
    </Layout>
  );
}

export default App;
