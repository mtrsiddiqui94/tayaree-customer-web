'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from '@/components/ui/Toast.module.css';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isClosing?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerClose = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isClosing: true } : t))
    );
    setTimeout(() => {
      removeToast(id);
    }, 200); // matches CSS fadeOut animation time
  }, [removeToast]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        triggerClose(id);
      }, 4000); // auto dismiss after 4 seconds
    },
    [triggerClose]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => {
          let iconClass = 'bx bx-info-circle';
          let typeClass = styles.toastInfo;

          if (toast.type === 'success') {
            iconClass = 'bx bx-check-circle';
            typeClass = styles.toastSuccess;
          } else if (toast.type === 'error') {
            iconClass = 'bx bx-error-circle';
            typeClass = styles.toastError;
          }

          return (
            <div
              key={toast.id}
              className={`${styles.toast} ${typeClass} ${
                toast.isClosing ? styles.toastClosing : ''
              }`}
            >
              <i className={`${iconClass} ${styles.icon}`}></i>
              <span className={styles.message}>{toast.message}</span>
              <button
                className={styles.closeBtn}
                onClick={() => triggerClose(toast.id)}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // ponytail: no interactive toast during SSR/prerender; no-op stops static export from crashing. Still throws in-browser to catch a genuinely missing provider.
    if (typeof window === 'undefined') return { showToast: () => {} };
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
