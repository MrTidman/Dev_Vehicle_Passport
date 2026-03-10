import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../lib/auth';
import { getCarById, getServiceRecords, addServiceRecord, getReminders, addReminder, completeReminder, transferOwnership } from '../lib/cars';
import { fetchMOTHistory, getMOTStatus } from '../lib/dvla';
import { Car, Wrench, Bell, Plus, Loader2, Calendar, MapPin, Gauge, Check, UserPlus, Mail, Send } from 'lucide-react';

// Service Record Form Schema
const serviceRecordSchema = z.object({
  service_date: z.string().min(1, 'Service date is required'),
  service_type: z.string().optional(),
  description: z.string().optional(),
  mileage: z.number().optional(),
  cost: z.number().optional(),
  garage_name: z.string().optional(),
});

type ServiceRecordFormData = z.infer<typeof serviceRecordSchema>;

// Reminder Form Schema
const reminderSchema = z.object({
  reminder_type: z.enum(['MOT', 'tax', 'insurance', 'service', 'custom']),
  title: z.string().optional(),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  repeat_interval: z.enum(['yearly', '6month', '3month', 'monthly']).optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

// Transfer Form Schema
const transferSchema = z.object({
  newOwnerEmail: z.string().email('Valid email is required'),
});

type TransferFormData = z.infer<typeof transferSchema>;

export function CarDetail() {
  const { id: carId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  
  // For now, user is always owner if they can see the car
  const userRole = 'owner';
  void showTransferForm; // Used in the template
  
  // Fetch car details
  const { data: car, isLoading: carLoading, error: carError } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => getCarById(carId!),
    enabled: !!carId,
  });

  // Fetch service records
  const { data: serviceRecords, isLoading: servicesLoading } = useQuery({
    queryKey: ['serviceRecords', carId],
    queryFn: () => getServiceRecords(carId!),
    enabled: !!carId,
  });

  // Fetch reminders
  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminders', carId],
    queryFn: () => getReminders(carId!),
    enabled: !!carId,
  });

  // Fetch MOT history
  const { data: motHistory } = useQuery({
    queryKey: ['motHistory', car?.registration],
    queryFn: () => fetchMOTHistory(car!.registration || ''),
    enabled: false, // Only fetch on demand
  });

  // Compute MOT status
  if (motHistory) {
    getMOTStatus(motHistory);
  }

  // Add service record mutation
  const addServiceMutation = useMutation({
    mutationFn: (data: ServiceRecordFormData) => addServiceRecord({ ...data, car_id: carId! }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRecords', carId] });
      setShowServiceForm(false);
    },
  });

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: (data: ReminderFormData) => addReminder({ ...data, car_id: carId! }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', carId] });
      setShowReminderForm(false);
    },
  });

  // Complete reminder mutation
  const completeReminderMutation = useMutation({
    mutationFn: completeReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', carId] });
    },
  });

  // Transfer ownership mutation
  const transferMutation = useMutation({
    mutationFn: (data: TransferFormData) => transferOwnership(carId!, data.newOwnerEmail, user!.id),
    onSuccess: (data) => {
      setTransferSuccess(`Transfer initiated! Email link: ${data.emailLink}`);
      setShowTransferForm(false);
    },
  });

  // Service record form
  const serviceForm = useForm<ServiceRecordFormData>({
    resolver: zodResolver(serviceRecordSchema),
    defaultValues: {
      service_date: new Date().toISOString().split('T')[0],
    },
  });

  // Reminder form
  const reminderForm = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      reminder_type: 'service',
      due_date: new Date().toISOString().split('T')[0],
    },
  });

  // Transfer form
  const transferForm = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      newOwnerEmail: '',
    },
  });

  if (carLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (carError || !car) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link to="/dashboard" className="text-emerald-400 hover:underline flex items-center gap-2">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          Failed to load car details. Please try again.
        </div>
      </div>
    );
  }

  const isLoading = servicesLoading || remindersLoading;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Link */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-emerald-400 hover:underline flex items-center gap-2">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Car Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 rounded-xl">
              <Car className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {car.make} {car.model}
              </h1>
              <p className="text-slate-400 text-lg">{car.registration}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                {car.year && <span>{car.year}</span>}
                {car.fuel_type && <span>• {car.fuel_type}</span>}
                {car.colour && <span>• {car.colour}</span>}
              </div>
            </div>
          </div>
        </div>
        
        {car.vin && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-500">VIN: {car.vin}</p>
          </div>
        )}

        {/* Transfer Button */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={() => setShowTransferForm(!showTransferForm)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Transfer Ownership
          </button>

          {/* Transfer Form */}
          {showTransferForm && (
            <div className="mt-4 p-4 bg-slate-900/50 border border-slate-600 rounded-lg">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Transfer Vehicle Ownership
              </h3>
              
              {transferSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm break-all">{transferSuccess}</p>
                </div>
              )}

              <form
                onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    New Owner's Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      {...transferForm.register('newOwnerEmail')}
                      placeholder="Enter email address"
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500"
                    />
                  </div>
                  {transferForm.formState.errors.newOwnerEmail && (
                    <p className="text-red-400 text-xs mt-1">
                      {transferForm.formState.errors.newOwnerEmail.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={transferMutation.isPending}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {transferMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Send Transfer Request'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferForm(false);
                      setTransferSuccess(null);
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service History */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Wrench className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Service History</h2>
              </div>
              <button
                onClick={() => setShowServiceForm(!showServiceForm)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Add Service Record Form */}
            {showServiceForm && (
              <form
                onSubmit={serviceForm.handleSubmit((data) => addServiceMutation.mutate(data))}
                className="mb-6 p-4 bg-slate-900/50 border border-slate-600 rounded-lg space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Date *</label>
                    <input
                      type="date"
                      {...serviceForm.register('service_date')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    />
                    {serviceForm.formState.errors.service_date && (
                      <p className="text-red-400 text-xs mt-1">{serviceForm.formState.errors.service_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                    <select
                      {...serviceForm.register('service_type')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="MOT">MOT</option>
                      <option value="Service">Service</option>
                      <option value="Repair">Repair</option>
                      <option value="Tyres">Tyres</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    {...serviceForm.register('description')}
                    placeholder="What was done?"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Mileage</label>
                    <input
                      type="number"
                      {...serviceForm.register('mileage', { valueAsNumber: true })}
                      placeholder="Miles"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Cost (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...serviceForm.register('cost', { valueAsNumber: true })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Garage</label>
                    <input
                      type="text"
                      {...serviceForm.register('garage_name')}
                      placeholder="Garage name"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addServiceMutation.isPending}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addServiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowServiceForm(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Service Records List */}
            {serviceRecords && serviceRecords.length > 0 ? (
              <div className="space-y-3">
                {serviceRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">
                          {record.service_type || 'Service'}
                        </h3>
                        {record.description && (
                          <p className="text-sm text-slate-400 mt-1">{record.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.service_date).toLocaleDateString()}
                          </span>
                          {record.mileage && (
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              {record.mileage.toLocaleString()} miles
                            </span>
                          )}
                          {record.garage_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {record.garage_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {record.cost && (
                        <span className="text-emerald-400 font-medium">£{record.cost.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No service records yet</p>
            )}
          </div>

          {/* Reminders */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Reminders</h2>
              </div>
              <button
                onClick={() => setShowReminderForm(!showReminderForm)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Add Reminder Form */}
            {showReminderForm && (
              <form
                onSubmit={reminderForm.handleSubmit((data) => addReminderMutation.mutate(data))}
                className="mb-6 p-4 bg-slate-900/50 border border-slate-600 rounded-lg space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Type *</label>
                    <select
                      {...reminderForm.register('reminder_type')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    >
                      <option value="MOT">MOT</option>
                      <option value="tax">Tax</option>
                      <option value="insurance">Insurance</option>
                      <option value="service">Service</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Due Date *</label>
                    <input
                      type="date"
                      {...reminderForm.register('due_date')}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                    />
                    {reminderForm.formState.errors.due_date && (
                      <p className="text-red-400 text-xs mt-1">{reminderForm.formState.errors.due_date.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    {...reminderForm.register('title')}
                    placeholder="Reminder title"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    {...reminderForm.register('description')}
                    placeholder="Optional details"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Repeat</label>
                  <select
                    {...reminderForm.register('repeat_interval')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    <option value="">No repeat</option>
                    <option value="yearly">Yearly</option>
                    <option value="6month">Every 6 months</option>
                    <option value="3month">Every 3 months</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addReminderMutation.isPending}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReminderForm(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Reminders List */}
            {reminders && reminders.length > 0 ? (
              <div className="space-y-3">
                {reminders.map((reminder) => {
                  const isOverdue = new Date(reminder.due_date) < new Date() && !reminder.completed;
                  const isDueSoon = !isOverdue && new Date(reminder.due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !reminder.completed;
                  
                  return (
                    <div
                      key={reminder.id}
                      className={`p-4 border rounded-lg ${
                        reminder.completed
                          ? 'bg-slate-900/30 border-slate-700'
                          : isOverdue
                          ? 'bg-red-500/10 border-red-500/30'
                          : isDueSoon
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => !reminder.completed && completeReminderMutation.mutate(reminder.id)}
                            disabled={reminder.completed || completeReminderMutation.isPending}
                            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              reminder.completed
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-slate-500 hover:border-emerald-400'
                            }`}
                          >
                            {reminder.completed && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div>
                            <h3 className={`font-medium ${reminder.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                              {reminder.title || reminder.reminder_type}
                            </h3>
                            {reminder.description && (
                              <p className="text-sm text-slate-400 mt-1">{reminder.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(reminder.due_date).toLocaleDateString()}
                              </span>
                              {reminder.repeat_interval && (
                                <span className="text-slate-400">
                                  Repeats: {reminder.repeat_interval}
                                </span>
                              )}
                              {!reminder.completed && (
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  isOverdue ? 'bg-red-500/20 text-red-400' : 
                                  isDueSoon ? 'bg-amber-500/20 text-amber-400' : 
                                  'bg-slate-700 text-slate-400'
                                }`}>
                                  {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Upcoming'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No reminders set</p>
            )}
          </div>

          {/* Transfer Ownership */}
          {userRole === 'owner' && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">Transfer Ownership</h2>
                </div>
                <button
                  onClick={() => setShowTransferForm(!showTransferForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Transfer
                </button>
              </div>

              {showTransferForm && (
                <>
                  {transferSuccess ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <p className="text-emerald-400 text-sm">{transferSuccess}</p>
                      <p className="text-slate-400 text-xs mt-2">Copy this link and send it to the new owner.</p>
                    </div>
                  ) : (
                    <form
                      onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))}
                      className="p-4 bg-slate-900/50 border border-slate-600 rounded-lg space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">New Owner's Email *</label>
                        <input
                          type="email"
                          {...transferForm.register('newOwnerEmail')}
                          placeholder="newowner@email.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                        />
                        {transferForm.formState.errors.newOwnerEmail && (
                          <p className="text-red-400 text-xs mt-1">{transferForm.formState.errors.newOwnerEmail.message}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={transferMutation.isPending}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {transferMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Transfer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTransferForm(false)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
