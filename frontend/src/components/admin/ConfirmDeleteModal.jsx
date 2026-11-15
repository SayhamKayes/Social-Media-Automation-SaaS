import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to permanently delete this item? This action cannot be reversed.',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center space-x-1.5"
          >
            {loading ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

