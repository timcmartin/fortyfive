import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

function validateSheet(data, songId) {
  if (
    !data ||
    Array.isArray(data) ||
    typeof data !== "object" ||
    !Array.isArray(data.sections)
  ) {
    throw new Error(`Lyric sheet for ${songId} must contain a sections array`);
  }
  return data;
}

async function loadStaticSheet(songId) {
  const response = await fetch(`/lyric-sheets/${songId}.json`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load lyric sheet for ${songId}`);
  }
  if (response.headers.get("content-type")?.includes("text/html")) return null;
  return validateSheet(await response.json(), songId);
}

export function useLyricSheets() {
  const [lyricSheetIds, setLyricSheetIds] = useState([]);
  const [lyricSheetIndexLoaded, setLyricSheetIndexLoaded] = useState(false);
  const [indexError, setIndexError] = useState(null);
  const [lyricSheets, setLyricSheets] = useState({});
  const [loadingSheets, setLoadingSheets] = useState({});
  const [sheetErrors, setSheetErrors] = useState({});
  const sheetRequests = useRef(new Map());

  useEffect(() => {
    let mounted = true;
    const loadAvailableIds = async () => {
      const ids = new Set();
      const errors = [];

      try {
        const response = await fetch("/lyric-sheets/index.json");
        if (response.ok) {
          const legacyIds = await response.json();
          if (
            !Array.isArray(legacyIds) ||
            !legacyIds.every((id) => typeof id === "string")
          ) {
            throw new Error("Lyric sheet index must be an array of song IDs");
          }
          legacyIds.forEach((id) => ids.add(id));
        } else if (response.status !== 404) {
          throw new Error("Failed to load lyric sheet index");
        }
      } catch (error) {
        errors.push(error.message);
      }

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("lyric_sheets")
            .select("song_id");
          if (error) throw error;
          data.forEach(({ song_id: songId }) => ids.add(songId));
        } catch (error) {
          errors.push(error.message);
        }
      }

      if (!mounted) return;
      setLyricSheetIds([...ids]);
      setIndexError(errors.length > 0 ? errors.join("; ") : null);
      setLyricSheetIndexLoaded(true);
    };

    void loadAvailableIds();
    return () => {
      mounted = false;
    };
  }, []);

  const loadLyricSheet = useCallback((songId) => {
    const existingRequest = sheetRequests.current.get(songId);
    if (existingRequest) return existingRequest;

    setLoadingSheets((current) => ({ ...current, [songId]: true }));
    setSheetErrors((current) => {
      const next = { ...current };
      delete next[songId];
      return next;
    });

    const request = (async () => {
      let sheet = null;
      if (supabase) {
        const { data, error } = await supabase
          .from("lyric_sheets")
          .select("sections")
          .eq("song_id", songId)
          .maybeSingle();
        if (error) throw error;
        if (data) sheet = { sections: data.sections };
      }

      if (!sheet) sheet = await loadStaticSheet(songId);
      if (sheet) {
        validateSheet(sheet, songId);
        setLyricSheets((current) => ({ ...current, [songId]: sheet }));
      }
      return sheet;
    })()
      .catch((loadError) => {
        setSheetErrors((current) => ({
          ...current,
          [songId]: loadError.message,
        }));
        sheetRequests.current.delete(songId);
        return null;
      })
      .finally(() => {
        setLoadingSheets((current) => ({ ...current, [songId]: false }));
      });

    sheetRequests.current.set(songId, request);
    return request;
  }, []);

  const saveLyricSheet = useCallback(async (songId, sections, userId) => {
    if (!supabase) throw new Error("Supabase is not configured");
    if (!Array.isArray(sections)) {
      throw new Error("Lyric sheet must contain a sections array");
    }

    const sheet = { sections };
    const { error } = await supabase.from("lyric_sheets").upsert(
      {
        song_id: songId,
        sections,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "song_id" },
    );
    if (error) throw error;

    setLyricSheets((current) => ({ ...current, [songId]: sheet }));
    setLyricSheetIds((current) =>
      current.includes(songId) ? current : [...current, songId],
    );
    setSheetErrors((current) => {
      const next = { ...current };
      delete next[songId];
      return next;
    });
    sheetRequests.current.set(songId, Promise.resolve(sheet));
    return sheet;
  }, []);

  return {
    lyricSheetIds,
    lyricSheetIndexLoaded,
    indexError,
    lyricSheets,
    loadingSheets,
    sheetErrors,
    loadLyricSheet,
    saveLyricSheet,
  };
}
