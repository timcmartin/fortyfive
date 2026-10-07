import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";

function makeSetId(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SetlistManager({
  open,
  sets,
  songs,
  onClose,
  onSave,
  onDelete,
}) {
  const dialogRef = useRef(null);
  const [activeId, setActiveId] = useState(() => sets[0]?.id ?? null);
  const [draft, setDraft] = useState(() => {
    const firstSet = sets[0];
    return firstSet
      ? { label: firstSet.label, kind: firstSet.kind, songIds: [...firstSet.songIds] }
      : { label: "", kind: "performance", songIds: [] };
  });
  const [songToAdd, setSongToAdd] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const selectedSet = sets.find((set) => set.id === activeId) ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const selectSet = (setId) => {
    const set = sets.find((item) => item.id === setId);
    setActiveId(set?.id ?? null);
    setDraft(
      set
        ? { label: set.label, kind: set.kind, songIds: [...set.songIds] }
        : { label: "", kind: "performance", songIds: [] },
    );
    setError(null);
  };

  const startNewSet = () => {
    selectSet(null);
    setSongToAdd("");
  };

  const updateSongIds = (songIds) => setDraft((current) => ({ ...current, songIds }));

  const handleSave = async (event) => {
    event.preventDefault();
    setError(null);
    const label = draft.label.trim();
    const id = selectedSet?.id ?? makeSetId(label);
    if (!label || !id) {
      setError("Enter a setlist name containing at least one letter or number.");
      return;
    }
    if (!draft.songIds.length) {
      setError("Add at least one song to the setlist.");
      return;
    }
    if (sets.some((set) => set.id === id && set.id !== selectedSet?.id)) {
      setError(`A setlist with ID "${id}" already exists.`);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id,
        label,
        kind: draft.kind,
        songIds: draft.songIds,
        position: selectedSet?.position ?? sets.length,
      });
      setActiveId(id);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSet || !window.confirm(`Delete the "${selectedSet.label}" setlist?`)) return;
    setError(null);
    setSaving(true);
    try {
      await onDelete(selectedSet);
      const nextSet = sets.find((set) => set.id !== selectedSet.id) ?? null;
      setActiveId(nextSet?.id ?? null);
      setDraft(
        nextSet
          ? { label: nextSet.label, kind: nextSet.kind, songIds: [...nextSet.songIds] }
          : { label: "", kind: "performance", songIds: [] },
      );
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
          <h2 className="text-xl font-bold">Manage setlists</h2>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <label className="form-control min-w-56 grow">
            <span className="label-text mb-1">Setlist</span>
            <select
              className="select select-bordered"
              value={activeId ?? ""}
              onChange={(event) => selectSet(event.target.value || null)}
            >
              <option value="">New setlist</option>
              {sets.map((set) => (
                <option key={set.id} value={set.id}>{set.label}</option>
              ))}
            </select>
          </label>
          <button className="btn btn-outline self-end" type="button" onClick={startNewSet}>
            <Plus className="size-4" />
            New setlist
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="form-control">
              <span className="label-text mb-1">Name</span>
              <input
                className="input input-bordered"
                required
                value={draft.label}
                onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Category</span>
              <select
                className="select select-bordered"
                value={draft.kind}
                onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value }))}
              >
                <option value="performance">Performance set</option>
                <option value="catalog">Catalog grouping</option>
              </select>
            </label>
          </div>
          {!selectedSet && (
            <p className="text-xs text-base-content/60">
              New setlist ID: <code>{makeSetId(draft.label) || "enter a name"}</code>
            </p>
          )}

          <div>
            <p className="label-text mb-2">Song order</p>
            <div className="mb-2 flex gap-2">
              <select
                className="select select-bordered grow"
                value={songToAdd}
                onChange={(event) => setSongToAdd(event.target.value)}
              >
                <option value="">Choose a song to add</option>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>{song.title}</option>
                ))}
              </select>
              <button
                className="btn btn-outline"
                type="button"
                disabled={!songToAdd}
                onClick={() => {
                  updateSongIds([...draft.songIds, songToAdd]);
                  setSongToAdd("");
                }}
              >
                <Plus className="size-4" />
                Add
              </button>
            </div>
            <ol className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-base-300 p-2">
              {draft.songIds.map((id, index) => {
                const title = songs.find((song) => song.id === id)?.title ?? id;
                return (
                  <li key={`${id}-${index}`} className="flex items-center gap-2 rounded bg-base-200 px-2 py-1">
                    <span className="w-7 text-right text-xs text-base-content/50">{index + 1}.</span>
                    <span className="grow">{title}</span>
                    <button
                      className="btn btn-ghost btn-xs btn-square"
                      type="button"
                      aria-label={`Move ${title} up`}
                      disabled={index === 0}
                      onClick={() => {
                        const ids = [...draft.songIds];
                        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
                        updateSongIds(ids);
                      }}
                    ><ArrowUp className="size-4" /></button>
                    <button
                      className="btn btn-ghost btn-xs btn-square"
                      type="button"
                      aria-label={`Move ${title} down`}
                      disabled={index === draft.songIds.length - 1}
                      onClick={() => {
                        const ids = [...draft.songIds];
                        [ids[index + 1], ids[index]] = [ids[index], ids[index + 1]];
                        updateSongIds(ids);
                      }}
                    ><ArrowDown className="size-4" /></button>
                    <button
                      className="btn btn-ghost btn-xs btn-square text-error"
                      type="button"
                      aria-label={`Remove ${title}`}
                      onClick={() => updateSongIds(draft.songIds.filter((_, itemIndex) => itemIndex !== index))}
                    ><Trash2 className="size-4" /></button>
                  </li>
                );
              })}
              {draft.songIds.length === 0 && (
                <li className="p-3 text-center text-sm text-base-content/50">No songs in this setlist yet.</li>
              )}
            </ol>
          </div>

          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              {selectedSet && (
                <button className="btn btn-error btn-outline" type="button" disabled={saving} onClick={() => void handleDelete()}>
                  <Trash2 className="size-4" />
                  Delete setlist
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" type="button" disabled={saving} onClick={onClose}>Close</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm" /> : <Save className="size-4" />}
                Save setlist
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
