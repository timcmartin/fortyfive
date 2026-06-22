import { useState, useMemo } from "react";
import { useSongs } from "./hooks/useSongs";
import { SearchBar } from "./components/SearchBar";
import { StatusFilter } from "./components/StatusFilter";
import { SongTable } from "./components/SongTable";
import { SongModal } from "./components/SongModal";

export default function App() {
  const { songs, loading, error } = useSongs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSong, setSelectedSong] = useState(null);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artistInfo.performanceVersion
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || song.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [songs, searchTerm, selectedStatus]);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">FortyFive Song Catalog</h1>
          <p className="text-base-content/60 mt-2">
            Browse and learn about all the songs in our repertoire
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>Error loading songs: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
              <StatusFilter
                selectedStatus={selectedStatus}
                onChange={setSelectedStatus}
              />
              <p className="text-sm text-base-content/50">
                Showing {filteredSongs.length} of {songs.length} songs
              </p>
              <SongTable songs={filteredSongs} onSelectSong={setSelectedSong} />
            </div>
          </div>
        )}
      </div>

      <SongModal song={selectedSong} onClose={() => setSelectedSong(null)} />
    </div>
  );
}
