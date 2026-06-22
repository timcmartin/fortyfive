import { STATUSES } from '@/lib/statuses';

export function StatusFilter({ selectedStatus, onChange, songs = [] }) {
  const counts = songs.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const all = { value: 'all', label: 'All Songs', count: songs.length };
  const statuses = STATUSES.map((s) => ({ ...s, count: counts[s.value] ?? 0 }));

  return (
    <div className="flex gap-2 flex-wrap">
      {[all, ...statuses].map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`btn btn-sm ${selectedStatus === status.value ? 'btn-primary' : 'btn-ghost'}`}
        >
          {status.label}
          <span className={`badge badge-sm ml-1 ${selectedStatus === status.value ? 'badge-primary-content' : 'badge-ghost'}`}>
            {status.count}
          </span>
        </button>
      ))}
    </div>
  );
}
