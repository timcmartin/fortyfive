import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getStatus } from '@/lib/statuses';

export function SongModal({ song, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (song) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [song]);

  if (!song) return <dialog ref={dialogRef} className="modal" />;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X className="size-4" />
          </button>
          <h2 className="text-xl font-bold truncate">{song.title}</h2>
          {(() => { const s = getStatus(song.status); return (
            <span className={`badge ml-auto ${s.badge}`}>{s.label}</span>
          ); })()}
        </div>

        <div className="space-y-5">
          {/* Artist */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Artist</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-60 mb-0.5">Performance Version</p>
                <p className="font-medium">{song.artistInfo.performanceVersion}</p>
              </div>
              <div>
                <p className="text-xs opacity-60 mb-0.5">Original Artist</p>
                <p className="font-medium">{song.artistInfo.originalArtist}</p>
              </div>
            </div>
          </div>

          <div className="divider my-0" />

          {/* Musical Details */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Musical Details</p>
            <p><span className="opacity-60">Key: </span><span className="font-medium">{song.musicalDetails.key}</span></p>
          </div>

          {/* Performance Notes */}
          {(song.performanceNotes.arrangement || song.performanceNotes.leadSinger ||
            song.performanceNotes.specialNotes || song.performanceNotes.generalNotes) && (
            <>
              <div className="divider my-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Performance Notes</p>
                <div className="space-y-2 text-sm">
                  {song.performanceNotes.arrangement && <p><span className="opacity-60">Arrangement: </span>{song.performanceNotes.arrangement}</p>}
                  {song.performanceNotes.leadSinger && <p><span className="opacity-60">Lead Singer: </span>{song.performanceNotes.leadSinger}</p>}
                  {song.performanceNotes.specialNotes && <p><span className="opacity-60">Special Notes: </span>{song.performanceNotes.specialNotes}</p>}
                  {song.performanceNotes.generalNotes && <p><span className="opacity-60">General Notes: </span>{song.performanceNotes.generalNotes}</p>}
                </div>
              </div>
            </>
          )}

          {/* Resources */}
          {(song.resources.youtubeUrl || song.resources.lyricsUrl || song.resources.mp3Url || song.resources.chartPdfUrl) && (
            <>
              <div className="divider my-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Resources</p>
                <div className="flex flex-wrap gap-2">
                  {song.resources.youtubeUrl && (
                    <a href={song.resources.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                      🎥 YouTube
                    </a>
                  )}
                  {song.resources.lyricsUrl && (
                    <a href={song.resources.lyricsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                      📝 Lyrics
                    </a>
                  )}
                  {song.resources.mp3Url && (
                    <a href={song.resources.mp3Url} download className="btn btn-sm btn-outline">
                      🎵 MP3
                    </a>
                  )}
                  {song.resources.chartPdfUrl && (
                    <a href={song.resources.chartPdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                      📄 Sheet Music
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
