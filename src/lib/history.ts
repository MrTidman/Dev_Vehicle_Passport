import { supabase } from './supabase';
import { checkCarPermission } from './permissions';
import type { NoteJournal, HistoryLogEntry, HistoryEntryType } from '../types';

/**
 * Add a history log entry (general purpose)
 */
export async function addHistoryLog(
  carId: string,
  userId: string,
  content: string,
  entryType: HistoryEntryType = 'NOTE',
  referenceId?: string,
  attachments?: string[]
): Promise<HistoryLogEntry> {
  // Check user has permission on this car
  const { data: permission } = await supabase
    .from('car_permissions')
    .select('role')
    .eq('car_id', carId)
    .eq('user_id', userId)
    .in('role', ['owner', 'mechanic'])
    .single();

  if (!permission) {
    throw new Error('Only owners and mechanics can add history entries');
  }

  const { data, error } = await supabase
    .from('note_journal')
    .insert({
      car_id: carId,
      user_id: userId,
      content,
      entry_type: entryType,
      reference_id: referenceId || null,
      attachments: attachments || null,
    })
    .select('*, id')
    .single();

  if (error) throw error;
  return data as HistoryLogEntry;
}

/**
 * Add a note to the journal (owner only)
 */
export async function addNoteToJournal(
  carId: string,
  content: string,
  userId: string
): Promise<NoteJournal> {
  // Permission check - user must have owner permission on this car
  const { data: permission } = await supabase
    .from('car_permissions')
    .select('role')
    .eq('car_id', carId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .single();

  if (!permission) {
    throw new Error('Only owners can add note journal entries');
  }

  const { data, error } = await supabase
    .from('note_journal')
    .insert({
      car_id: carId,
      user_id: userId,
      content,
      entry_type: 'NOTE',
    })
    .select()
    .single();

  if (error) throw error;
  return data as NoteJournal;
}

/**
 * Get note history for a car
 */
export async function getNoteHistory(carId: string, userId: string): Promise<NoteJournal[]> {
  // Check user has permission to access this car
  const permission = await checkCarPermission(carId, userId);
  if (!permission) {
    throw new Error('Access denied: You do not have permission to view this car');
  }

  const { data, error } = await supabase
    .from('note_journal')
    .select('*, id')
    .eq('car_id', carId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all history log entries for a car (alias for getNoteHistory)
 */
export const getHistoryLog = getNoteHistory;