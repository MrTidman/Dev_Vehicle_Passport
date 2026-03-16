import { supabase } from './supabase';
import type { Car, ServiceRecord, Reminder, ReminderType, RepeatInterval, CarPermission, NoteJournal, HistoryLogEntry, HistoryEntryType } from '../types';

function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(array[i] % chars.length);
  }
  return token;
}

/**
 * Generate a unique shortcode in format VSP-XXX (3 random alphanumeric chars)
 */
function generateShortcode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  return `VSP-${code}`;
}

/**
 * Generate a unique shortcode that doesn't exist in the database
 */
async function getUniqueShortcode(): Promise<string> {
  let shortcode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    shortcode = generateShortcode();
    const { data } = await supabase
      .from('cars')
      .select('shortcode')
      .eq('shortcode', shortcode)
      .single();
    
    if (!data) {
      return shortcode;
    }
    attempts++;
  } while (attempts < maxAttempts);

  // Fallback: use cryptographically random code if we can't find a unique one
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  let fallback = '';
  for (let i = 0; i < 8; i++) {
    fallback += chars.charAt(array[i] % chars.length);
  }
  return `VSP-${fallback}`;
}

/**
 * Check if a user has permission to access a car
 * Returns the permission object if user has access, null otherwise
 */
async function checkCarPermission(carId: string, userId: string): Promise<{ role: string } | null> {
  const { data, error } = await supabase
    .from('car_permissions')
    .select('role')
    .eq('car_id', carId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as { role: string };
}

/**
 * Check if user has owner or mechanic role (for write operations)
 */
async function checkCarWritePermission(carId: string, userId: string): Promise<boolean> {
  const permission = await checkCarPermission(carId, userId);
  if (!permission) return false;
  return permission.role === 'owner' || permission.role === 'mechanic';
}

/**
 * Check if user is the owner of a car
 */
async function checkCarOwnerPermission(carId: string, userId: string): Promise<boolean> {
  const permission = await checkCarPermission(carId, userId);
  if (!permission) return false;
  return permission.role === 'owner';
}

//Car Notes
export async function updateCarNotes(
  carId: string,
  notes: string,
  userId: string
): Promise<Car> {
  // Check user is the owner
  const isOwner = await checkCarOwnerPermission(carId, userId);
  if (!isOwner) {
    throw new Error('Access denied: Only the owner can update notes');
  }

  const { data, error } = await supabase
    .from('cars')
    .update({ notes })
    .eq('id', carId)
    .select()
    .single();

  if (error) throw error;

  // Add note to journal
  await addNoteToJournal(carId, notes, userId);

  return data;
}

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
 * Get all history log entries for a car (alias for getNoteHistory for clarity)
 */
export async function getHistoryLog(carId: string, userId: string): Promise<HistoryLogEntry[]> {
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

export async function getUserCars(userId: string): Promise<Car[]> {
  // First get car_ids user has permissions for
  const { data: permissions, error: permError } = await supabase
    .from('car_permissions')
    .select('car_id')
    .eq('user_id', userId);

  if (permError) throw permError;
  if (!permissions || permissions.length === 0) return [];

  const carIds = permissions.map(p => p.car_id);

  // Then fetch those cars (exclude full VIN for security, use vin_last6 instead)
  const { data, error } = await supabase
    .from('cars')
    .select('id, registration, make, model, year, fuel_type, colour, shortcode, vin_last6, notes, created_at, created_by')
    .in('id', carIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addCar(
  car: {
    vin: string;
    registration: string;
    make: string;
    model: string;
    year: number;
    fuel_type: string;
    colour?: string;
  },
  userId: string
): Promise<Car> {
  // Generate unique shortcode
  const shortcode = await getUniqueShortcode();

  // Extract last 6 characters of VIN for masked storage
  const vinLast6 = car.vin ? car.vin.slice(-6).toUpperCase() : null;

  // Insert car
  const { data: carData, error: carError } = await supabase
    .from('cars')
    .insert({
      vin: car.vin,
      vin_last6: vinLast6,
      registration: car.registration,
      make: car.make,
      model: car.model,
      year: car.year,
      fuel_type: car.fuel_type,
      colour: car.colour || null,
      shortcode: shortcode,
      created_by: userId,
    })
    .select()
    .single();

  if (carError) {
    // Handle duplicate key errors with user-friendly messages
    const errorDetails = carError.details || carError.message || '';
    if (carError.code === '23505' && errorDetails.includes('vin')) {
      throw new Error('A car with this VIN already exists');
    }
    if (carError.code === '23505' && errorDetails.includes('registration')) {
      throw new Error('A car with this registration already exists');
    }
    throw carError;
  }

  // Add owner permission
  const { error: permError } = await supabase
    .from('car_permissions')
    .insert({
      car_id: carData.id,
      user_id: userId,
      role: 'owner',
      granted_by: userId,
    });

  if (permError) throw permError;

  return carData;
}

export async function getCarById(carId: string, userId: string): Promise<Car | null> {
  // Check user has permission to access this car
  const permission = await checkCarPermission(carId, userId);
  if (!permission) {
    throw new Error('Access denied: You do not have permission to view this car');
  }

  // Exclude full VIN for security, use vin_last6 instead
  const { data, error } = await supabase
    .from('cars')
    .select('id, registration, make, model, year, fuel_type, colour, shortcode, vin_last6, notes, created_at, created_by')
    .eq('id', carId)
    .single();

  if (error) throw error;
  return data;
}

// Service Records
export async function getServiceRecords(carId: string, userId: string): Promise<ServiceRecord[]> {
  // Check user has permission to access this car
  const permission = await checkCarPermission(carId, userId);
  if (!permission) {
    throw new Error('Access denied: You do not have permission to view this car');
  }

  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('car_id', carId)
    .order('service_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addServiceRecord(
  record: {
    car_id: string;
    service_date: string;
    service_type?: string;
    description?: string;
    mileage?: number;
    cost?: number;
    garage_name?: string;
    receipts?: string[];
  },
  userId: string
): Promise<ServiceRecord> {
  // Check user has owner or mechanic permission
  const hasPermission = await checkCarWritePermission(record.car_id, userId);
  if (!hasPermission) {
    throw new Error('Access denied: You must be the owner or a mechanic to add service records');
  }

  const { data, error } = await supabase
    .from('service_records')
    .insert({
      car_id: record.car_id,
      added_by: userId,
      service_date: record.service_date,
      service_type: record.service_type || null,
      description: record.description || null,
      mileage: record.mileage || null,
      cost: record.cost || null,
      garage_name: record.garage_name || null,
      receipts: record.receipts || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-log the service record to history
  const costStr = data.cost ? ` - £${data.cost.toFixed(2)}` : '';
  const receiptStr = data.receipts && data.receipts.length > 0 ? ` - [Receipt]` : '';
  const content = `Service: ${data.service_type || 'Service'}${costStr} - ${new Date(data.service_date).toLocaleDateString()}${receiptStr}`;
  
  await addHistoryLog(
    record.car_id,
    userId,
    content,
    'SERVICE_ADDED',
    data.id,
    data.receipts || undefined
  );

  return data;
}

// Reminders
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

// Ownership Transfer (keep locally for now - has different fields than the DB actual columns)
export interface OwnershipTransfer {
  id: string;
  car_id: string;
  seller_id: string;
  new_owner_email: string;
  token: string;
  token_expires_at: string | null;
  accepted: boolean;
  created_at: string;
  accepted_at?: string;
}

export async function transferOwnership(
  carId: string,
  newOwnerEmail: string,
  userId: string
): Promise<{ transfer: OwnershipTransfer; emailLink: string }> {
  // Check user is the owner
  const isOwner = await checkCarOwnerPermission(carId, userId);
  if (!isOwner) {
    throw new Error('Access denied: Only the owner can transfer ownership');
  }

  // Generate unique token
  const token = generateToken(32);
  const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  
  // Save transfer request to ownership_transfers table
  const { data: transfer, error: transferError } = await supabase
    .from('ownership_transfers')
    .insert({
      car_id: carId,
      seller_id: userId,
      new_owner_email: newOwnerEmail,
      token: token,
      token_expires_at: tokenExpiresAt,
      accepted: false,
    })
    .select()
    .single();

  if (transferError) throw transferError;

  // Generate email link (for now just log it since we don't have email sending)
  const emailLink = `${window.location.origin}/transfer/${token}`;
  
  console.log('=== OWNERSHIP TRANSFER EMAIL ===');
  console.log(`To: ${newOwnerEmail}`);
  console.log(`Subject: Vehicle Transfer Request`);
  console.log(`Message: Someone wants to transfer a vehicle to you. Click here to accept: ${emailLink}`);
  console.log('================================');

  return { transfer, emailLink };
}

export async function getTransferByToken(token: string): Promise<OwnershipTransfer | null> {
  const { data, error } = await supabase
    .from('ownership_transfers')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single();

  if (error) return null;
  return data as OwnershipTransfer;
}

export async function acceptTransfer(
  token: string,
  newOwnerId: string
): Promise<{ car: Car; permission: CarPermission }> {
  // Get the transfer
  const transfer = await getTransferByToken(token);
  if (!transfer) {
    throw new Error('Transfer not found or already accepted');
  }

  // Check if token has expired
  if (transfer.token_expires_at && new Date(transfer.token_expires_at) < new Date()) {
    throw new Error('This transfer link has expired. Please request a new transfer.');
  }

  // Verify the accepting user's email matches the transfer record
  const { data: userData } = await supabase.auth.getUser(newOwnerId);
  const userEmail = userData?.user?.email;
  if (!userEmail || userEmail !== transfer.new_owner_email) {
    throw new Error('You are not authorized to accept this transfer');
  }

  // Mark transfer as accepted
  const { error: updateError } = await supabase
    .from('ownership_transfers')
    .update({ 
      accepted: true, 
      accepted_at: new Date().toISOString() 
    })
    .eq('id', transfer.id);

  if (updateError) throw updateError;

  // Add car_permission for the new owner
  const { data: permission, error: permError } = await supabase
    .from('car_permissions')
    .insert({
      car_id: transfer.car_id,
      user_id: newOwnerId,
      role: 'owner',
      granted_by: transfer.seller_id,
    })
    .select()
    .single();

  if (permError) throw permError;

  // Get car details (the new owner now has permission after previous insert)
  const car = await getCarById(transfer.car_id, newOwnerId);
  if (!car) {
    throw new Error('Car not found');
  }

  return { car, permission };
}

export async function getCarPermissions(carId: string) {
  const { data, error } = await supabase
    .from('car_permissions')
    .select('*')
    .eq('car_id', carId);

  if (error) throw error;
  return data || [];
}

/**
 * Delete a car and all related data (cascade delete via RLS-triggered cascade,
 * or manual deletion of related records)
 */
export async function deleteCar(carId: string, userId: string): Promise<void> {
  // First verify user has owner permission on this car
  const { data: permission, error: permError } = await supabase
    .from('car_permissions')
    .select('role')
    .eq('car_id', carId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .single();

  if (permError || !permission) {
    throw new Error('You do not have permission to delete this car');
  }

  // Delete related records (manual cascade for data integrity)
  // Delete service records
  const { error: serviceError } = await supabase
    .from('service_records')
    .delete()
    .eq('car_id', carId);
  if (serviceError) throw serviceError;

  // Delete reminders
  const { error: reminderError } = await supabase
    .from('reminders')
    .delete()
    .eq('car_id', carId);
  if (reminderError) throw reminderError;

  // Delete ownership transfers
  const { error: transferError } = await supabase
    .from('ownership_transfers')
    .delete()
    .eq('car_id', carId);
  if (transferError) throw transferError;

  // Delete note journal entries
  const { error: noteError } = await supabase
    .from('note_journal')
    .delete()
    .eq('car_id', carId);
  if (noteError) throw noteError;

  // Delete car permissions
  const { error: carPermError } = await supabase
    .from('car_permissions')
    .delete()
    .eq('car_id', carId);
  if (carPermError) throw carPermError;

  // Finally delete the car itself
  const { error: carError } = await supabase
    .from('cars')
    .delete()
    .eq('id', carId);
  if (carError) throw carError;
}
