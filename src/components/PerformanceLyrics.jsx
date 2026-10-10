import { useEffect, useRef, useState } from "react";
import { Music2, Pencil, Save } from "lucide-react";

const PART_LABELS = {
  verse: "Verse",
  preChorus: "Pre-Chorus",
  postChorus: "Post-Chorus",
  chorus: "Chorus",
  bridge: "Bridge",
  instrumental: "Instrumental",
  break: "Break",
  bassSolo: "Bass Solo",
  guitarSolo: "Guitar Solo",
  keyboardSolo: "Keyboard Solo",
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

const SINGER_STYLES = {
  olivia: "performance-singer-olivia",
  heather: "performance-singer-heather",
  steve: "performance-singer-steve",
  richard: "performance-singer-richard",
  gang: "performance-singer-gang",
};

function formatPartLabel(value) {
  return (
    PART_LABELS[value] ??
    value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase())
  );
}

function LyricSection({
  section,
  canEdit,
  onSaveSinger,
  onSaveLyrics,
  onReloadLatest,
  reloading,
}) {
  const [editingSinger, setEditingSinger] = useState(false);
  const [savingSinger, setSavingSinger] = useState(false);
  const [singerError, setSingerError] = useState(null);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [lyricsDraft, setLyricsDraft] = useState("");
  const [savingLyrics, setSavingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  const singerEditorRef = useRef(null);
  const label = formatPartLabel(section.part || "section");
  const isCue = [
    "intro",
    "instrumental",
    "bassSolo",
    "guitarSolo",
    "keyboardSolo",
    "break",
  ].includes(section.part);
  const lyrics =
    typeof section.lyrics === "string"
      ? section.lyrics
      : Array.isArray(section.lyrics)
        ? section.lyrics.join("\n")
        : "";
  const hasLyrics = Boolean(lyrics.trim());
  const singerValue =
    typeof section.singer === "string" ? section.singer.trim() : "";
  const singerKey = singerValue.toLowerCase();
  const selectedSinger = Object.hasOwn(SINGER_LABELS, singerKey)
    ? singerKey
    : singerValue;
  const singer = singerValue
    ? (SINGER_LABELS[singerKey] ?? singerValue)
    : null;
  const sectionStyle = hasLyrics
    ? (SINGER_STYLES[singerKey] ?? "performance-singer-default")
    : "performance-no-lyrics";

  useEffect(() => {
    if (!editingSinger) return undefined;

    const handlePointerDown = (event) => {
      if (!singerEditorRef.current?.contains(event.target)) {
        setEditingSinger(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setEditingSinger(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingSinger]);

  const handleSingerChange = async (event) => {
    const nextSinger = event.target.value;
    setSavingSinger(true);
    setSingerError(null);
    try {
      await onSaveSinger(nextSinger);
      setEditingSinger(false);
    } catch (error) {
      setSingerError(error);
    } finally {
      setSavingSinger(false);
    }
  };

  const handleSaveLyrics = async (event) => {
    event.preventDefault();
    setSavingLyrics(true);
    setLyricsError(null);
    try {
      const lines = lyricsDraft === "" ? [] : lyricsDraft.split("\n");
      await onSaveLyrics(lines);
      setEditingLyrics(false);
    } catch (error) {
      setLyricsError(error);
    } finally {
      setSavingLyrics(false);
    }
  };

  return (
    <section className={`performance-section ${sectionStyle}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider">{label}</h3>
        {singer && (
          <span className="badge badge-sm badge-outline">{singer}</span>
        )}
        {section.bars != null && (
          <span className="badge badge-sm badge-warning">
            {typeof section.bars === "number"
              ? `${section.bars} bars`
              : section.bars}
          </span>
        )}
        {section.notes && (
          <span className="text-sm font-medium">{section.notes}</span>
        )}
        {hasLyrics && canEdit && (
          <div
            ref={singerEditorRef}
            className="inline-flex items-center gap-2"
          >
            <button
              className="btn btn-ghost btn-xs"
              type="button"
              aria-label={`Edit singer for ${label}`}
              aria-expanded={editingSinger}
              onClick={() => {
                setSingerError(null);
                setEditingSinger((current) => !current);
              }}
            >
              <Pencil className="size-3" />
              Edit singer
            </button>
            {editingSinger && (
              <select
                className="select select-bordered select-xs"
                aria-label={`Singer for ${label}`}
                value={selectedSinger}
                disabled={savingSinger}
                onChange={(event) => void handleSingerChange(event)}
              >
                <option value="">No singer</option>
                {singerValue && !Object.hasOwn(SINGER_LABELS, singerKey) && (
                  <option value={singerValue}>{singerValue}</option>
                )}
                {Object.entries(SINGER_LABELS).map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            {savingSinger && (
              <span
                className="loading loading-spinner loading-xs"
                aria-label="Saving singer"
              />
            )}
            {singerError && (
              <span className="text-xs text-error" role="alert">
                Could not save singer: {singerError.message}
                {singerError.name === "LyricSheetConflictError" && (
                  <button
                    className="btn btn-link btn-xs"
                    type="button"
                    disabled={reloading}
                    onClick={onReloadLatest}
                  >
                    {reloading ? "Reloading…" : "Reload latest"}
                  </button>
                )}
              </span>
            )}
          </div>
        )}
        {canEdit && (
          <button
            className="btn btn-ghost btn-xs"
            type="button"
            aria-label={`Edit lyrics for ${label}`}
            aria-expanded={editingLyrics}
            onClick={() => {
              setLyricsDraft(lyrics);
              setLyricsError(null);
              setEditingLyrics((current) => !current);
            }}
          >
            <Pencil className="size-3" />
            Edit lyrics
          </button>
        )}
      </div>
      {editingLyrics ? (
        <form className="space-y-3" onSubmit={handleSaveLyrics}>
          <label className="form-control">
            <span className="label-text mb-1">{label} lyrics</span>
            <textarea
              className="textarea textarea-bordered w-full min-h-40 text-lg leading-relaxed"
              aria-label={`${label} lyrics`}
              value={lyricsDraft}
              disabled={savingLyrics}
              onChange={(event) => setLyricsDraft(event.target.value)}
            />
          </label>
          {lyricsError && (
            <p className="text-sm text-error" role="alert">
              Could not save lyrics: {lyricsError.message}
              {lyricsError.name === "LyricSheetConflictError" && (
                <button
                  className="btn btn-link btn-xs ml-2"
                  type="button"
                  disabled={reloading}
                  onClick={onReloadLatest}
                >
                  {reloading ? "Reloading…" : "Reload latest"}
                </button>
              )}
            </p>
          )}
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              disabled={savingLyrics}
            >
              {savingLyrics ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Save className="size-4" />
              )}
              Save lyrics
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              disabled={savingLyrics}
              onClick={() => setEditingLyrics(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : hasLyrics ? (
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

export function PerformanceLyrics({
  song,
  sections,
  canEdit,
  loading,
  error,
  onSaveSections,
  onReloadSheet,
}) {
  const [editingSheet, setEditingSheet] = useState(false);
  const [sheetDraft, setSheetDraft] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [savingSheet, setSavingSheet] = useState(false);
  const [savedMessage, setSavedMessage] = useState(null);
  const [reloadError, setReloadError] = useState(null);
  const [reloading, setReloading] = useState(false);
  const [sectionEditorVersion, setSectionEditorVersion] = useState(0);
  const feedbackTimer = useRef(null);

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const saveSections = async (nextSections) => {
    setSavedMessage(null);
    await onSaveSections(nextSections);
    setSavedMessage("Changes saved.");
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setSavedMessage(null), 3000);
  };

  const reloadLatest = async () => {
    setReloadError(null);
    setReloading(true);
    try {
      const latestSheet = await onReloadSheet();
      if (!latestSheet) {
        throw new Error("Could not load the latest sheet. Please try again.");
      }
      if (!Array.isArray(latestSheet.sections)) {
        throw new Error("The latest lyric sheet has invalid sections.");
      }
      setSheetDraft(JSON.stringify({ sections: latestSheet.sections }, null, 2));
      setEditingSheet(false);
      setSectionEditorVersion((version) => version + 1);
      setSavedMessage(null);
    } catch (error) {
      setReloadError(error.message);
    } finally {
      setReloading(false);
    }
  };

  const handleSaveSheet = async (event) => {
    event.preventDefault();
    setSaveError(null);

    let parsed;
    try {
      parsed = JSON.parse(sheetDraft);
    } catch {
      setSaveError(new Error("Enter valid JSON before saving."));
      return;
    }
    if (!parsed || !Array.isArray(parsed.sections)) {
      setSaveError(new Error('The JSON must have a "sections" array.'));
      return;
    }

    setSavingSheet(true);
    try {
      await saveSections(parsed.sections);
      setEditingSheet(false);
    } catch (saveFailure) {
      setSaveError(saveFailure);
    } finally {
      setSavingSheet(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="alert alert-error">{error}</div>
        {canEdit && (
          <button
            className="btn btn-outline btn-sm"
            type="button"
            disabled={reloading}
            onClick={() => void reloadLatest()}
          >
            {reloading ? "Reloading…" : "Retry loading lyric sheet"}
          </button>
        )}
        {reloadError && (
          <p className="text-sm text-error" role="alert">{reloadError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedMessage && (
        <p className="text-sm text-success" role="status">
          {savedMessage}
        </p>
      )}
      {reloadError && (
        <p className="text-sm text-error" role="alert">
          {reloadError}
        </p>
      )}
      {canEdit && (
        <div className="space-y-3">
          {!editingSheet ? (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSheetDraft(
                  JSON.stringify({ sections }, null, 2),
                );
                setSaveError(null);
                setSavedMessage(null);
                setEditingSheet(true);
              }}
            >
              <Pencil className="size-4" />
              Edit sheet
            </button>
          ) : (
            <form className="space-y-3" onSubmit={handleSaveSheet}>
              <label className="form-control">
                <span className="label-text mb-1">Lyric sheet JSON</span>
                <textarea
                  className="textarea textarea-bordered min-h-96 font-mono text-sm"
                  spellCheck="false"
                  value={sheetDraft}
                  onChange={(event) => setSheetDraft(event.target.value)}
                />
              </label>
              {saveError && (
                <p className="text-sm text-error" role="alert">
                  {saveError.message}
                  {saveError.name === "LyricSheetConflictError" && (
                    <button
                      className="btn btn-link btn-xs ml-2"
                      type="button"
                      disabled={reloading}
                      onClick={() => void reloadLatest()}
                    >
                      {reloading ? "Reloading…" : "Reload latest sheet"}
                    </button>
                  )}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={savingSheet}
                >
                  {savingSheet ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save sheet
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={savingSheet}
                  onClick={() => setEditingSheet(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {editingSheet ? null : sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <LyricSection
              key={`${song.id}:${sectionEditorVersion}:${section.id ?? `${section.part}-${index}`}`}
              section={section}
              canEdit={canEdit}
              onReloadLatest={() => void reloadLatest()}
              reloading={reloading}
              onSaveSinger={(singer) =>
                saveSections(
                  sections.map((current, currentIndex) =>
                    currentIndex === index ? { ...current, singer } : current,
                  ),
                )
              }
              onSaveLyrics={(lyrics) =>
                saveSections(
                  sections.map((current, currentIndex) =>
                    currentIndex === index ? { ...current, lyrics } : current,
                  ),
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-base-300 px-5 py-10 text-center">
          <Music2 className="size-8 mx-auto mb-3 text-base-content/40" />
          <p className="font-semibold">No performance sheet yet</p>
          <p className="mt-1 text-sm text-base-content/60">
            {canEdit
              ? "Use Edit sheet to add its ordered sections."
              : "An editor can add its ordered sections."}
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
      )}
    </div>
  );
}
