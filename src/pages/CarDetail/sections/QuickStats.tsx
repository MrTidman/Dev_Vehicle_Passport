import { Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { ServiceRecord } from '../../../types';

interface QuickStatsProps {
  serviceRecords: ServiceRecord[] | undefined;
  isLoading: boolean;
}

interface ServiceStats {
  totalSpent: number;
  serviceCount: number;
}

export function QuickStats({ serviceRecords, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  const serviceStats: ServiceStats | null = serviceRecords
    ? {
        totalSpent: serviceRecords.reduce((sum, record) => sum + (Number(record.cost) || 0), 0),
        serviceCount: serviceRecords.length,
      }
    : null;

  if (!serviceStats) {
    return <p className="text-sm text-slate-500">Unable to load stats</p>;
  }

  return (
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
  );
}