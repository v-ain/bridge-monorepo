import './styles/global.scss';

import { useNavigationStore } from './router/useNavigationStore';
import { MainWelcomeScreen } from './pages/welcome';

function App() {
  const currentApp = useNavigationStore((state) => state.currentApp);

  if (!currentApp) {
    return <MainWelcomeScreen />;
  }

  const TargetAppComponent = currentApp.getComponent();

  // Рендерим напрямую без Suspense
  return <TargetAppComponent />;
}

export default App;
