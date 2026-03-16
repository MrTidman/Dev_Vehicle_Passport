import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Loader2, Send, Mail } from 'lucide-react';
import type { TransferFormData } from '../schemas';

interface TransferFormProps {
  isLoading: boolean;
  successMessage: string | null;
  onSubmit: (data: TransferFormData) => Promise<void>;
  onCancel: () => void;
  register: UseFormRegister<TransferFormData>;
  errors: FieldErrors<TransferFormData>;
}

export function TransferForm({
  isLoading,
  successMessage,
  onSubmit,
  onCancel,
  register,
  errors,
}: TransferFormProps) {
  return (
    <div className="mt-4 p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <Send className="w-4 h-4" />
        Transfer Vehicle Ownership
      </h3>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-400 text-sm break-all">{successMessage}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSubmit({
            newOwnerEmail: formData.get('newOwnerEmail') as string,
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            New Owner's Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              {...register('newOwnerEmail')}
              placeholder="Enter email address"
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500"
            />
          </div>
          {errors.newOwnerEmail && (
            <p className="text-red-400 text-xs mt-1">
              {errors.newOwnerEmail.message}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Send Transfer Request'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}