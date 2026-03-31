import { createRoot } from 'react-dom/client';

import "./style.scss"
const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(<h1>Bridge Client Works!</h1>);
}
