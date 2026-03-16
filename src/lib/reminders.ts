import { supabase } from './supabase';
import { checkCarPermission, checkCarWritePermission } from './permissions';
import { addHistoryLog } from './history';
import type { Reminder, ReminderType, RepeatInterval } from '../types';

/**
 * Get all reminders for a car
 */
export async function getReminders(carId: string, userId: string): Promise<Reminder[]> {
  // Check user has permission to access this car
  const permission = await checkCarPermission(carId, userId);
  if (!permission) {
    throw new Error('Access denied: You do not have permission to view this car');
  }

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('car_id', carId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Add a reminder to a car
 */
export async function addReminder(
  reminder: {
    car_id: string;
    reminder_type: ReminderType;
    title?: string;
    description?: string;
    due_date: string;
    repeat_interval?: RepeatInterval;
  },
  userId: string
): Promise<Reminder> {
  // Check user has owner or mechanic permission
  const hasPermission = await checkCarWritePermission(reminder.car_id, userId);
  if (!hasPermission) {
    throw new Error('Access denied: You must be the owner or a mechanic to add reminders');
  }

  const { data, error } = await supabase
    .from('reminders')
    .insert({
      car_id: reminder.car_id,
      reminder_type: reminder.reminder_type,
      title: reminder.title || null,
      description: reminder.description || null,
      due_date: reminder.due_date,
      repeat_interval: reminder.repeat_interval || null,
      completed: false,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-log the reminder creation to history
  const content = `Reminder: ${data.title || data.reminder_type}`;
  await addHistoryLog(
    reminder.car_id,
    userId,
    content,
    'REMINDER_CREATED',
    data.id
  );

  return data;
}

/**
 * Mark a reminder as completed
 */
export async function completeReminder(reminderId: string, userId: string): Promise<Reminder> {
  // First get the reminder to find the car_id
  const { data: reminder, error: fetchError } = await supabase
    .from('reminders')
    .select('car_id, title, reminder_type')
    .eq('id', reminderId)
    .single();

  if (fetchError || !reminder) {
    throw new Error('Reminder not found');
  }

  // Check user has permission to complete reminders
  const hasPermission = await checkCarWritePermission(reminder.car_id, userId);
  if (!hasPermission) {
    throw new Error('Access denied: You must be the owner or a mechanic to complete reminders');
  }

  const { data, error } = await supabase
    .from('reminders')
    .update({ completed: true })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw error;

  // Auto-log the reminder completion to history
  const content = `Reminder: ${reminder.title || reminder.reminder_type} - Completed`;
  await addHistoryLog(
    reminder.car_id,
    userId,
    content,
    'REMINDER_COMPLETED',
    reminderId
  );

  return data;
}