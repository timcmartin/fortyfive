import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ListMusic, Music2, X } from "lucide-react";
import { PERFORMANCE_SETS } from "@/lib/sets";

const PART_LABELS = {
  verse: "Verse",
  preChorus: "Pre-Chorus",
  chorus: "Chorus",
  bridge: "Bridge",
  instrumental: "Instrumental",
  bassSolo: "Bass Solo",
  guitarSolo: "Guitar Solo",
  intro: "Intro",
  outro: "Outro",
  tag: "Tag",
  vamp: "Vamp",
  breakdown: "Breakdown",
  interlude: "Interlude",
  ending: "Ending",
};

const SINGER_LABELS = {
  olivia: "Olivia",
  heather: "Heather",
  steve: "Steve",
  richard: "Richard",
  gang: "Gang",
};

async function fetchSetItems(setId) {
  const response = await fetch(`/sets/${setId}.json`);
  if (!response.ok) throw new Error(`Failed to load ${setId}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error(`${setId} must be an array`);
  return data;
}

function formatLabel(value) {
  return PART_LABELS[value] ?? value.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function LyricSection({ section }) {
  const label = formatLabel(section.part || "section");
  const isCue = ["intro", "instrumental", "bassSolo", "guitarSolo"].includes(section.part);
  const sectionStyle = isCue || section.part === "intro"
    ? "performance-cue"
    : section.part === "chorus"
      ? "performance-chorus"
      : "performance-lyrics";
  const lyrics = typeof section.lyrics === "string"
    ? section.lyrics
    : Array.isArray(section.lyrics)
      ? section.lyrics.join("\n")
      : "";
  const singer = section.singer
    ? SINGER_LABELS[section.singer] ?? section.singer
    : null;

  return (
    <section className={`performance-section ${sectionStyle}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider">{label}</h3>
        {singer && <span className="badge badge-sm badge-outline">{singer}</span>}
        {section.bars != null && (
          <span className="badge badge-sm badge-warning">
            {typeof section.bars === "number" ? `${section.bars} bars` : section.bars}
          </span>
        )}
        {section.notes && <span className="text-sm font-medium">{section.notes}</span>}
      </div>
      {lyrics ? (
        <p className="whitespace-pre-line text-xl leading-relaxed">{lyrics}</p>
      ) : isCue ? (
        <p className="text-lg font-semibold">
          {section.bars != null
            ? typeof section.bars === "number"
              ? `Play for ${section.bars} bars`
              : section.bars
            : `${label} cue`}
        </p>
      ) : (
        <p className="text-base-content/40 italic">Lyrics not entered</p>
      )}
    </section>
  );
}

