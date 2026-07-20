import './styles/global.scss';

import { useNavigationStore } from './router/useNavigationStore';
import { MainWelcomeScreen } from './pages/welcome';
import { Suspense } from 'react';
import React from 'react';

function App() {
  const currentApp = useNavigationStore((state) => state.currentApp);

  if (!currentApp) {
    return <MainWelcomeScreen />;
  }

  const TargetComponent = currentApp.getComponent();

  // Рендерим напрямую без Suspense
  return (
    // Suspense перехватит состояние загрузки, пока Webpack качает чанк микро-приложения
    <Suspense fallback={<div className="router-loader">Загрузка микро-приложения...</div>}>
      {React.createElement(TargetComponent)}
    </Suspense>
  );
}

export default App;
