export function SongTable({ songs, onSelectSong }) {
  if (songs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No songs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Title</th>
            <th className="text-left px-4 py-3 font-semibold">Artist</th>
            <th className="text-left px-4 py-3 font-semibold">Key</th>
            <th className="text-left px-4 py-3 font-semibold">Status</th>
            <th className="text-left px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => (
            <tr
              key={song.id}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectSong(song)}
            >
              <td className="px-4 py-3">{song.title}</td>
              <td className="px-4 py-3 text-gray-600">
                {song.artistInfo.performanceVersion}
              </td>
              <td className="px-4 py-3 text-gray-600">{song.musicalDetails.key}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    song.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : song.status === 'learning'
                      ? 'bg-blue-100 text-blue-800'
                      : song.status === 'retired'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {song.status.charAt(0).toUpperCase() + song.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSong(song);
                  }}
                  className="text-blue-500 hover:underline font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
