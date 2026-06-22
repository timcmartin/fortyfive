const STATUSES = [
  { value: 'all', label: 'All Songs' },
  { value: 'active', label: 'Active' },
  { value: 'learning', label: 'Learning' },
  { value: 'retired', label: 'Retired' },
  { value: 'on-hold', label: 'On Hold' },
];

export function StatusFilter({ selectedStatus, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUSES.map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedStatus === status.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
