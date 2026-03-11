import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { getCarById, getServiceRecords, addServiceRecord, getReminders, addReminder, completeReminder, transferOwnership, updateCarNotes, getNoteHistory } from '../lib/cars';
import { uploadVehicleFiles } from '../lib/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
import { Car, Wrench, Bell, Plus, Loader2, Calendar, MapPin, Gauge, Check, UserPlus, Mail, Send, FileText, Edit2, Save, X, Upload, File } from 'lucide-react';

// Service Record Form Schema
const serviceRecordSchema = z.object({
  service_date: z.string().min(1, 'Service date is required'),
  service_type: z.string().optional(),
  description: z.string().max(5000).optional(),
  mileage: z.number().min(0).max(999999).optional(),
  cost: z.number().min(0).max(999999).optional(),
  garage_name: z.string().max(255).optional(),
  receipts: z.array(z.string()).optional(),
});

type ServiceRecordFormData = z.infer<typeof serviceRecordSchema>;

// Reminder Form Schema
const reminderSchema = z.object({
  reminder_type: z.enum(['MOT', 'tax', 'insurance', 'service', 'custom']),
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
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
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showNoteHistory, setShowNoteHistory] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch car details
  const { data: car, isLoading: carLoading, error: carError } = useQuery({
    queryKey: ['car', carId, user?.id],
    queryFn: () => getCarById(carId!, user!.id),
    enabled: !!carId && !!user,
  });

  // Fetch user's permission role for this car
  const { data: userPermission } = useQuery({
    queryKey: ['carPermission', carId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('car_permissions')
        .select('role')
        .eq('car_id', carId!)
        .eq('user_id', user!.id)
        .single();
      return data?.role as string | null;
    },
    enabled: !!carId && !!user,
  });

  const isOwner = userPermission === 'owner';

  // Fetch service records
  const { data: serviceRecords, isLoading: servicesLoading } = useQuery({
    queryKey: ['serviceRecords', carId, user?.id],
    queryFn: () => getServiceRecords(carId!, user!.id),
    enabled: !!carId && !!user,
  });

  // Fetch reminders
  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['reminders', carId, user?.id],
    queryFn: () => getReminders(carId!, user!.id),
    enabled: !!carId && !!user,
  });

  // Fetch note history
  const { data: noteHistory } = useQuery({
    queryKey: ['noteHistory', carId, user?.id],
    queryFn: () => getNoteHistory(carId!, user!.id),
    enabled: !!carId && !!user && showNoteHistory,
  });

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
    mutationFn: (reminderId: string) => completeReminder(reminderId, user!.id),
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

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => updateCarNotes(carId!, notes, user!.id),
    onSuccess: (updatedCar) => {
      queryClient.setQueryData(['car', carId, user?.id], updatedCar);
      queryClient.invalidateQueries({ queryKey: ['noteHistory', carId] });
      setIsEditingNotes(false);
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

  // Memoize the "due soon" threshold (30 days from now)
  /* eslint-disable react-hooks/purity */
  const dueSoonThreshold = useMemo(() => {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }, []);
  /* eslint-enable react-hooks/purity */

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

  // Calculate service stats
  const serviceStats = serviceRecords
    ? {
        totalSpent: serviceRecords.reduce((sum, record) => sum + (record.cost || 0), 0),
        serviceCount: serviceRecords.length,
      }
    : null;

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

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

        {/* Notes Section */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-400">Notes</h3>
            </div>
            {isOwner && !isEditingNotes && (
              <button
                onClick={() => {
                  setNotesText(car.notes || '');
                  setIsEditingNotes(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
          
          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add notes about this vehicle..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateNotesMutation.mutate(notesText)}
                  disabled={updateNotesMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  {updateNotesMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : car.notes ? (
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{car.notes}</p>
          ) : isOwner ? (
            <p className="text-sm text-slate-500 italic">No notes yet. Click edit to add notes.</p>
          ) : (
            <p className="text-sm text-slate-500 italic">No notes</p>
          )}

          {/* Note History */}
          {noteHistory && noteHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => setShowNoteHistory(!showNoteHistory)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <FileText className="w-3 h-3" />
                {showNoteHistory ? 'Hide' : 'Show'} note history ({noteHistory.length})
              </button>
              {showNoteHistory && (
                <div className="mt-3 space-y-2">
                  {noteHistory.map((entry) => (
                    <div key={entry.id} className="p-2 bg-slate-900/50 border border-slate-700 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">
                          {entry.user?.name || entry.user?.email || 'Unknown'}
                        </span>
                        <span className="text-slate-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Quick Stats</h3>
          {servicesLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading stats...</span>
            </div>
          ) : serviceStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Total Spent</p>
                <p className="text-xl font-semibold text-emerald-400">
                  {formatCurrency(serviceStats.totalSpent)}
                </p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-500 mb-1">Services</p>
                <p className="text-xl font-semibold text-white">
                  {serviceStats.serviceCount}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Unable to load stats</p>
          )}
        </div>

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
                onSubmit={serviceForm.handleSubmit(async (data) => {
                  setIsUploading(true);
                  try {
                    let receipts: string[] = [];
                    
                    // Upload files if any
                    if (uploadedFiles.length > 0 && carId && user) {
                      receipts = await uploadVehicleFiles(uploadedFiles, carId, user.id);
                    }
                    
                    await addServiceMutation.mutateAsync({ ...data, receipts });
                    setUploadedFiles([]);
                    setFileError(null);
                  } finally {
                    setIsUploading(false);
                  }
                })}
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

                {/* Document Upload UI (Phase 2A - UI only) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Documents</label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const validFiles: File[] = [];
                        let errorMsg: string | null = null;
                        
                        for (const file of files) {
                          if (file.size > MAX_FILE_SIZE) {
                            errorMsg = `File "${file.name}" exceeds 10MB limit`;
                            break;
                          }
                          validFiles.push(file);
                        }
                        
                        if (errorMsg) {
                          setFileError(errorMsg);
                        } else {
                          setFileError(null);
                          setUploadedFiles(prev => [...prev, ...validFiles]);
                        }
                      }}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-500" />
                      <span className="text-sm text-slate-400">
                        Click to upload receipts or documents
                      </span>
                      <span className="text-xs text-slate-500">
                        PNG, JPG, PDF up to 10MB
                      </span>
                    </label>
                  </div>
                  
                  {/* File upload error */}
                  {fileError && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-xs">{fileError}</p>
                    </div>
                  )}
                  
                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <File className="w-4 h-4 text-slate-400" />
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-slate-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addServiceMutation.isPending || isUploading}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addServiceMutation.isPending || isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowServiceForm(false);
                      setUploadedFiles([]);
                    }}
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
                      {record.receipts && record.receipts.length > 0 && (() => {
                          const url = record.receipts?.[0];
                          const isSafeUrl = url && (url.startsWith('http://') || url.startsWith('https://'));
                          return isSafeUrl ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors mt-1"
                            >
                              <File className="w-3 h-3" />
                              Receipt
                            </a>
                          ) : null;
                        })()}
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
                  const isDueSoon = !isOverdue && new Date(reminder.due_date) <= dueSoonThreshold && !reminder.completed;
                  
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
        </div>
      )}
    </div>
  );
}
