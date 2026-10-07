import { useState, useMemo, useEffect } from "react";
import { useSongs } from "./hooks/useSongs";
import { SearchBar } from "./components/SearchBar";
import { StatusFilter } from "./components/StatusFilter";
import { LeadSingerFilter } from "./components/LeadSingerFilter";
import { SongTable } from "./components/SongTable";
import { SongModal } from "./components/SongModal";
import { SetSelector } from "./components/SetSelector";
import { PerformanceView } from "./components/PerformanceView";
import { PERFORMANCE_SETS } from "./lib/sets";
import { useLyricSheets } from "./hooks/useLyricSheets";
import { useEditorAuth } from "./hooks/useEditorAuth";

export default function App() {
  const { songs, loading, error } = useSongs();
  const {
    lyricSheetIds,
    lyricSheetIndexLoaded,
    indexError: sheetIndexError,
    lyricSheets,
    loadingSheets,
    sheetErrors,
    loadLyricSheet,
    saveLyricSheet,
  } = useLyricSheets();
  const editorAuth = useEditorAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLeadSinger, setSelectedLeadSinger] = useState("all");
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedSet, setSelectedSet] = useState("all");
  const [setResource, setSetResource] = useState({ set: null, ids: [], error: null });
  const [showPerformance, setShowPerformance] = useState(false);
  const [performanceSongId, setPerformanceSongId] = useState(null);
  const setsLoading = selectedSet !== "all" && setResource.set !== selectedSet;
  const setOrder = useMemo(
    () => setResource.set === selectedSet ? setResource.ids : [],
    [setResource, selectedSet],
  );
  const setsError = setResource.set === selectedSet ? setResource.error : null;
  const initialPerformanceSet =
    selectedSet !== "all" &&
    PERFORMANCE_SETS.some((set) => set.value === selectedSet)
      ? selectedSet
      : null;

  useEffect(() => {
    if (selectedSet === "all") return;

    let mounted = true;
    fetch(`/sets/${selectedSet}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load set");
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Set list must be an array");
        if (!mounted) return;
        setSetResource({ set: selectedSet, ids: data.map((item) => item.id), error: null });
      })
      .catch((err) => {
        if (!mounted) return;
        setSetResource({ set: selectedSet, ids: [], error: err.message });
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

  if (showPerformance) {
    return (
      <PerformanceView
        songs={songs}
        songsLoading={loading}
        sheetIndexError={sheetIndexError}
        lyricSheetIds={lyricSheetIds}
        lyricSheetIndexLoaded={lyricSheetIndexLoaded}
        lyricSheets={lyricSheets}
        loadingSheets={loadingSheets}
        sheetErrors={sheetErrors}
        loadLyricSheet={loadLyricSheet}
        saveLyricSheet={saveLyricSheet}
        editorAuth={editorAuth}
        initialSongId={performanceSongId}
        initialSet={initialPerformanceSet}
        onClose={() => {
          setShowPerformance(false);
          setPerformanceSongId(null);
        }}
      />
    );
  }

  const handleSetChange = (set) => {
    setSelectedSet(set);
    if (set !== "all") {
      setSelectedStatus("all");
      setSelectedLeadSinger("all");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">FortyFive Song Catalog</h1>
          <p className="text-base-content/60 mt-2">
            Browse and learn about all the songs in our repertoire
          </p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => {
              setPerformanceSongId(null);
              setShowPerformance(true);
            }}
          >
            Open Performance Mode
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>Error loading songs: {error}</span>
          </div>
        )}

        {sheetIndexError && (
          <div className="alert alert-error mb-6">
            <span>Error loading lyric sheet availability: {sheetIndexError}</span>
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
              <SetSelector selectedSet={selectedSet} onChange={handleSetChange} loading={setsLoading} />
              <p className="text-sm text-base-content/50">
                Showing {filteredSongs.length} of {songs.length} songs
                {selectedSet !== "all" && setOrder.length > 0 && (
                  <> — viewing {selectedSet.replace('-', ' ')}</>
                )}
              </p>
              <SongTable
                songs={filteredSongs}
                lyricSheetIds={lyricSheetIds}
                lyricSheetIndexLoaded={lyricSheetIndexLoaded}
                onSelectSong={setSelectedSong}
                onStartPerformance={(songId) => {
                  setPerformanceSongId(songId);
                  setShowPerformance(true);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <SongModal
        song={selectedSong}
        lyricSheetIds={lyricSheetIds}
        lyricSheetIndexLoaded={lyricSheetIndexLoaded}
        onClose={() => setSelectedSong(null)}
        onStartPerformance={(songId) => {
          setPerformanceSongId(songId);
          setSelectedSong(null);
          setShowPerformance(true);
        }}
      />
    </div>
  );
}
