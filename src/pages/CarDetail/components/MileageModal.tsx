import { useState } from 'react';
import { Loader2, Gauge, FileText } from 'lucide-react';

interface MileageModalProps {
  isOpen: boolean;
  lastRecordedMileage: number;
  isExporting: boolean;
  onConfirm: (mileage: number) => void;
  onCancel: () => void;
}

export function MileageModal({
  isOpen,
  lastRecordedMileage,
  isExporting,
  onConfirm,
  onCancel,
}: MileageModalProps) {
  const [mileage, setMileage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const mileageNum = parseInt(mileage, 10);
    
    if (isNaN(mileageNum) || mileageNum < 0) {
      setError('Please enter a valid mileage');
      return;
    }
    
    if (mileageNum < lastRecordedMileage && lastRecordedMileage > 0) {
      setError(`Mileage cannot be lower than previous reading of ${lastRecordedMileage.toLocaleString()} miles`);
      return;
    }
    
    onConfirm(mileageNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 border border-slate-600 rounded-xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <div className="p-2 bg-emerald-500/20 rounded-full">
            <Gauge className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Current Mileage</h2>
            <p className="text-sm text-slate-400">Enter the current odometer reading</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {lastRecordedMileage > 0 && (
            <div className="p-3 bg-slate-900/50 border border-slate-600 rounded-lg">
              <p className="text-sm text-slate-400">
                Last recorded: <span className="font-semibold text-white">{lastRecordedMileage.toLocaleString()} miles</span>
              </p>
            </div>
          )}

          <div>
            <label htmlFor="mileageInput" className="block text-sm font-medium text-slate-300 mb-2">
              Current Mileage *
            </label>
            <div className="relative">
              <input
                id="mileageInput"
                type="number"
                value={mileage}
                onChange={(e) => {
                  setMileage(e.target.value);
                  setError(null);
                }}
                placeholder="Enter current mileage"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="0"
                max="999999"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                miles
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}