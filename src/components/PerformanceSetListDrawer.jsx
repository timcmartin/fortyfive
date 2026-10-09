import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function PerformanceSetListDrawer({
  open,
  songs,
  currentIndex,
  selectedSetLabel,
  lyricSheetIds,
  lyricSheets,
  onSelectSong,
  onClose,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none bg-transparent p-0 backdrop:bg-black/40"
      aria-label={`${selectedSetLabel} song list`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
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
            onClick={onClose}
            aria-label="Close set list"
          >
            <X className="size-4" />
          </button>
        </header>
        <nav
          className="flex-1 overflow-y-auto p-3"
          aria-label={`${selectedSetLabel} songs`}
        >
          {songs.map((song, index) => {
            const isCurrentSong = index === currentIndex;
            const hasSheet =
              lyricSheetIds.includes(song.id) || Boolean(lyricSheets[song.id]);
            const chartUrl = song.resources?.chartPdfUrl;
            const hasChart =
              (Array.isArray(chartUrl) && chartUrl.length > 0) ||
              typeof chartUrl === "string";

            return (
              <button
                key={song.id}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ${
                  isCurrentSong
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200"
                }`}
                onClick={() => onSelectSong(index)}
                aria-current={isCurrentSong ? "true" : undefined}
              >
                <span className="w-7 shrink-0 text-right text-sm opacity-70">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {song.title}
                  </span>
                  <span className="block truncate text-xs opacity-70">
                    {song.performanceNotes?.leadSinger ||
                      song.artistInfo?.performanceVersion}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {hasSheet && (
                    <span
                      className={`badge badge-sm ${isCurrentSong ? "badge-outline" : "badge-ghost"}`}
                    >
                      Lyrics
                    </span>
                  )}
                  {hasChart && (
                    <span
                      className={`badge badge-sm ${isCurrentSong ? "badge-outline" : "badge-ghost"}`}
                    >
                      Chart
                    </span>
                  )}
                  {!hasSheet && !hasChart && (
                    <span
                      className={`badge badge-sm ${isCurrentSong ? "badge-outline" : "badge-ghost"}`}
                    >
                      No sheet
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </dialog>
  );
}
