export * from './utils/tokens';
export * from './permissions';
export * from './service-records';
export * from './reminders';
export * from './history';
export * from './transfers';

import { supabase } from './supabase';
import { checkCarOwnerPermission } from './permissions';
import { getUniqueShortcode } from './utils/tokens';
import { addNoteToJournal } from './history';
import type { Car } from '../types';

/**
 * Get user's cars (all cars they have permission to access)
 */
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

/**
 * Add a new car
 */
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

/**
 * Get a car by ID (with permission check)
 */
export async function getCarById(carId: string, userId: string): Promise<Car | null> {
  // Check user has permission to access this car
  const { data: permission } = await supabase
    .from('car_permissions')
    .select('role')
    .eq('car_id', carId)
    .eq('user_id', userId)
    .single();

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

/**
 * Update car notes
 */
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
 * Delete a car and all related data
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