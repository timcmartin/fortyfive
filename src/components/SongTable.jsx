import { Play, FileText, FileMusic, Music } from 'lucide-react';
import { getStatus } from '@/lib/statuses';

const RESOURCES = [
  { key: 'youtubeUrl',  Icon: Play,       label: 'YouTube', array: false },
  { key: 'lyricsUrls',  Icon: FileText,   label: 'Lyrics',  array: true  },
  { key: 'chartPdfUrl', Icon: FileMusic,  label: 'Chart',   array: true  },
  { key: 'mp3Url',      Icon: Music,      label: 'MP3',     array: false },
];

function getPrimaryResourceUrl(value, array) {
  if (array) {
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }

  return value;
}

function ResourceCell({ url, Icon, label }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:text-primary/70 transition-colors"
      >
        <Icon className="size-4" />
      </a>
    );
  }
  return <Icon className="size-4 text-base-content/15" />;
}

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
            {RESOURCES.map(({ key, label }) => (
              <th key={key} className="text-center">{label}</th>
            ))}
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
                  <span className={`badge whitespace-nowrap ${status.badge}`}>{status.label}</span>
                </td>
                {RESOURCES.map(({ key, Icon, label, array }) => {
                  const val = song.resources[key];
                  const url = getPrimaryResourceUrl(val, array);
                  return (
                    <td key={key}>
                      <div className="flex justify-center">
                        <ResourceCell url={url} Icon={Icon} label={label} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
