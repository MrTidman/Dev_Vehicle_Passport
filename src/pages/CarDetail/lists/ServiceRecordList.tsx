import { Calendar, Gauge, MapPin, File } from 'lucide-react';
import type { ServiceRecord } from '../../../types';

interface ServiceRecordListProps {
  records: ServiceRecord[];
}

export function ServiceRecordList({ records }: ServiceRecordListProps) {
  if (records.length === 0) {
    return <p className="text-slate-500 text-center py-8">No service records yet</p>;
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-white">
                {record.service_type || 'Service'}
              </h3>
              {record.description && (
                <p className="text-sm text-slate-400 mt-1">{record.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
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
              {/* Render receipts if available */}
              {record.receipts && record.receipts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {record.receipts.map((receipt, idx) => (
                    <a
                      key={idx}
                      href={receipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                    >
                      <File className="w-3 h-3" />
                      Receipt {idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {record.cost && (
              <span className="text-emerald-400 font-medium">£{record.cost.toFixed(2)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}