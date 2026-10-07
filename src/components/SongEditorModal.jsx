import { useEffect, useRef, useState } from "react";
import { Save, X } from "lucide-react";

function emptySong() {
  return {
    id: "",
    title: "",
    artistInfo: { performanceVersion: "", originalArtist: "" },
    musicalDetails: { key: "", bpm: "" },
    performanceNotes: {
      arrangement: "",
      leadSinger: "",
      specialNotes: "",
      generalNotes: "",
    },
    resources: {
      youtubeUrl: "",
      mp3Url: "",
      chartPdfUrl: "",
      lyricsUrls: [],
    },
    status: "learning",
    dateAdded: new Date().toISOString().slice(0, 10),
    lastUpdated: new Date().toISOString().slice(0, 10),
  };
}

export function SongEditorModal({
  open,
  song,
  onClose,
  onSave,
  onDelete,
}) {
  const dialogRef = useRef(null);
  const [draft, setDraft] = useState(() =>
    JSON.stringify(song ?? emptySong(), null, 2),
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleSave = async (event) => {
    event.preventDefault();
    setError(null);
    let parsed;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError("Enter valid JSON before saving.");
      return;
    }
    if (
      !parsed ||
      Array.isArray(parsed) ||
      typeof parsed !== "object" ||
      typeof parsed.id !== "string" ||
      !parsed.id.trim() ||
      typeof parsed.title !== "string" ||
      !parsed.title.trim()
    ) {
      setError('Song JSON must be an object with non-empty "id" and "title" fields.');
      return;
    }
    if (song && parsed.id !== song.id) {
      setError("A song's ID cannot be changed after it has been created.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...parsed,
        id: parsed.id.trim(),
        title: parsed.title.trim(),
        lastUpdated: new Date().toISOString().slice(0, 10),
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!song || !window.confirm(`Delete "${song.title}" from the catalog?`)) return;
    setError(null);
    setSaving(true);
    try {
      await onDelete(song.id);
      onClose();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{song ? `Edit ${song.title}` : "Add song"}</h2>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <form className="space-y-3" onSubmit={handleSave}>
          <label className="form-control">
            <span className="label-text mb-1">Song data (JSON)</span>
            <textarea
              className="textarea textarea-bordered min-h-96 font-mono text-sm"
              spellCheck="false"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              {song && (
                <button className="btn btn-error btn-outline" type="button" disabled={saving} onClick={() => void handleDelete()}>
                  Delete song
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" type="button" disabled={saving} onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm" /> : <Save className="size-4" />}
                Save song
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
