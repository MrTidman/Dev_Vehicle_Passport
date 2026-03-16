import { supabase } from './supabase';
import type { CarPermission } from '../types';

/**
 * Check if a user has permission to access a car
 * Returns the permission object if user has access, null otherwise
 */
export async function checkCarPermission(carId: string, userId: string): Promise<{ role: string } | null> {
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
export async function checkCarWritePermission(carId: string, userId: string): Promise<boolean> {
  const permission = await checkCarPermission(carId, userId);
  if (!permission) return false;
  return permission.role === 'owner' || permission.role === 'mechanic';
}

/**
 * Check if user is the owner of a car
 */
export async function checkCarOwnerPermission(carId: string, userId: string): Promise<boolean> {
  const permission = await checkCarPermission(carId, userId);
  if (!permission) return false;
  return permission.role === 'owner';
}

/**
 * Get all permissions for a car
 */
export async function getCarPermissions(carId: string): Promise<CarPermission[]> {
  const { data, error } = await supabase
    .from('car_permissions')
    .select('*')
    .eq('car_id', carId);

  if (error) throw error;
  return data || [];
}