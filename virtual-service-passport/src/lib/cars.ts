import { supabase } from './supabase';
import type { Car, ServiceRecord, Reminder, ReminderType, RepeatInterval } from '../types';

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

// Service Records
export async function getServiceRecords(carId: string): Promise<ServiceRecord[]> {
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
  },
  userId: string
): Promise<ServiceRecord> {
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Reminders
export async function getReminders(carId: string): Promise<Reminder[]> {
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
  return data;
}

export async function completeReminder(reminderId: string): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .update({ completed: true })
    .eq('id', reminderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
