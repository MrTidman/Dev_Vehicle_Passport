import { supabase } from './supabase';
import type { Car } from '../types';

export async function getUserCars(userId: string): Promise<Car[]> {
  // First get car_ids user has permissions for
  const { data: permissions, error: permError } = await supabase
    .from('car_permissions')
    .select('car_id')
    .eq('user_id', userId);

  if (permError) throw permError;
  if (!permissions || permissions.length === 0) return [];

  const carIds = permissions.map(p => p.car_id);

  // Then fetch those cars
  const { data, error } = await supabase
    .from('cars')
    .select('*')
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
  // Insert car
  const { data: carData, error: carError } = await supabase
    .from('cars')
    .insert({
      vin: car.vin,
      registration: car.registration,
      make: car.make,
      model: car.model,
      year: car.year,
      fuel_type: car.fuel_type,
      colour: car.colour || null,
      created_by: userId,
    })
    .select()
    .single();

  if (carError) throw carError;

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

export async function getCarById(carId: string): Promise<Car | null> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', carId)
    .single();

  if (error) throw error;
  return data;
}
