import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function validateSong(song) {
  if (
    !song ||
    Array.isArray(song) ||
    typeof song !== "object" ||
    typeof song.id !== "string" ||
    !song.id ||
    typeof song.title !== "string" ||
    !song.title ||
    !song.artistInfo ||
    typeof song.artistInfo !== "object" ||
    Array.isArray(song.artistInfo) ||
    typeof song.artistInfo.performanceVersion !== "string" ||
    !song.musicalDetails ||
    typeof song.musicalDetails !== "object" ||
    Array.isArray(song.musicalDetails) ||
    !song.performanceNotes ||
    typeof song.performanceNotes !== "object" ||
    Array.isArray(song.performanceNotes) ||
    !song.resources ||
    typeof song.resources !== "object" ||
    Array.isArray(song.resources)
  ) {
    throw new Error(
      "Each song must include an id, title, artistInfo, musicalDetails, performanceNotes, and resources",
    );
  }
  return song;
}

async function loadStaticSongs() {
  const response = await fetch("/songs.json");
  if (!response.ok) throw new Error("Failed to load songs");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Song catalog must be an array");
  return data.map(validateSong);
}

function overlayDatabaseSongs(staticSongs, records) {
  const songsById = new Map(staticSongs.map((song) => [song.id, song]));
  for (const record of records) {
    if (record.deleted) {
      songsById.delete(record.song_id);
      continue;
    }
    songsById.set(record.song_id, validateSong(record.song));
  }
  return [...songsById.values()];
}

export function useSongs(userId) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadSongs = async () => {
      try {
        const staticSongs = await loadStaticSongs();
        if (!supabase) {
          if (active) setSongs(staticSongs);
          return;
        }

        try {
          const { data, error: queryError } = await supabase
            .from("songs")
            .select("song_id,song,deleted");
          if (queryError) throw queryError;
          if (active) setSongs(overlayDatabaseSongs(staticSongs, data));
        } catch (databaseLoadError) {
          if (!active) return;
          setSongs(staticSongs);
          setDatabaseError(databaseLoadError.message);
        }
      } catch (loadError) {
        if (!active) return;
        setSongs([]);
        setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSongs();
    return () => {
      active = false;
    };
  }, []);

  const saveSong = useCallback(
    async (song) => {
      if (!supabase) throw new Error("Supabase is not configured");
      if (!userId) throw new Error("Sign in as an editor before saving");
      const validSong = validateSong(song);
      const { error: saveError } = await supabase.from("songs").upsert(
        {
          song_id: validSong.id,
          song: validSong,
          deleted: false,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: "song_id" },
      );
      if (saveError) throw saveError;
      setSongs((current) => {
        const index = current.findIndex((item) => item.id === validSong.id);
        if (index < 0) return [...current, validSong];
        return current.map((item, itemIndex) =>
          itemIndex === index ? validSong : item,
        );
      });
      setDatabaseError(null);
    },
    [userId],
  );

  const deleteSong = useCallback(
    async (songId) => {
      if (!supabase) throw new Error("Supabase is not configured");
      if (!userId) throw new Error("Sign in as an editor before deleting");
      const { error: deleteError } = await supabase.from("songs").upsert(
        {
          song_id: songId,
          song: { id: songId, title: "Deleted song" },
          deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: "song_id" },
      );
      if (deleteError) throw deleteError;
      setSongs((current) => current.filter((song) => song.id !== songId));
      setDatabaseError(null);
    },
    [userId],
  );

  return { songs, loading, error, databaseError, saveSong, deleteSong };
}
