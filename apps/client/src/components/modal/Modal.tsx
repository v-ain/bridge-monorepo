import { ReactNode, useEffect } from 'react';
import styles from './Modal.module.scss';
import { usePortal } from './usePortal';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  const targetElement = usePortal('modal-root');

  // Закрытие по нажатию Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Блокируем скролл фона
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !targetElement) return null;

  return createPortal(
    <div className={styles['modalOverlay']} onClick={onClose}>
      {/* stopPropagation нужен, чтобы клик внутри самой модалки не закрывал её */}
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть модальное окно">
          &times;
        </button>
        {children}
      </div>
    </div>,
    targetElement
  );
};

export default Modal;
