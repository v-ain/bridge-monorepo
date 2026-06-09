import { create } from 'zustand';
import { IAppStrategy, appRegistry } from './strategies';

interface NavigationState {
  currentApp: IAppStrategy | null; // null — это главная страница входа
  selectApp: (strategy: IAppStrategy | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  // При инициализации стора сразу проверяем, нет ли хэша в ссылке
  currentApp: appRegistry[window.location.hash] || null,

  selectApp: (strategy) => {
    // Обновляем хэш в строке браузера (автоматически добавит или уберет #/...)
    window.location.hash = strategy ? strategy.hash : '';
    set({ currentApp: strategy });
  },
}));

// Слушаем нативное событие браузера на изменение хэша
window.addEventListener('hashchange', () => {
  const matchedStrategy = appRegistry[window.location.hash] || null;
  useNavigationStore.setState({ currentApp: matchedStrategy });
});

