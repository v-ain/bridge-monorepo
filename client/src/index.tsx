import { createRoot } from 'react-dom/client';
import App from './App';
import "./style.scss"

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found. Check public/index.html');
}

const root = createRoot(container);
root.render(<App />);
