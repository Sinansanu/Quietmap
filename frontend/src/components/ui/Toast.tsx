import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 ${
            toast.type === 'error'
              ? 'bg-red-50/95 border-red-200 text-red-800'
              : toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : 'bg-forest-50/95 border-forest-200 text-forest-800'
          }`}
          role="status"
        >
          {toast.type === 'error' && <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />}
          {toast.type === 'success' && <CheckCircle size={18} className="shrink-0 text-emerald-600 mt-0.5" />}
          {toast.type === 'info' && <Info size={18} className="shrink-0 text-forest-600 mt-0.5" />}
          <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
