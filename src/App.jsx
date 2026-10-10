import { useState, useMemo } from "react";
import { useSongs } from "./hooks/useSongs";
import { useSets } from "./hooks/useSets";
import { SearchBar } from "./components/SearchBar";
import { StatusFilter } from "./components/StatusFilter";
import { LeadSingerFilter } from "./components/LeadSingerFilter";
import { SongTable } from "./components/SongTable";
import { SongModal } from "./components/SongModal";
import { SetSelector } from "./components/SetSelector";
import { PerformanceView } from "./components/PerformanceView";
import { useLyricSheets } from "./hooks/useLyricSheets";
import { useEditorAuth } from "./hooks/useEditorAuth";
import { EditorAccess } from "./components/EditorAccess";
import { SongEditorModal } from "./components/SongEditorModal";
import { SetlistManager } from "./components/SetlistManager";

export default function App() {
  const editorAuth = useEditorAuth();
  const {
    songs,
    loading,
    error,
    databaseError: songDatabaseError,
    saveSong,
    deleteSong,
  } = useSongs(editorAuth.user?.id);
  const {
    sets,
    loading: loadingSets,
    error: setsError,
    databaseError: setDatabaseError,
    saveSet,
    deleteSet,
  } = useSets(editorAuth.user?.id);
  const {
    lyricSheetIds,
    lyricSheetIndexLoaded,
    indexError: sheetIndexError,
    lyricSheets,
    lyricSheetRevisions,
    loadingSheets,
    sheetErrors,
    loadLyricSheet,
    reloadLyricSheet,
    saveLyricSheet,
  } = useLyricSheets();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLeadSinger, setSelectedLeadSinger] = useState("all");
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedSet, setSelectedSet] = useState("all");
  const [editingSong, setEditingSong] = useState(null);
  const [showSongEditor, setShowSongEditor] = useState(false);
  const [showSetlistManager, setShowSetlistManager] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [performanceSongId, setPerformanceSongId] = useState(null);
  const setOrder = useMemo(
    () => sets.find((set) => set.id === selectedSet)?.songIds ?? [],
    [sets, selectedSet],
  );
  const initialPerformanceSet =
    selectedSet !== "all" &&
    sets.some((set) => set.id === selectedSet && set.kind === "performance")
      ? selectedSet
      : null;

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
        sets={sets}
        setsLoading={loadingSets}
        setsError={setsError}
        songDatabaseError={songDatabaseError}
        setDatabaseError={setDatabaseError}
        sheetIndexError={sheetIndexError}
        lyricSheetIds={lyricSheetIds}
        lyricSheetIndexLoaded={lyricSheetIndexLoaded}
        lyricSheets={lyricSheets}
        lyricSheetRevisions={lyricSheetRevisions}
        loadingSheets={loadingSheets}
        sheetErrors={sheetErrors}
        loadLyricSheet={loadLyricSheet}
        reloadLyricSheet={reloadLyricSheet}
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
          <div className="mt-3 flex justify-center">
            <EditorAccess editorAuth={editorAuth} />
          </div>
        </div>

        {songDatabaseError && (
          <div className="alert alert-warning mb-4" role="status">
            Could not load song changes from Supabase; showing JSON catalog data. {songDatabaseError}
          </div>
        )}
        {setDatabaseError && (
          <div className="alert alert-warning mb-4" role="status">
            Could not load setlist changes from Supabase; showing JSON setlists. {setDatabaseError}
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-6">
            <span>Error loading songs: {error}</span>
          </div>
        )}

        {setsError && (
          <div className="alert alert-error mb-6">
            <span>Error loading setlists: {setsError}</span>
          </div>
        )}

        {sheetIndexError && (
          <div className="alert alert-error mb-6">
            <span>Error loading lyric sheet availability: {sheetIndexError}</span>
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
              {editorAuth.isEditor && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingSong(null);
                      setShowSongEditor(true);
                    }}
                  >
                    Add song
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowSetlistManager(true)}
                    disabled={loadingSets}
                  >
                    Manage setlists
                  </button>
                </div>
              )}
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
              <SetSelector
                selectedSet={selectedSet}
                onChange={handleSetChange}
                loading={loadingSets}
                sets={sets}
              />
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
        isEditor={editorAuth.isEditor}
        onEditSong={(song) => {
          setSelectedSong(null);
          setEditingSong(song);
          setShowSongEditor(true);
        }}
      />
      {showSongEditor && (
        <SongEditorModal
          open
          song={editingSong}
          onClose={() => setShowSongEditor(false)}
          onSave={saveSong}
          onDelete={deleteSong}
        />
      )}
      {showSetlistManager && (
        <SetlistManager
          open
          sets={sets}
          songs={songs}
          onClose={() => setShowSetlistManager(false)}
          onSave={saveSet}
          onDelete={deleteSet}
        />
      )}
    </div>
  );
}
