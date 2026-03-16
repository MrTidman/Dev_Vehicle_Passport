import { supabase } from './supabase';
import { checkCarPermission, checkCarWritePermission } from './permissions';
import { addHistoryLog } from './history';
import type { ServiceRecord } from '../types';

/**
 * Get all service records for a car
 */
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

/**
 * Add a service record to a car
 */
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