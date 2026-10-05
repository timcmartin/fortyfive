import { SET_OPTIONS } from "@/lib/sets";

export function SetSelector({ selectedSet, onChange, loading = false }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[
        { value: "all", label: "All Songs" },
        ...SET_OPTIONS,
      ].map((s) => (
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
