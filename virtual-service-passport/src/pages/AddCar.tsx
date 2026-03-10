import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { addCar } from '../lib/cars';
import { Car, Loader2 } from 'lucide-react';

const carSchema = z.object({
  vin: z.string().min(1, 'VIN is required').length(17, 'VIN must be 17 characters'),
  registration: z.string().min(1, 'Registration is required').min(1).max(20),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900, 'Invalid year').max(new Date().getFullYear() + 1),
  fuel_type: z.string().min(1, 'Fuel type is required'),
  colour: z.string().optional(),
});

type CarFormData = z.infer<typeof carSchema>;

export function AddCar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = async (data: CarFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    setServerError(null);

    try {
      await addCar(data, user.id);
      await queryClient.invalidateQueries({ queryKey: ['cars'] });
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/dashboard');
    } catch (error: any) {
      setServerError(error.message || 'Failed to add car. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Add a Car</h1>
        <p className="text-slate-400 mt-1">Enter your vehicle details</p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* VIN */}
        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-slate-300 mb-2">
            VIN *
          </label>
          <input
            id="vin"
            type="text"
            {...register('vin')}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter 17-character VIN"
          />
          {errors.vin && <p className="mt-2 text-sm text-red-400">{errors.vin.message}</p>}
        </div>

        {/* Registration */}
        <div>
          <label htmlFor="registration" className="block text-sm font-medium text-slate-300 mb-2">
            Registration *
          </label>
          <input
            id="registration"
            type="text"
            {...register('registration')}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="e.g. AB12 CDE"
          />
          {errors.registration && (
            <p className="mt-2 text-sm text-red-400">{errors.registration.message}</p>
          )}
        </div>

        {/* Make & Model */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-slate-300 mb-2">
              Make *
            </label>
            <input
              id="make"
              type="text"
              {...register('make')}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. Ford"
            />
            {errors.make && <p className="mt-2 text-sm text-red-400">{errors.make.message}</p>}
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-slate-300 mb-2">
              Model *
            </label>
            <input
              id="model"
              type="text"
              {...register('model')}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. Focus"
            />
            {errors.model && <p className="mt-2 text-sm text-red-400">{errors.model.message}</p>}
          </div>
        </div>

        {/* Year & Fuel Type */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-2">
              Year *
            </label>
            <input
              id="year"
              type="number"
              {...register('year', { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g. 2020"
            />
            {errors.year && <p className="mt-2 text-sm text-red-400">{errors.year.message}</p>}
          </div>
          <div>
            <label htmlFor="fuel_type" className="block text-sm font-medium text-slate-300 mb-2">
              Fuel Type *
            </label>
            <select
              id="fuel_type"
              {...register('fuel_type')}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select fuel type</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="LPG">LPG</option>
              <option value="Other">Other</option>
            </select>
            {errors.fuel_type && (
              <p className="mt-2 text-sm text-red-400">{errors.fuel_type.message}</p>
            )}
          </div>
        </div>

        {/* Colour */}
        <div>
          <label htmlFor="colour" className="block text-sm font-medium text-slate-300 mb-2">
            Colour
          </label>
          <input
            id="colour"
            type="text"
            {...register('colour')}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="e.g. Blue"
          />
          {errors.colour && <p className="mt-2 text-sm text-red-400">{errors.colour.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding Car...
            </>
          ) : (
            <>
              <Car className="w-5 h-5" />
              Add Car
            </>
          )}
        </button>
      </form>
    </div>
  );
}
