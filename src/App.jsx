import { useState, useMemo, useEffect } from "react";
import { useSongs } from "./hooks/useSongs";
import { SearchBar } from "./components/SearchBar";
import { StatusFilter } from "./components/StatusFilter";
import { LeadSingerFilter } from "./components/LeadSingerFilter";
import { SongTable } from "./components/SongTable";
import { SongModal } from "./components/SongModal";
import { SetSelector } from "./components/SetSelector";

export default function App() {
  const { songs, loading, error } = useSongs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLeadSinger, setSelectedLeadSinger] = useState("all");
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedSet, setSelectedSet] = useState("all");
  const [setOrder, setSetOrder] = useState([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [setsError, setSetsError] = useState(null);

  useEffect(() => {
    if (selectedSet === "all") {
      setSetOrder([]);
      setSetsError(null);
      setSetsLoading(false);
      return;
    }
    let mounted = true;
    setSetsLoading(true);
    setSetsError(null);
    fetch(`/sets/${selectedSet}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load set");
        return r.json();
      })
      .then((data) => {
        if (!mounted) return;
        setSetOrder(Array.isArray(data) ? data.map((i) => i.id) : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setSetsError(err.message);
        setSetOrder([]);
      })
      .finally(() => {
        if (!mounted) return;
        setSetsLoading(false);
      });
    return () => { mounted = false; };
  }, [selectedSet]);

  const filteredSongs = useMemo(() => {
    const matchesFilters = (song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artistInfo.performanceVersion
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || song.status === selectedStatus;
      const matchesLeadSinger =
        selectedLeadSinger === "all" ||
        (selectedLeadSinger === "lead"
          ? !song.performanceNotes?.leadSinger
          : song.performanceNotes?.leadSinger === selectedLeadSinger);
      return matchesSearch && matchesStatus && matchesLeadSinger;
    };

    if (selectedSet === "all" || setOrder.length === 0) {
      return songs.filter(matchesFilters);
    }

    // Preserve set order, but apply other filters
    return setOrder
      .map((id) => songs.find((s) => s.id === id))
      .filter(Boolean)
      .filter(matchesFilters);
  }, [songs, searchTerm, selectedStatus, selectedLeadSinger, selectedSet, setOrder]);

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

        {setsError && (
          <div className="alert alert-error mb-6">
            <span>Error loading set: {setsError}</span>
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
                songs={songs}
              />
              <LeadSingerFilter
                selectedLeadSinger={selectedLeadSinger}
                onChange={setSelectedLeadSinger}
                selectedStatus={selectedStatus}
                songs={songs}
              />
              <SetSelector selectedSet={selectedSet} onChange={setSelectedSet} loading={setsLoading} />
              <p className="text-sm text-base-content/50">
                Showing {filteredSongs.length} of {songs.length} songs
                {selectedSet !== "all" && setOrder.length > 0 && (
                  <> — viewing {selectedSet.replace('-', ' ')}</>
                )}
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
