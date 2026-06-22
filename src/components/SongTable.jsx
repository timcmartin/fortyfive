import { getStatus } from '@/lib/statuses';

export function SongTable({ songs, onSelectSong }) {
  if (songs.length === 0) {
    return (
      <div className="text-center py-12 text-base-content/50">
        <p className="text-lg">No songs found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Title</th>
            <th>Artist</th>
            <th>Key</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song) => {
            const status = getStatus(song.status);
            return (
              <tr
                key={song.id}
                className="hover cursor-pointer"
                onClick={() => onSelectSong(song)}
              >
                <td className="font-medium">{song.title}</td>
                <td>{song.artistInfo.performanceVersion}</td>
                <td>{song.musicalDetails.key}</td>
                <td>
                  <span className={`badge ${status.badge}`}>{status.label}</span>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={(e) => { e.stopPropagation(); onSelectSong(song); }}
                  >
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
