import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import type { ReminderFormData } from '../schemas';

interface ReminderFormProps {
  isLoading: boolean;
  onSubmit: (data: ReminderFormData) => Promise<void>;
  onCancel: () => void;
  register: UseFormRegister<ReminderFormData>;
  errors: FieldErrors<ReminderFormData>;
  defaultDueDate?: string;
}

export function ReminderForm({
  isLoading,
  onSubmit,
  onCancel,
  register,
  errors,
  defaultDueDate,
}: ReminderFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          reminder_type: formData.get('reminder_type') as ReminderFormData['reminder_type'],
          title: formData.get('title') as string || undefined,
          description: formData.get('description') as string || undefined,
          due_date: formData.get('due_date') as string,
          repeat_interval: formData.get('repeat_interval') as ReminderFormData['repeat_interval'] || undefined,
        });
      }}
      className="mb-6 p-4 bg-slate-900/50 border border-slate-600 rounded-lg space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
          <select
            {...register('reminder_type')}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          >
            <option value="MOT">MOT</option>
            <option value="tax">Tax</option>
            <option value="insurance">Insurance</option>
            <option value="service">Service</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Due Date *</label>
          <input
            type="date"
            {...register('due_date')}
            defaultValue={defaultDueDate}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
          {errors.due_date && (
            <p className="text-red-400 text-xs mt-1">{errors.due_date.message}</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
        <input
          type="text"
          {...register('title')}
          placeholder="Reminder title"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
        <input
          type="text"
          {...register('description')}
          placeholder="Optional details"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Repeat</label>
        <select
          {...register('repeat_interval')}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
        >
          <option value="">No repeat</option>
          <option value="yearly">Yearly</option>
          <option value="6month">Every 6 months</option>
          <option value="3month">Every 3 months</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
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
  );
}