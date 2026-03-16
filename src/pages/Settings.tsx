import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { User, Mail, Loader2, Save, Check, ArrowLeft, KeyRound } from 'lucide-react';

const settingsSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    if (!user) return;
    
    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
        },
      });

      if (error) throw error;
      
      // Also update user_metadata in profiles table if it exists
      await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', user.id);

      await queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccessMessage('Profile updated successfully!');
      
      // Reset with new value
      reset({ full_name: data.full_name });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setResetPasswordLoading(true);
    setResetPasswordSent(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setResetPasswordSent(true);
      setSuccessMessage('Password reset email sent! Check your inbox for instructions.');
    } catch (error) {
      console.error('Error resetting password:', error);
      setSuccessMessage('Error sending reset email. Please try again.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          Please sign in to view settings.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-emerald-400 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
      <p className="text-slate-400 mb-8">Manage your account and preferences</p>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400">{successMessage}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Profile</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save
              </button>
            </div>
            {errors.full_name && (
              <p className="mt-2 text-sm text-red-400">{errors.full_name.message}</p>
            )}
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Account Information</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <span className="text-slate-400">Email</span>
            <span className="text-white font-medium">{user.email}</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <span className="text-slate-400">Account ID</span>
            <span className="text-white font-mono text-sm">{user.id}</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-400">Email Verified</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              user.email_confirmed_at
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {user.email_confirmed_at ? 'Verified' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Reset */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-semibold text-white">Password</h2>
        </div>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Reset your password by receiving a password reset link to your email address.
          </p>
          
          {resetPasswordSent && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400 text-sm">
                Password reset email sent to {user.email}
              </p>
            </div>
          )}

          <button
            onClick={handlePasswordReset}
            disabled={resetPasswordLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {resetPasswordLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Send Password Reset Email
          </button>
        </div>
      </div>
    </div>
  );
}
