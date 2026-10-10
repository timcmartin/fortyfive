import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ListMusic,
  LogIn,
  LogOut,
  Music2,
  X,
} from "lucide-react";
import { MetronomeControl } from "./MetronomeControl";
import { PerformanceLyrics } from "./PerformanceLyrics";
import { PerformanceSetListDrawer } from "./PerformanceSetListDrawer";
import { useScreenWakeLock } from "../hooks/useScreenWakeLock";

const PdfChartViewer = lazy(() =>
  import("./PdfChartViewer").then((module) => ({
    default: module.PdfChartViewer,
  })),
);

export function PerformanceView({
  songs,
  songsLoading,
  sets,
  setsLoading,
  setsError,
  songDatabaseError,
  setDatabaseError,
  sheetIndexError,
  lyricSheetIds,
  lyricSheets,
  lyricSheetRevisions,
  loadingSheets,
  sheetErrors,
  loadLyricSheet,
  reloadLyricSheet,
  saveLyricSheet,
  editorAuth,
  initialSongId,
  initialSet = null,
  onClose,
}) {
  const initialSongSet = initialSongId && !setsLoading
    ? sets
        .filter((set) => set.kind === "performance")
        .map((set) => ({ set, index: set.songIds.indexOf(initialSongId) }))
        .filter(({ index }) => index >= 0)
        .find(({ set }) => set.id === initialSet) ??
      sets
        .filter((set) => set.kind === "performance")
        .map((set) => ({ set, index: set.songIds.indexOf(initialSongId) }))
        .find(({ index }) => index >= 0)
    : null;
  const [selectedSetState, setSelectedSetState] = useState(() =>
    initialSongId
      ? ""
      : initialSet ??
        sets.find((set) => set.kind === "performance")?.id ??
        "set-1",
  );
  const selectedSet = initialSongId
    ? selectedSetState || (setsLoading ? "" : initialSongSet?.set.id ?? "individual")
    : sets.some((set) => set.id === selectedSetState)
      ? selectedSetState
      : (sets.find((set) => set.kind === "performance")?.id ?? "");
  const [currentIndexState, setCurrentIndexState] = useState(0);
  const currentIndex = selectedSetState
    ? currentIndexState
    : (initialSongSet?.index ?? 0);
  const [showSetList, setShowSetList] = useState(false);
  const [viewMode, setViewMode] = useState("lyrics");
  const [chartSelection, setChartSelection] = useState({
    songId: null,
    index: 0,
  });
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState(null);
  const { status: wakeLockStatus, error: wakeLockError } =
    useScreenWakeLock();
  const isIndividualSong = selectedSet === "individual";
  const selectedSetData = sets.find((set) => set.id === selectedSet);
  const setLoading = !isIndividualSong && (setsLoading || !selectedSet || !selectedSetData);
  const setError = !isIndividualSong ? setsError : null;
  const setItems = useMemo(
    () =>
      !isIndividualSong && selectedSetData
        ? selectedSetData.songIds.map((id) => ({ id }))
        : [],
    [isIndividualSong, selectedSetData],
  );
  const initialSongError =
    initialSongId && !setsLoading && !initialSongSet && setsError
      ? "Could not check every set list; opening this song individually."
      : null;

  const setSongs = useMemo(
    () =>
      setItems
        .map(({ id }) => songs.find((song) => song.id === id))
        .filter(Boolean),
    [setItems, songs],
  );
  const individualSong = isIndividualSong
    ? songs.find((item) => item.id === initialSongId)
    : null;
  const drawerSongs =
    isIndividualSong && individualSong ? [individualSong] : setSongs;
  const song = individualSong ?? setSongs[currentIndex];
  const lyricSheet = song ? lyricSheets[song.id] : null;
  const sections = Array.isArray(lyricSheet?.sections)
    ? lyricSheet.sections
    : [];
  const nextSong = !isIndividualSong ? setSongs[currentIndex + 1] : null;
  const chartUrls = song?.resources?.chartPdfUrl
    ? Array.isArray(song.resources.chartPdfUrl)
      ? song.resources.chartPdfUrl
      : [song.resources.chartPdfUrl]
    : [];
  const chartIndex =
    chartSelection.songId === song?.id ? chartSelection.index : 0;
  const chartUrl = chartUrls[chartIndex];

  useEffect(() => {
    if (song) void loadLyricSheet(song.id);
    if (nextSong) void loadLyricSheet(nextSong.id);
  }, [loadLyricSheet, nextSong, song]);

  const navigateToSong = useCallback(
    (index) => {
      const nextIndex = Math.max(0, Math.min(setSongs.length - 1, index));
      if (nextIndex === currentIndex) return;
      setSelectedSetState(selectedSet);
      setCurrentIndexState(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentIndex, selectedSet, setSongs.length],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          "input, select, textarea, [contenteditable='true']",
        )
      ) {
        return;
      }
      if (event.key === "Escape") {
        if (showSetList) setShowSetList(false);
        else onClose();
        return;
      }
      if (showSetList) return;
      if (setSongs.length === 0) return;
      if (event.key === "ArrowLeft") {
        navigateToSong(currentIndex - 1);
      } else if (event.key === "ArrowRight") {
        navigateToSong(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, navigateToSong, onClose, setSongs.length, showSetList]);

  const selectedSetLabel =
    selectedSet === "individual"
      ? "Individual song"
      : (selectedSetData?.label ??
        "Set");
  const hasPrevious = !isIndividualSong && currentIndex > 0;
  const hasNext = !isIndividualSong && currentIndex < setSongs.length - 1;

  const handleSignIn = async (event) => {
    event.preventDefault();
    setSignInError(null);
    try {
      await editorAuth.signIn(signInEmail, signInPassword);
      setSignInPassword("");
      setShowSignIn(false);
    } catch (error) {
      setSignInError(error.message);
    }
  };

  const handleSaveSections = async (nextSections) => {
    if (!song || !editorAuth.isEditor || !editorAuth.user) {
      throw new Error("Editor access is required to edit lyric sections.");
    }
    await saveLyricSheet(
      song.id,
      nextSections,
      editorAuth.user.id,
      lyricSheetRevisions[song.id] ?? null,
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Performance
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">Live performance</h1>
            {wakeLockStatus === "active" ? (
              <p className="mt-1 text-xs text-success">Screen will stay awake</p>
            ) : wakeLockStatus === "unsupported" ? (
              <p className="mt-1 text-xs text-base-content/50">
                Screen wake lock is not supported by this browser.
              </p>
            ) : wakeLockStatus === "unavailable" ? (
              <p className="mt-1 text-xs text-warning" role="status">
                Could not keep the screen awake{wakeLockError ? `: ${wakeLockError}` : "."}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowSetList(true)}
              aria-haspopup="dialog"
            >
              <ListMusic className="size-4" />
              Set list
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X className="size-4" />
              Back to catalog
            </button>
          </div>
        </div>

        <label className="mb-5 block max-w-sm">
          <span className="label-text mb-1 block">Set list</span>
          <select
            className="select select-bordered w-full"
            value={selectedSet}
            disabled={!selectedSet}
            onChange={(event) => {
              setSelectedSetState(event.target.value);
              setCurrentIndexState(0);
            }}
          >
            {initialSongId && !selectedSet && (
              <option value="" disabled>
                Finding song...
              </option>
            )}
            {initialSongId && (
              <option value="individual">Individual song</option>
            )}
            {sets.filter((set) => set.kind === "performance").map((set) => (
              <option key={set.id} value={set.id}>
                {set.label}
              </option>
            ))}
          </select>
        </label>

        {setError && <div className="alert alert-error mb-4">{setError}</div>}
        {songDatabaseError && (
          <div className="alert alert-warning mb-4" role="status">
            Supabase catalog unavailable; using JSON song data. {songDatabaseError}
          </div>
        )}
        {setDatabaseError && (
          <div className="alert alert-warning mb-4" role="status">
            Supabase setlists unavailable; using JSON setlists. {setDatabaseError}
          </div>
        )}
        {sheetIndexError && (
          <div className="alert alert-error mb-4">
            Lyric sheet availability could not be loaded: {sheetIndexError}
          </div>
        )}
        {initialSongError && (
          <div className="alert alert-warning mb-4">{initialSongError}</div>
        )}
        {setLoading || songsLoading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : song ? (
          <>
            <div className="mb-5 rounded-xl bg-base-100 p-4 shadow-sm">
              {editorAuth.loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : editorAuth.user ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    {editorAuth.isEditor
                      ? "Signed in as an editor"
                      : "Signed in, but this account does not have editor access"}
                  </p>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => void editorAuth.signOut()}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowSignIn((current) => !current)}
                    disabled={!editorAuth.configured}
                  >
                    <LogIn className="size-4" />
                    Editor sign in
                  </button>
                  {!editorAuth.configured && (
                    <p className="mt-2 text-sm text-warning">
                      Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable
                      editor access.
                    </p>
                  )}
                  {showSignIn && (
                    <form
                      className="mt-4 flex flex-wrap items-end gap-3"
                      onSubmit={handleSignIn}
                    >
                      <label className="form-control">
                        <span className="label-text mb-1">Email</span>
                        <input
                          className="input input-bordered"
                          type="email"
                          autoComplete="username"
                          required
                          value={signInEmail}
                          onChange={(event) => setSignInEmail(event.target.value)}
                        />
                      </label>
                      <label className="form-control">
                        <span className="label-text mb-1">Password</span>
                        <input
                          className="input input-bordered"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={signInPassword}
                          onChange={(event) =>
                            setSignInPassword(event.target.value)
                          }
                        />
                      </label>
                      <button className="btn btn-primary" type="submit">
                        Sign in
                      </button>
                    </form>
                  )}
                  {(signInError || editorAuth.error) && (
                    <p className="mt-3 text-sm text-error">
                      {signInError ?? editorAuth.error}
                    </p>
                  )}
                </>
              )}
              {editorAuth.user && editorAuth.error && (
                <p className="mt-3 text-sm text-error">{editorAuth.error}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm text-base-content/60">
                {selectedSetLabel} · Song {currentIndex + 1} of{" "}
                {isIndividualSong ? 1 : setSongs.length}
              </p>
              <p className="text-sm text-base-content/60">
                {song.performanceNotes?.leadSinger &&
                  `${song.performanceNotes.leadSinger} · `}
                {song.musicalDetails?.key}
              </p>
            </div>

            <article className="card bg-base-100 shadow-sm">
              <div className="card-body gap-5">
                <MetronomeControl
                  key={song.id}
                  tempo={song.musicalDetails?.bpm}
                />
                <header>
                  <h2 className="text-3xl sm:text-4xl font-bold">
                    {song.title}
                  </h2>
                  <p className="mt-1 text-base-content/60">
                    {song.artistInfo?.performanceVersion}
                  </p>
                  {song.performanceNotes?.arrangement && (
                    <p className="mt-3 rounded-lg bg-base-200 px-3 py-2 text-sm">
                      {song.performanceNotes.arrangement}
                    </p>
                  )}
                </header>

                <div
                  className="join self-start"
                  role="group"
                  aria-label="Performance view"
                >
                  <button
                    className={`btn join-item ${viewMode === "lyrics" ? "btn-primary" : "btn-outline"}`}
                    aria-pressed={viewMode === "lyrics"}
                    onClick={() => setViewMode("lyrics")}
                  >
                    Lyrics
                  </button>
                  <button
                    className={`btn join-item ${viewMode === "charts" ? "btn-primary" : "btn-outline"}`}
                    aria-pressed={viewMode === "charts"}
                    onClick={() => setViewMode("charts")}
                  >
                    Charts
                  </button>
                </div>

                {viewMode === "lyrics" ? (
                  <PerformanceLyrics
                    key={song.id}
                    song={song}
                    sections={sections}
                    canEdit={editorAuth.isEditor}
                    loading={Boolean(loadingSheets[song.id])}
                    error={sheetErrors[song.id]}
                    onReloadSheet={() => reloadLyricSheet(song.id)}
                    onSaveSections={handleSaveSections}
                  />
                ) : chartUrl ? (
                  <div className="space-y-3">
                    {chartUrls.length > 1 && (
                      <label className="form-control max-w-sm">
                        <span className="label-text mb-1">Chart</span>
                        <select
                          className="select select-bordered"
                          value={chartIndex}
                          onChange={(event) =>
                            setChartSelection({
                              songId: song.id,
                              index: Number(event.target.value),
                            })
                          }
                        >
                          {chartUrls.map((url, index) => (
                            <option key={`${url}-${index}`} value={index}>
                              Chart {index + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <Suspense
                      fallback={
                        <div className="flex justify-center py-12">
                          <span className="loading loading-spinner loading-lg" />
                        </div>
                      }
                    >
                      <PdfChartViewer
                        key={chartUrl}
                        url={chartUrl}
                        title={`${song.title} chart ${chartUrls.length > 1 ? chartIndex + 1 : ""}`}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-base-300 px-5 py-10 text-center">
                    <Music2 className="size-8 mx-auto mb-3 text-base-content/40" />
                    <p className="font-semibold">
                      No chart available for this song
                    </p>
                    <p className="mt-1 text-sm text-base-content/60">
                      Add a chart PDF URL to this song&apos;s resources in{" "}
                      <code>public/songs.json</code>.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <nav
              className="flex justify-between mt-5"
              aria-label="Set list navigation"
            >
              <button
                className="btn btn-lg"
                onClick={() => navigateToSong(currentIndex - 1)}
                disabled={!hasPrevious}
                aria-keyshortcuts="ArrowLeft"
              >
                <ArrowLeft className="size-5" />
                Previous
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigateToSong(currentIndex + 1)}
                disabled={!hasNext}
                aria-keyshortcuts="ArrowRight"
              >
                Next
                <ArrowRight className="size-5" />
              </button>
            </nav>
            <p className="text-center text-xs text-base-content/40 mt-3">
              Use the left and right arrow keys to navigate
            </p>
          </>
        ) : !setError ? (
          <div className="alert">
            This set list has no songs available in the catalog.
          </div>
        ) : null}
      </div>

      <PerformanceSetListDrawer
        open={showSetList}
        songs={drawerSongs}
        currentIndex={currentIndex}
        selectedSetLabel={selectedSetLabel}
        lyricSheetIds={lyricSheetIds}
        lyricSheets={lyricSheets}
        onSelectSong={(index) => {
          setSelectedSetState(selectedSet);
          setCurrentIndexState(index);
          setShowSetList(false);
        }}
        onClose={() => setShowSetList(false)}
      />
    </div>
  );
}
