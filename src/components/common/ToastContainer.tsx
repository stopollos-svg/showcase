import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-lg text-xs font-medium transition-all transform animate-in slide-in-from-top-2 duration-200 ${
              isSuccess
                ? 'bg-stone-900 text-white border-stone-800'
                : isError
                ? 'bg-red-50 text-red-900 border-red-200'
                : 'bg-stone-900 text-white border-stone-800'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />}

            <div className="flex-1 leading-snug">{toast.message}</div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-stone-400 hover:text-white p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
