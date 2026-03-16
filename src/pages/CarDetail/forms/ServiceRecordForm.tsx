import { useState } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Loader2, X, Upload, File } from 'lucide-react';
import type { ServiceRecordFormData } from '../schemas';
import { uploadVehicleFiles } from '../../../lib/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ServiceRecordFormProps {
  isLoading: boolean;
  onSubmit: (data: ServiceRecordFormData, receipts: string[]) => Promise<void>;
  onCancel: () => void;
  register: UseFormRegister<ServiceRecordFormData>;
  errors: FieldErrors<ServiceRecordFormData>;
  defaultDate?: string;
}

export function ServiceRecordForm({
  isLoading,
  onSubmit,
  onCancel,
  register,
  errors,
  defaultDate,
}: ServiceRecordFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (data: ServiceRecordFormData) => {
    setIsUploading(true);
    try {
      let receipts: string[] = [];
      
      // Upload files if any
      if (uploadedFiles.length > 0) {
        receipts = await uploadVehicleFiles(uploadedFiles, '', ''); // Will be handled by parent
      }
      
      await onSubmit(data, receipts);
      setUploadedFiles([]);
      setFileError(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    let errorMsg: string | null = null;
    
    for (const file of Array.from(files)) {
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
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleSubmit({
          service_date: formData.get('service_date') as string,
          service_type: formData.get('service_type') as string || undefined,
          description: formData.get('description') as string || undefined,
          mileage: formData.get('mileage') ? Number(formData.get('mileage')) : undefined,
          cost: formData.get('cost') ? Number(formData.get('cost')) : undefined,
          garage_name: formData.get('garage_name') as string || undefined,
        });
      }}
      className="mb-6 p-4 bg-slate-900/50 border border-slate-600 rounded-lg space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date *</label>
          <input
            type="date"
            {...register('service_date')}
            defaultValue={defaultDate}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
          {errors.service_date && (
            <p className="text-red-400 text-xs mt-1">{errors.service_date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
          <select
            {...register('service_type')}
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
          {...register('description')}
          placeholder="What was done?"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Mileage</label>
          <input
            type="number"
            {...register('mileage', { valueAsNumber: true })}
            placeholder="Miles"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Cost (£)</label>
          <input
            type="number"
            step="0.01"
            {...register('cost', { valueAsNumber: true })}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Garage</label>
          <input
            type="text"
            {...register('garage_name')}
            placeholder="Garage name"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
          />
        </div>
      </div>

      {/* Document Upload UI */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Documents</label>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition-colors">
          <input
            type="file"
            id="service-record-file-upload"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
          />
          <label htmlFor="service-record-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
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
          disabled={isLoading || isUploading}
          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading || isUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            onCancel();
            setUploadedFiles([]);
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}