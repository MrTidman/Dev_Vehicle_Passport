import { File } from 'lucide-react';
import type { NoteJournal } from '../../../types';

interface HistoryLogListProps {
  entries: NoteJournal[];
}

export function HistoryLogList({ entries }: HistoryLogListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500 italic">No history yet. Services, reminders, and notes will appear here.</p>;
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
      {entries.map((entry) => (
        <div key={entry.id} className="p-3 bg-slate-900/30 border border-slate-700 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white break-words">
                {entry.content}
              </p>
              {entry.attachments && entry.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.attachments.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <File className="w-3 h-3" />
                      Receipt
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end text-xs text-slate-500 shrink-0">
              <span>{new Date(entry.created_at).toLocaleDateString('en-GB')}</span>
              <span>{new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}