import { useSyncExternalStore } from 'react';

// Функция-заглушка для SSR (серверного рендеринга)
const emptySubscribe = () => () => {};

export const usePortal = (wrapperId: string = 'modal-root') => {
  // Подписываемся на состояние DOM-элемента
  return useSyncExternalStore(
    // 1. Функция подписки (в данном случае нам не нужно слушать события, просто возвращаем чистку)
    emptySubscribe,

    // 2. Как получить значение на клиенте
    () => {
      if (typeof document === 'undefined') return null;
      let element = document.getElementById(wrapperId);

      if (!element) {
        element = document.createElement('div');
        element.setAttribute('id', wrapperId);
        document.body.appendChild(element);
      }
      return element;
    },

    // 3. Значение по умолчанию для сервера (SSR)
    () => null
  );
};
