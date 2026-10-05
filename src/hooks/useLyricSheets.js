import { useEffect, useState } from "react";

export function useLyricSheets() {
  const [lyricSheets, setLyricSheets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLyricSheets = async () => {
      try {
        const response = await fetch("/lyric-sheets.json");
        if (!response.ok) throw new Error("Failed to load lyric sheets");
        const data = await response.json();
        if (!data || Array.isArray(data) || typeof data !== "object") {
          throw new Error("Lyric sheets must be a song ID map");
        }
        setLyricSheets(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setLyricSheets({});
      } finally {
        setLoading(false);
      }
    };

    fetchLyricSheets();
  }, []);

  return { lyricSheets, loading, error };
}
