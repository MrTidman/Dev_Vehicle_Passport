import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getUserCars } from '../lib/cars';
import { Car, Plus, Loader2 } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const { data: cars, isLoading, error } = useQuery({
    queryKey: ['cars', user?.id],
    queryFn: () => getUserCars(user!.id),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          Failed to load cars. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Cars</h1>
          <p className="text-slate-400 mt-1">Manage your vehicles and their service history</p>
        </div>
        <Link
          to="/cars/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Car
        </Link>
      </div>

      {/* Cars Grid */}
      {cars && cars.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <Link
              key={car.id}
              to={`/car/${car.id}`}
              className="block bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Car className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                {car.make} {car.model}
              </h3>
              <p className="text-slate-400 mt-1">{car.registration}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                <span>{car.year}</span>
                {car.fuel_type && <span>• {car.fuel_type}</span>}
                {car.colour && <span>• {car.colour}</span>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
            <Car className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No cars yet</h2>
          <p className="text-slate-400 mb-6">Add your first car to start tracking its service history</p>
          <Link
            to="/cars/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Car
          </Link>
        </div>
      )}
    </div>
  );
}
