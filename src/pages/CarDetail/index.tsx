import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { getCarById, getServiceRecords, addServiceRecord, getReminders, addReminder, transferOwnership, getHistoryLog, addHistoryLog, deleteCar } from '../../lib/cars';
import { downloadServiceHistoryPDF } from '../../lib/pdf-export';
import { Loader2, Plus, FileText, Save, X, UserPlus } from 'lucide-react';

// Components
import { DeleteModal } from './components/DeleteModal';
import { MileageModal } from './components/MileageModal';
import { ServiceRecordForm } from './forms/ServiceRecordForm';
import { ReminderForm } from './forms/ReminderForm';
import { TransferForm } from './forms/TransferForm';
import { ServiceRecordList } from './lists/ServiceRecordList';
import { ReminderList } from './lists/ReminderList';
import { HistoryLogList } from './lists/HistoryLogList';
import { CarHeader } from './sections/CarHeader';
import { QuickStats } from './sections/QuickStats';

// Schemas
import { serviceRecordSchema, reminderSchema, transferSchema, noteSchema, type ServiceRecordFormData, type ReminderFormData, type TransferFormData, type NoteFormData } from './schemas';

export function CarDetail() {
  const { id: carId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // UI State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [includeReceiptsInPDF, setIncludeReceiptsInPDF] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

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
  const { data: historyLog } = useQuery({
    queryKey: ['historyLog', carId, user?.id],
    queryFn: () => getHistoryLog(carId!, user!.id),
    enabled: !!carId && !!user,
  });

  // Add service record mutation
  const addServiceMutation = useMutation({
    mutationFn: (data: ServiceRecordFormData) => addServiceRecord({ ...data, car_id: carId! }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRecords', carId] });
      queryClient.invalidateQueries({ queryKey: ['historyLog', carId] });
      setShowServiceForm(false);
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (data: NoteFormData) => addHistoryLog(carId!, user!.id, `Note: ${data.content}`, 'NOTE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historyLog', carId] });
      setShowAddNote(false);
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

  // Transfer ownership mutation
  const transferMutation = useMutation({
    mutationFn: (data: TransferFormData) => transferOwnership(carId!, data.newOwnerEmail, user!.id),
    onSuccess: (data) => {
      setTransferSuccess(`Transfer initiated! Email link: ${data.emailLink}`);
      setShowTransferForm(false);
      queryClient.invalidateQueries({ queryKey: ['historyLog', carId] });
    },
  });

  // Delete car mutation
  const deleteCarMutation = useMutation({
    mutationFn: () => deleteCar(carId!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars', user?.id] });
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      setDeleteError(error.message);
      setIsDeleting(false);
    },
  });

  const handleDeleteCar = () => {
    setIsDeleting(true);
    setDeleteError(null);
    deleteCarMutation.mutate();
  };

  // Note form
  const noteForm = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      content: '',
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

  // Get highest mileage from service records
  const highestRecordedMileage = useMemo(() => {
    if (!serviceRecords) return 0;
    let maxMileage = 0;
    for (const record of serviceRecords) {
      if (record.mileage && record.mileage > maxMileage) {
        maxMileage = record.mileage;
      }
    }
    return maxMileage;
  }, [serviceRecords]);

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

  // PDF Export handlers
  const handleExportPDFClick = () => {
    setShowMileageModal(true);
  };

  const handleConfirmMileageAndExport = async (mileage: number) => {
    if (car && serviceRecords) {
      const totalSpent = serviceRecords.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
      setShowMileageModal(false);
      setIsExportingPDF(true);
      try {
        await downloadServiceHistoryPDF(
          {
            id: car.id,
            make: car.make || 'Unknown',
            model: car.model || 'Unknown',
            year: car.year || 0,
            registration: car.registration || 'N/A',
            vin: car.vin_last6 || 'N/A',
            currentMileage: mileage,
          },
          serviceRecords as any,
          totalSpent,
          historyLog as any,
          { includeReceipts: includeReceiptsInPDF }
        );
      } finally {
        setIsExportingPDF(false);
      }
    }
  };

  // Service record form submit handler - mutation adds car_id internally
  const handleServiceRecordSubmit = async (data: ServiceRecordFormData, _receipts: string[]) => {
    await addServiceMutation.mutateAsync(data);
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

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        carMake={car.make || ''}
        carModel={car.model || ''}
        registration={car.registration || ''}
        confirmText={deleteConfirmText}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteCar}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
          setDeleteError(null);
        }}
        onConfirmTextChange={setDeleteConfirmText}
      />

      {/* Mileage Modal */}
      <MileageModal
        isOpen={showMileageModal}
        lastRecordedMileage={highestRecordedMileage}
        isExporting={isExportingPDF}
        onConfirm={handleConfirmMileageAndExport}
        onCancel={() => setShowMileageModal(false)}
      />

      {/* Car Header */}
      <CarHeader
        car={car}
        isOwner={isOwner}
        onDeleteClick={() => setShowDeleteModal(true)}
      />

      {/* Vehicle History Log Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-white">Vehicle History</h3>
          </div>
          {(isOwner || userPermission === 'mechanic') && (
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Note
            </button>
          )}
        </div>
        
        {/* Add Note Form */}
        {showAddNote && (
          <form
            onSubmit={noteForm.handleSubmit((data) => addNoteMutation.mutate(data))}
            className="mb-4 p-3 bg-slate-900/50 border border-slate-600 rounded-lg space-y-3"
          >
            <textarea
              {...noteForm.register('content')}
              placeholder="Add a note to the vehicle history..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 resize-none"
            />
            {noteForm.formState.errors.content && (
              <p className="text-red-400 text-xs">{noteForm.formState.errors.content.message}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addNoteMutation.isPending}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {addNoteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Note
              </button>
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* History Log List */}
        <HistoryLogList entries={historyLog || []} />
      </div>

      {/* Quick Stats */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Quick Stats</h3>
        <QuickStats serviceRecords={serviceRecords} isLoading={servicesLoading || false} />

        {/* Export to PDF Button */}
        {serviceRecords && serviceRecords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
            <button
              onClick={handleExportPDFClick}
              disabled={isExportingPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Export to PDF
            </button>
            
            {/* Include receipts option */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeReceiptsInPDF}
                onChange={(e) => setIncludeReceiptsInPDF(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-400">Include receipts appendix</span>
            </label>
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
            <TransferForm
              isLoading={transferMutation.isPending}
              successMessage={transferSuccess}
              onSubmit={async (data) => transferMutation.mutate(data)}
              onCancel={() => {
                setShowTransferForm(false);
                setTransferSuccess(null);
              }}
              register={transferForm.register}
              errors={transferForm.formState.errors}
            />
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
                <FileText className="w-6 h-6 text-emerald-400" />
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
              <ServiceRecordForm
                isLoading={addServiceMutation.isPending}
                onSubmit={handleServiceRecordSubmit}
                onCancel={() => setShowServiceForm(false)}
                register={serviceForm.register}
                errors={serviceForm.formState.errors}
                defaultDate={new Date().toISOString().split('T')[0]}
              />
            )}

            {/* Service Records List */}
            <ServiceRecordList records={serviceRecords || []} />
          </div>

          {/* Reminders */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-400" />
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
              <ReminderForm
                isLoading={addReminderMutation.isPending}
                onSubmit={async (data) => addReminderMutation.mutate(data)}
                onCancel={() => setShowReminderForm(false)}
                register={reminderForm.register}
                errors={reminderForm.formState.errors}
                defaultDueDate={new Date().toISOString().split('T')[0]}
              />
            )}

            {/* Reminders List - Using inline version that works with context */}
            <ReminderList reminders={reminders || []} userId={user?.id || ''} />
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetail;