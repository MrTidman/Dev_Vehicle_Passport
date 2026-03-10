export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  email_verified: boolean;
}

export interface Car {
  id: string;
  vin: string | null;
  registration: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  fuel_type: string | null;
  engine_cc: number | null;
  colour: string | null;
  owner_id: string;
  created_by: string;
  created_at: string;
}

export type CarRole = 'owner' | 'mechanic' | 'viewer';

export interface CarPermission {
  id: string;
  car_id: string;
  user_id: string;
  role: CarRole;
  granted_by: string | null;
  created_at: string;
  // Joined fields
  user?: User;
  car?: Car;
}

export interface ServiceRecord {
  id: string;
  car_id: string;
  added_by: string;
  service_date: string;
  service_type: string | null;
  description: string | null;
  mileage: number | null;
  cost: number | null;
  garage_name: string | null;
  receipts: string[] | null;
  created_at: string;
}

export type ReminderType = 'MOT' | 'tax' | 'insurance' | 'service' | 'custom';
export type RepeatInterval = 'yearly' | '6month' | '3month' | 'monthly' | null;

export interface Reminder {
  id: string;
  car_id: string;
  reminder_type: ReminderType;
  title: string | null;
  description: string | null;
  due_date: string;
  repeat_interval: RepeatInterval;
  completed: boolean;
  created_by: string;
  created_at: string;
}

export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface OwnershipTransfer {
  id: string;
  car_id: string;
  seller_id: string;
  buyer_id: string;
  status: TransferStatus;
  token: string;
  created_at: string;
  completed_at: string | null;
}

export type NotificationType = 'reminder' | 'transfer' | 'service' | 'permission' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  car_id: string | null;
  type: NotificationType;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

// Dashboard view types
export interface CarWithPermission extends Car {
  permission: CarPermission;
  totalSpent?: number;
  serviceCount?: number;
  nextReminder?: Reminder;
}

// DVLA MOT History types
export interface MOTDefect {
  type: 'dangerous' | 'major' | 'minor';
  description: string;
  item: string;
  location: string;
}

export interface MOTTest {
  testDate: string;
  testResult: 'PASSED' | 'FAILED' | 'ABANDONED';
  expiryDate: string | null;
  mileage: number;
  mileageUnit: 'km' | 'miles';
  testNumber: string;
  defects: MOTDefect[];
}

export interface MOTHistory {
  registration: string;
  make: string | null;
  model: string | null;
  firstUsedDate: string | null;
  fuelType: string | null;
  primaryColour: string | null;
  vin: string | null;
  vehicleId: string | null;
  motTests: MOTTest[];
}
