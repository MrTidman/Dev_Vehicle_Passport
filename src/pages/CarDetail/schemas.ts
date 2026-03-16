import { z } from 'zod';

// Service Record Form Schema
export const serviceRecordSchema = z.object({
  service_date: z.string().min(1, 'Service date is required'),
  service_type: z.string().optional(),
  description: z.string().max(5000).optional(),
  mileage: z.number().min(0).max(999999).optional(),
  cost: z.number().min(0).max(999999).optional(),
  garage_name: z.string().max(255).optional(),
  receipts: z.array(z.string()).optional(),
});

export type ServiceRecordFormData = z.infer<typeof serviceRecordSchema>;

// Reminder Form Schema
export const reminderSchema = z.object({
  reminder_type: z.enum(['MOT', 'tax', 'insurance', 'service', 'custom']),
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  due_date: z.string().min(1, 'Due date is required'),
  repeat_interval: z.enum(['yearly', '6month', '3month', 'monthly']).optional(),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;

// Transfer Form Schema
export const transferSchema = z.object({
  newOwnerEmail: z.string().email('Valid email is required'),
});

export type TransferFormData = z.infer<typeof transferSchema>;

// Note Form Schema
export const noteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(5000),
});

export type NoteFormData = z.infer<typeof noteSchema>;