export function PerformanceView({
  songs,
  songsLoading,
  lyricSheets,
  sheetsLoading,
  initialSongId,
  onClose,
}) {
  const [selectedSet, setSelectedSet] = useState(
    initialSongId ? "" : PERFORMANCE_SETS[0]?.value ?? "",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSetList, setShowSetList] = useState(false);
  const [viewMode, setViewMode] = useState("lyrics");
  const [chartSelection, setChartSelection] = useState({ songId: null, index: 0 });
  const [setResource, setSetResource] = useState({ set: null, items: [], error: null });
  const [initialSongError, setInitialSongError] = useState(null);
  const setListDialogRef = useRef(null);
  const isIndividualSong = selectedSet === "individual";
  const setLoading = !isIndividualSong && (!selectedSet || setResource.set !== selectedSet);
  const setError = !isIndividualSong && setResource.set === selectedSet
    ? setResource.error
    : null;
  const setItems = useMemo(
    () => !isIndividualSong && setResource.set === selectedSet ? setResource.items : [],
    [isIndividualSong, setResource, selectedSet],
  );

  useEffect(() => {
    if (!initialSongId) return;

    let mounted = true;
    Promise.allSettled(
      PERFORMANCE_SETS.map(async (set) => ({
        set,
        items: await fetchSetItems(set.value),
      })),
    ).then((results) => {
      if (!mounted) return;
      const availableSets = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);
      const match = availableSets
        .map(({ set, items }) => ({
          set,
          items,
          index: items.findIndex((item) => item.id === initialSongId),
        }))
        .find(({ index }) => index >= 0);
      const hadLoadErrors = results.some((result) => result.status === "rejected");

      if (match) {
        setSelectedSet(match.set.value);
        setCurrentIndex(match.index);
        setSetResource({ set: match.set.value, items: match.items, error: null });
      } else {
        setSelectedSet("individual");
        setCurrentIndex(0);
        if (hadLoadErrors) {
          setInitialSongError("Could not check every set list; opening this song individually.");
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [initialSongId]);

  useEffect(() => {
    if (!selectedSet || isIndividualSong) return;

    let mounted = true;
    fetchSetItems(selectedSet)
      .then((data) => {
        if (!mounted) return;
        setSetResource({ set: selectedSet, items: data, error: null });
      })
      .catch((error) => {
        if (!mounted) return;
        setSetResource({ set: selectedSet, items: [], error: error.message });
      });

    return () => {
      mounted = false;
    };
  }, [isIndividualSong, selectedSet]);

  useEffect(() => {
    const dialog = setListDialogRef.current;
    if (!dialog) return;
    if (showSetList && !dialog.open) dialog.showModal();
    if (!showSetList && dialog.open) dialog.close();
  }, [showSetList]);

  const setSongs = useMemo(
    () => setItems.map(({ id }) => songs.find((song) => song.id === id)).filter(Boolean),
    [setItems, songs],
  );
  const individualSong = isIndividualSong
    ? songs.find((item) => item.id === initialSongId)
    : null;
  const drawerSongs = isIndividualSong && individualSong ? [individualSong] : setSongs;
  const song = individualSong ?? setSongs[currentIndex];
  const lyricSheet = song ? lyricSheets[song.id] : null;
  const sections = Array.isArray(lyricSheet?.sections) ? lyricSheet.sections : [];
  const chartUrls = song?.resources?.chartPdfUrl
    ? Array.isArray(song.resources.chartPdfUrl)
      ? song.resources.chartPdfUrl
      : [song.resources.chartPdfUrl]
    : [];
  const chartIndex = chartSelection.songId === song?.id ? chartSelection.index : 0;
  const chartUrl = chartUrls[chartIndex];

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, select, textarea, [contenteditable='true']")) {
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
        setCurrentIndex((index) => Math.max(0, index - 1));
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((index) => Math.min(setSongs.length - 1, index + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, setSongs.length, showSetList]);

  const selectedSetLabel =
    selectedSet === "individual"
      ? "Individual song"
      : PERFORMANCE_SETS.find((set) => set.value === selectedSet)?.label ?? "Set";
  const hasPrevious = !isIndividualSong && currentIndex > 0;
  const hasNext = !isIndividualSong && currentIndex < setSongs.length - 1;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Performance</p>
            <h1 className="text-2xl sm:text-3xl font-bold">Live performance</h1>
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

        <label className="form-control max-w-sm mb-5">
          <span className="label-text mb-1">Set list</span>
          <select
            className="select select-bordered"
            value={selectedSet}
            disabled={!selectedSet}
            onChange={(event) => {
              setSelectedSet(event.target.value);
              setCurrentIndex(0);
            }}
          >
            {initialSongId && !selectedSet && (
              <option value="" disabled>Finding song...</option>
            )}
            {initialSongId && (
              <option value="individual">Individual song</option>
            )}
            {PERFORMANCE_SETS.map((set) => (
              <option key={set.value} value={set.value}>{set.label}</option>
            ))}
          </select>
        </label>

        {setError && <div className="alert alert-error mb-4">{setError}</div>}
        {initialSongError && <div className="alert alert-warning mb-4">{initialSongError}</div>}
        {sheetsLoading && (
          <div className="flex justify-center py-5">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}

        {setLoading || songsLoading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : song ? (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm text-base-content/60">
                {selectedSetLabel} · Song {currentIndex + 1} of {isIndividualSong ? 1 : setSongs.length}
              </p>
              <p className="text-sm text-base-content/60">
                {song.performanceNotes?.leadSinger && `${song.performanceNotes.leadSinger} · `}
                {song.musicalDetails?.key}
              </p>
            </div>

            <article className="card bg-base-100 shadow-sm">
              <div className="card-body gap-5">
                <header>
                  <h2 className="text-3xl sm:text-4xl font-bold">{song.title}</h2>
                  <p className="mt-1 text-base-content/60">{song.artistInfo?.performanceVersion}</p>
                  {song.performanceNotes?.arrangement && (
                    <p className="mt-3 rounded-lg bg-base-200 px-3 py-2 text-sm">
                      {song.performanceNotes.arrangement}
                    </p>
                  )}
                </header>

                <div className="join self-start" role="group" aria-label="Performance view">
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
                  sections.length > 0 ? (
                    <div className="space-y-4">
                      {sections.map((section, index) => (
                        <LyricSection key={section.id ?? `${section.part}-${index}`} section={section} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-base-300 px-5 py-10 text-center">
                      <Music2 className="size-8 mx-auto mb-3 text-base-content/40" />
                      <p className="font-semibold">No performance sheet yet</p>
                      <p className="mt-1 text-sm text-base-content/60">
                        Add this song&apos;s ordered sections to <code>public/lyric-sheets.json</code>.
                      </p>
                      {song.resources?.lyricsUrls?.[0] && (
                        <a
                          className="btn btn-sm btn-outline mt-4"
                          href={song.resources.lyricsUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open external lyrics
                        </a>
                      )}
                    </div>
                  )
                ) : chartUrl ? (
                  <div className="space-y-3">
                    {chartUrls.length > 1 && (
                      <label className="form-control max-w-sm">
                        <span className="label-text mb-1">Chart</span>
                        <select
                          className="select select-bordered"
                          value={chartIndex}
                          onChange={(event) => setChartSelection({
                            songId: song.id,
                            index: Number(event.target.value),
                          })}
                        >
                          {chartUrls.map((url, index) => (
                            <option key={`${url}-${index}`} value={index}>
                              Chart {index + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <iframe
                      key={chartUrl}
                      className="h-[70vh] min-h-96 w-full rounded-lg border border-base-300 bg-white"
                      src={chartUrl}
                      title={`${song.title} chart ${chartUrls.length > 1 ? chartIndex + 1 : ""}`}
                    />
                    <a
                      className="btn btn-sm btn-outline"
                      href={chartUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open chart in a new tab
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-base-300 px-5 py-10 text-center">
                    <Music2 className="size-8 mx-auto mb-3 text-base-content/40" />
                    <p className="font-semibold">No chart available for this song</p>
                    <p className="mt-1 text-sm text-base-content/60">
                      Add a chart PDF URL to this song&apos;s resources in <code>public/songs.json</code>.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <nav className="flex justify-between mt-5" aria-label="Set list navigation">
              <button
                className="btn btn-lg"
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                disabled={!hasPrevious}
                aria-keyshortcuts="ArrowLeft"
              >
                <ArrowLeft className="size-5" />
                Previous
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setCurrentIndex((index) => Math.min(setSongs.length - 1, index + 1))}
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
          <div className="alert">This set list has no songs available in the catalog.</div>
        ) : null}
      </div>

      <dialog
        ref={setListDialogRef}
        className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/40"
        aria-label={`${selectedSetLabel} song list`}
        onCancel={(event) => {
          event.preventDefault();
          setShowSetList(false);
        }}
        onClick={(event) => {
          if (event.target === setListDialogRef.current) setShowSetList(false);
        }}
      >
        <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-base-100 shadow-xl">
          <header className="flex items-start justify-between gap-3 border-b border-base-300 p-5">
            <div>
              <p className="text-sm text-base-content/60">{selectedSetLabel}</p>
              <h2 className="text-xl font-bold">Jump to a song</h2>
            </div>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowSetList(false)}
              aria-label="Close set list"
            >
              <X className="size-4" />
            </button>
          </header>
          <nav className="flex-1 overflow-y-auto p-3" aria-label={`${selectedSetLabel} songs`}>
            {drawerSongs.map((setSong, index) => {
              const isCurrentSong = index === currentIndex;
              const hasSheet = lyricSheets[setSong.id]?.sections?.length > 0;
              const hasChart = Boolean(setSong.resources?.chartPdfUrl?.length) ||
                typeof setSong.resources?.chartPdfUrl === "string";
              return (
                <button
                  key={setSong.id}
                  className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                    isCurrentSong ? "bg-primary text-primary-content" : "hover:bg-base-200"
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setShowSetList(false);
                  }}
                  aria-current={isCurrentSong ? "true" : undefined}
                >
                  <span className="w-7 shrink-0 text-right text-sm opacity-70">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{setSong.title}</span>
                    <span className="block truncate text-xs opacity-70">
                      {setSong.performanceNotes?.leadSinger || setSong.artistInfo?.performanceVersion}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {hasSheet && <span className={`badge badge-sm ${isCurrentSong ? "badge-outline" : "badge-ghost"}`}>Lyrics</span>}
                    {hasChart && <span className={`badge badge-sm ${isCurrentSong ? "badge-outline" : "badge-ghost"}`}>Chart</span>}
                    {!hasSheet && !hasChart && (
                      <span className={`badge badge-sm ${isCurrentSong ? "badge-outline" : "badge-ghost"}`}>No sheet</span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
      </dialog>
    </div>
  );
}
