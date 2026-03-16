import { useMemo } from 'react';
import { Calendar, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Reminder } from '../../../types';
import { completeReminder } from '../../../lib/cars';

interface ReminderListProps {
  reminders: Reminder[];
  userId: string;
}

export function ReminderList({ reminders, userId }: ReminderListProps) {
  const queryClient = useQueryClient();
  
  // Memoize the "due soon" threshold (30 days from now)
  const dueSoonThreshold = useMemo(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }, []);

  const completeReminderMutation = useMutation({
    mutationFn: (reminderId: string) => completeReminder(reminderId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['historyLog'] });
    },
  });

  if (reminders.length === 0) {
    return <p className="text-slate-500 text-center py-8">No reminders set</p>;
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => {
        const isOverdue = new Date(reminder.due_date) < new Date() && !reminder.completed;
        const isDueSoon = !isOverdue && new Date(reminder.due_date) <= dueSoonThreshold && !reminder.completed;
        
        return (
          <div
            key={reminder.id}
            className={`p-4 border rounded-lg ${
              reminder.completed
                ? 'bg-slate-900/30 border-slate-700'
                : isOverdue
                ? 'bg-red-500/10 border-red-500/30'
                : isDueSoon
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-900/50 border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => !reminder.completed && completeReminderMutation.mutate(reminder.id)}
                  disabled={reminder.completed || completeReminderMutation.isPending}
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    reminder.completed
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-500 hover:border-emerald-400'
                  }`}
                >
                  {reminder.completed && <Check className="w-3 h-3 text-white" />}
                </button>
                <div>
                  <h3 className={`font-medium ${reminder.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                    {reminder.title || reminder.reminder_type}
                  </h3>
                  {reminder.description && (
                    <p className="text-sm text-slate-400 mt-1">{reminder.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      {new Date(reminder.due_date).toLocaleDateString()}
                    </span>
                    {reminder.repeat_interval && (
                      <span className="text-slate-400">
                        Repeats: {reminder.repeat_interval}
                      </span>
                    )}
                    {!reminder.completed && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        isOverdue ? 'bg-red-500/20 text-red-400' : 
                        isDueSoon ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Upcoming'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}