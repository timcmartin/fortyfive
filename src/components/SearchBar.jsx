export function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      placeholder="Search by title or artist..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
