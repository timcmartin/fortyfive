import { X } from 'lucide-react';

export function SongModal({ song, onClose }) {
  if (!song) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">{song.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Artist Info */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Artist Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Performance Version</p>
                <p className="font-medium">{song.artistInfo.performanceVersion}</p>
              </div>
              <div>
                <p className="text-gray-600">Original Artist</p>
                <p className="font-medium">{song.artistInfo.originalArtist}</p>
              </div>
            </div>
          </div>

          {/* Musical Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Musical Details</h3>
            <p className="text-sm">
              <span className="text-gray-600">Key:</span>{' '}
              <span className="font-medium">{song.musicalDetails.key}</span>
            </p>
          </div>

          {/* Performance Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Performance Notes</h3>
            <div className="space-y-2 text-sm">
              {song.performanceNotes.arrangement && (
                <div>
                  <p className="text-gray-600">Arrangement</p>
                  <p>{song.performanceNotes.arrangement}</p>
                </div>
              )}
              {song.performanceNotes.leadSinger && (
                <div>
                  <p className="text-gray-600">Lead Singer</p>
                  <p>{song.performanceNotes.leadSinger}</p>
                </div>
              )}
              {song.performanceNotes.specialNotes && (
                <div>
                  <p className="text-gray-600">Special Notes</p>
                  <p>{song.performanceNotes.specialNotes}</p>
                </div>
              )}
              {song.performanceNotes.generalNotes && (
                <div>
                  <p className="text-gray-600">General Notes</p>
                  <p>{song.performanceNotes.generalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Resources</h3>
            <div className="space-y-2">
              {song.resources.youtubeUrl && (
                <a
                  href={song.resources.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:underline"
                >
                  🎥 Watch on YouTube
                </a>
              )}
              {song.resources.lyricsUrl && (
                <a
                  href={song.resources.lyricsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:underline"
                >
                  📝 View Lyrics
                </a>
              )}
              {song.resources.mp3Url && (
                <a
                  href={song.resources.mp3Url}
                  download
                  className="block text-blue-500 hover:underline"
                >
                  🎵 Download MP3
                </a>
              )}
              {song.resources.chartPdfUrl && (
                <a
                  href={song.resources.chartPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:underline"
                >
                  📄 View Sheet Music
                </a>
              )}
              {!song.resources.youtubeUrl &&
                !song.resources.lyricsUrl &&
                !song.resources.mp3Url &&
                !song.resources.chartPdfUrl && (
                  <p className="text-gray-500 text-sm">No resources available</p>
                )}
            </div>
          </div>

          {/* Status */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Status</p>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
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
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
