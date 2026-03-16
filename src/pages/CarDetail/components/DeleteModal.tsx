import { Loader2, Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  carMake: string;
  carModel: string;
  registration: string;
  confirmText: string;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onConfirmTextChange: (text: string) => void;
}

export function DeleteModal({
  isOpen,
  carMake,
  carModel,
  registration,
  confirmText,
  isDeleting,
  error,
  onConfirm,
  onCancel,
  onConfirmTextChange,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-red-500/30 rounded-xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="p-2 bg-red-500/20 rounded-full">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Delete Vehicle</h2>
            <p className="text-sm text-slate-400">This action cannot be undone</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-slate-300">
            Are you sure you want to delete <span className="font-semibold text-white">{carMake} {carModel}</span> ({registration})?
          </p>
          <p className="text-sm text-slate-400">
            All data related to this vehicle will be permanently deleted, including:
          </p>
          <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
            <li>Service records</li>
            <li>Reminders</li>
            <li>Vehicle history notes</li>
            <li>Ownership transfer history</li>
          </ul>

          {/* Confirmation Input */}
          <div className="pt-2">
            <label htmlFor="deleteConfirm" className="block text-sm font-medium text-slate-300 mb-2">
              Type <span className="font-mono text-white bg-slate-700 px-1.5 py-0.5 rounded">{registration}</span> to confirm deletion
            </label>
            <input
              id="deleteConfirm"
              type="text"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value.toUpperCase())}
              placeholder="Enter registration number"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoComplete="off"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== registration?.toUpperCase() || isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}