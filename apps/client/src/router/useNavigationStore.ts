import { create } from 'zustand';
import { IAppStrategy, appRegistry } from './strategies';

interface NavigationState {
  currentApp: IAppStrategy | null;
  selectApp: (strategy: IAppStrategy | null) => void;
}

// Проверяем наличие window для безопасности окружения
const getInitialApp = (): IAppStrategy | null => {
  if (typeof window === 'undefined') return null;
  return appRegistry[window.location.hash] || null;
};

export const useNavigationStore = create<NavigationState>(() => ({
  currentApp: getInitialApp(),

  selectApp: (strategy) => {
    if (typeof window === 'undefined') return;
    // Браузер сам выстрелит событие hashchange, и код ниже обновит стейт!
    window.location.hash = strategy ? strategy.hash : '';
  },
}));

// Единая точка правды для синхронизации URL и Zustand
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const matchedStrategy = appRegistry[window.location.hash] || null;
    // Сравниваем текущий стейт с новым, чтобы избежать лишних рендеров
    const currentState = useNavigationStore.getState().currentApp;
    if (currentState?.hash !== matchedStrategy?.hash) {
      useNavigationStore.setState({ currentApp: matchedStrategy });
    }
  });
}
