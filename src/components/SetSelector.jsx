export function SetSelector({ selectedSet, onChange, loading = false }) {
  const sets = [
    { value: "all", label: "All Songs" },
    { value: "set-1", label: "Set 1" },
    { value: "set-2", label: "Set 2" },
    { value: "set-3", label: "Set 3" },
    { value: "extras", label: "Common Inserts" },
    { value: "new", label: "To Work On" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {sets.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`btn btn-sm ${selectedSet === s.value ? "btn-primary" : "btn-ghost"}`}
          disabled={loading && selectedSet !== s.value}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
