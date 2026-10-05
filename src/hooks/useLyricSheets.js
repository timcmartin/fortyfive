import { useCallback, useEffect, useRef, useState } from "react";

export function useLyricSheets() {
  const [lyricSheetIds, setLyricSheetIds] = useState([]);
  const [lyricSheets, setLyricSheets] = useState({});
  const [loadingSheets, setLoadingSheets] = useState({});
  const [sheetErrors, setSheetErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sheetRequests = useRef(new Map());

  useEffect(() => {
    const fetchIndex = async () => {
      try {
        const response = await fetch("/lyric-sheets/index.json");
        if (!response.ok) throw new Error("Failed to load lyric sheet index");
        const data = await response.json();
        if (!Array.isArray(data) || !data.every((id) => typeof id === "string")) {
          throw new Error("Lyric sheet index must be an array of song IDs");
        }
        setLyricSheetIds(data);
        setError(null);
      } catch (loadError) {
        setError(loadError.message);
        setLyricSheetIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIndex();
  }, []);

  const loadLyricSheet = useCallback((songId) => {
    if (!lyricSheetIds.includes(songId)) return Promise.resolve(null);

    const existingRequest = sheetRequests.current.get(songId);
    if (existingRequest) return existingRequest;

    setLoadingSheets((current) => ({ ...current, [songId]: true }));
    setSheetErrors((current) => {
      const next = { ...current };
      delete next[songId];
      return next;
    });

    const request = fetch(`/lyric-sheets/${songId}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load lyric sheet for ${songId}`);
        return response.json();
      })
      .then((data) => {
        if (!data || Array.isArray(data) || typeof data !== "object" || !Array.isArray(data.sections)) {
          throw new Error(`Lyric sheet for ${songId} must contain a sections array`);
        }
        setLyricSheets((current) => ({ ...current, [songId]: data }));
        return data;
      })
      .catch((loadError) => {
        setSheetErrors((current) => ({ ...current, [songId]: loadError.message }));
        sheetRequests.current.delete(songId);
        return null;
      })
      .finally(() => {
        setLoadingSheets((current) => ({ ...current, [songId]: false }));
      });

    sheetRequests.current.set(songId, request);
    return request;
  }, [lyricSheetIds]);

  return {
    lyricSheetIds,
    lyricSheets,
    loadingSheets,
    sheetErrors,
    loadLyricSheet,
    loading,
    error,
  };
}
