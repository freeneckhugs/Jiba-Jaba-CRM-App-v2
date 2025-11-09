import React, { useEffect } from 'react';

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
  useEffect(() => {
    if (!onConfirm) { // Auto-dismiss only if it's a simple notification
        const timer = setTimeout(() => {
          onDismiss();
        }, 5000); 

        return () => clearTimeout(timer);
    }
  }, [onDismiss, onConfirm]);

  const toastStyles: Record<ToastType, string> = {
    confirm: 'bg-white',
    info: 'bg-gray-700 text-white',
    warning: 'bg-yellow-100'
  }
  
  const buttonStyles: Record<ToastType, string> = {
      confirm: 'bg-gray-200 text-brand-dark hover:bg-gray-300',
      info: 'bg-gray-600 text-white hover:bg-gray-500',
      warning: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300',
  }

  return (
    <div className={`fixed bottom-5 right-5 shadow-lg rounded-lg p-4 w-full max-w-sm z-50 animate-fade-in-up ${toastStyles[type]}`}>
      <p className={`mb-3 ${type === 'info' ? 'text-white' : 'text-brand-dark'}`}>{message}</p>
      <div className="flex justify-end space-x-3">
        {onConfirm && <button
          onClick={onDismiss}
          className={`px-3 py-1 text-sm rounded ${buttonStyles[type]}`}
        >
          {dismissText}
        </button>
        }
        {onConfirm && (
          <button
            onClick={onConfirm}
            className="px-3 py-1 text-sm bg-brand-blue text-white rounded hover:bg-blue-600"
          >
            {confirmText}
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;