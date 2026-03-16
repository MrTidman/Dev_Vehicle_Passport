import { supabase } from './supabase';
import { checkCarOwnerPermission } from './permissions';
import { generateToken } from './utils/tokens';
import type { OwnershipTransfer, Car, CarPermission } from '../types';

/**
 * Get a car by ID (inline implementation to avoid circular deps)
 */
async function getCarByIdInline(carId: string, userId: string): Promise<Car | null> {
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
 * Initiate ownership transfer for a car
 */
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

/**
 * Get a transfer by its token
 */
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

/**
 * Accept an ownership transfer
 */
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
  const car = await getCarByIdInline(transfer.car_id, newOwnerId);
  if (!car) {
    throw new Error('Car not found');
  }

  return { car, permission };
}