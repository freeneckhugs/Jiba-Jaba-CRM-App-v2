import React, { useEffect, useRef } from 'react';

export type ToastType = 'confirm' | 'info' | 'warning';

interface ToastProps {
  message: string;
  onConfirm?: () => void;
  onDismiss: () => void;
  confirmText?: string;
  dismissText?: string;
  type?: ToastType;
}

const Toast: React.FC<ToastProps> = ({ message, onConfirm, onDismiss, confirmText = "Update", dismissText = "Dismiss", type = 'confirm' }) => {
  const toastRef = useRef<HTMLDivElement>(null);
  
  // Auto-dismiss for info toasts
  useEffect(() => {
    if (!onConfirm) { // Auto-dismiss only if it's a simple notification
        const timer = setTimeout(() => {
          onDismiss();
        }, 5000); 

        return () => clearTimeout(timer);
    }
  }, [onDismiss, onConfirm]);

  // Dismiss on outside click for confirmation toasts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toastRef.current && !toastRef.current.contains(event.target as Node)) {
        onDismiss();
      }
    };

    if (onConfirm) { // Only add listener for confirmation toasts
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onDismiss, onConfirm]);

  const toastStyles: Record<ToastType, string> = {
    confirm: 'bg-white',
    info: 'bg-gray-700 text-white',
    warning: 'bg-yellow-100'
  }
  
  const dismissButtonClass = "px-3 py-2 text-sm rounded w-full sm:w-auto justify-center bg-gray-200 text-brand-dark hover:bg-gray-300";
  const confirmButtonClass = `px-3 py-2 text-sm rounded w-full sm:w-auto justify-center text-white ${
    type === 'warning'
    ? 'bg-brand-red hover:bg-red-600'
    : 'bg-brand-blue hover:bg-blue-600'
  }`;

  return (
    <div ref={toastRef} className={`fixed bottom-4 left-4 right-4 md:left-auto md:w-full md:max-w-sm md:right-4 shadow-lg rounded-lg p-4 z-50 animate-fade-in-up ${toastStyles[type]}`}>
      <p className={`mb-3 ${type === 'info' ? 'text-white' : 'text-brand-dark'}`}>{message}</p>
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
        {onConfirm && <button
          onClick={onDismiss}
          className={dismissButtonClass}
        >
          {dismissText}
        </button>
        }
        {onConfirm && (
          <button
            onClick={onConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;