import { useState, useMemo } from 'react';
import { useSongs } from './hooks/useSongs';
import { SearchBar } from './components/SearchBar';
import { StatusFilter } from './components/StatusFilter';
import { SongTable } from './components/SongTable';
import { SongModal } from './components/SongModal';

export default function App() {
  const { songs, loading, error } = useSongs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSong, setSelectedSong] = useState(null);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artistInfo.performanceVersion
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' || song.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [songs, searchTerm, selectedStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Band Song Catalog</h1>
        <p className="text-gray-600 mb-8">
          Browse and learn about all the songs in our repertoire
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
            Error loading songs: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading songs...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search Bar */}
            <SearchBar value={searchTerm} onChange={setSearchTerm} />

            {/* Status Filter */}
            <StatusFilter
              selectedStatus={selectedStatus}
              onChange={setSelectedStatus}
            />

            {/* Song Count */}
            <div className="text-sm text-gray-600">
              Showing {filteredSongs.length} of {songs.length} songs
            </div>

            {/* Song Table */}
            <SongTable
              songs={filteredSongs}
              onSelectSong={setSelectedSong}
            />
          </div>
        )}
      </div>

      {/* Song Modal */}
      <SongModal song={selectedSong} onClose={() => setSelectedSong(null)} />
    </div>
  );
}
