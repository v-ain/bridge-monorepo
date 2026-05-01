
import { useState, useLayoutEffect } from 'react';

export const usePortal = (wrapperId: string = 'modal-root') => {
  const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let element = document.getElementById(wrapperId);
    let created = false;

    // Если элемента с таким id нет (забыли добавить в html), создаем его сами
    if (!element) {
      created = true;
      element = document.createElement('div');
      element.setAttribute('id', wrapperId);
      document.body.appendChild(element);
    }

    setWrapperElement(element);

    // Удаляем созданный элемент при размонтировании, если мы его сами создавали
    return () => {
      if (created && element?.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [wrapperId]);

  return wrapperElement;
};
