const STATUSES = [
  { value: "all", label: "All Songs" },
  { value: "active", label: "Active" },
  { value: "learning", label: "Learning" },
  { value: "retired", label: "Retired" },
  { value: "on-hold", label: "On Hold" },
  { value: "filler", label: "Filler" },
];

export function StatusFilter({ selectedStatus, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {STATUSES.map((status) => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`btn btn-sm ${selectedStatus === status.value ? "btn-primary" : "btn-ghost"}`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
