import { TaxDisk } from '../../../components/TaxDisk';
import { maskVIN } from '../../../lib/vin';
import { Trash2 } from 'lucide-react';
import type { Car } from '../../../types';

interface CarHeaderProps {
  car: Car;
  isOwner: boolean;
  onDeleteClick: () => void;
}

export function CarHeader({ car, isOwner, onDeleteClick }: CarHeaderProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <TaxDisk 
            shortcode={car.shortcode} 
            registration={car.registration} 
            vin={car.vin_last6 || null}
          />
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
        
        {/* Delete Button - Only for owner */}
        {isOwner && (
          <button
            onClick={onDeleteClick}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors"
            title="Delete vehicle"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
      
      {car.vin_last6 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-500">VIN: {maskVIN(car.vin_last6)}</p>
        </div>
      )}
    </div>
  );
}