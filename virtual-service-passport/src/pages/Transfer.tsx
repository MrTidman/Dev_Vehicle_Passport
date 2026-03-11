import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { getTransferByToken, acceptTransfer, getCarById } from '../lib/cars';
import { Car, Loader2, Check, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';

export function Transfer() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch transfer details
  const { data: transfer, isLoading: transferLoading, error: fetchError } = useQuery({
    queryKey: ['transfer', token],
    queryFn: () => getTransferByToken(token!),
    enabled: !!token,
  });

  // Fetch car details
  const { data: car } = useQuery({
    queryKey: ['car', transfer?.car_id, user?.id],
    queryFn: () => getCarById(transfer!.car_id, user!.id),
    enabled: !!transfer?.car_id && !!user,
  });

  // Accept transfer mutation
  const acceptMutation = useMutation({
    mutationFn: () => acceptTransfer(token!, user!.id),
    onSuccess: (data) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['userCars'] });
      setTimeout(() => {
        navigate(`/car/${data.car.id}`);
      }, 3000);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to accept transfer');
    },
  });

  if (authLoading || transferLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
            <p className="text-slate-400 mb-6">
              You need to be signed in to accept a vehicle transfer.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !transfer) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Invalid Transfer</h1>
            <p className="text-slate-400 mb-6">
              This transfer link is invalid or has already been accepted.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Transfer Accepted!</h1>
            <p className="text-slate-400 mb-6">
              You now have access to {car?.make} {car?.model} ({car?.registration}).
            </p>
            <p className="text-slate-500 text-sm mb-6">
              Redirecting to car details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Link
          to="/dashboard"
          className="text-emerald-400 hover:underline flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-xl">
              <Car className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Vehicle Transfer
          </h1>
          <p className="text-slate-400 text-center mb-6">
            Someone wants to transfer a vehicle to you
          </p>

          {car && (
            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-white">
                {car.make} {car.model}
              </h3>
              <p className="text-slate-400 text-sm">{car.registration}</p>
              {car.vin && (
                <p className="text-slate-500 text-xs mt-1">VIN: {car.vin}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {acceptMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Accept Transfer
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
