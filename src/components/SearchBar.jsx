import { X } from 'lucide-react';

export function SearchBar({ value, onChange }) {
  return (
    <label className="input input-bordered flex items-center gap-2 w-full">
      <svg className="h-4 w-4 opacity-50 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input
        type="text"
        placeholder="Search by title or artist..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="grow"
      />
      {value && (
        <button onClick={() => onChange('')} className="btn btn-ghost btn-xs btn-circle">
          <X className="size-3" />
        </button>
      )}
    </label>
  );
}
