import { STATUSES } from '@/lib/statuses';

const ALL = { value: 'all', label: 'All Songs' };

export function StatusFilter({ selectedStatus, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[ALL, ...STATUSES].map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`btn btn-sm ${selectedStatus === status.value ? 'btn-primary' : 'btn-ghost'}`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
