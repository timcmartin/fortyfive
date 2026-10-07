import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SET_OPTIONS } from "@/lib/sets";

function validateSet(record) {
  if (
    !record ||
    typeof record.id !== "string" ||
    typeof record.label !== "string" ||
    !["performance", "catalog"].includes(record.kind) ||
    !Array.isArray(record.songIds) ||
    !record.songIds.every((id) => typeof id === "string")
  ) {
    throw new Error("Setlists must have an id, label, kind, and song ID array");
  }
  return record;
}

async function loadStaticSets() {
  const results = await Promise.all(
    SET_OPTIONS.map(async (option, position) => {
      const response = await fetch(`/sets/${option.value}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load set list ${option.value}`);
      }
      const items = await response.json();
      if (!Array.isArray(items) || !items.every((item) => item?.id)) {
        throw new Error(`Set list ${option.value} must contain song IDs`);
      }
      return {
        id: option.value,
        label: option.label,
        kind: option.kind,
        songIds: items.map((item) => item.id),
        position,
      };
    }),
  );
  return results;
}

function overlayDatabaseSets(staticSets, records) {
  const setsById = new Map(staticSets.map((set) => [set.id, set]));
  for (const record of records) {
    if (record.deleted) {
      setsById.delete(record.set_id);
      continue;
    }
    setsById.set(
      record.set_id,
      validateSet({
        id: record.set_id,
        label: record.name,
        kind: record.kind,
        songIds: record.song_ids,
        position: record.position,
      }),
    );
  }
  return [...setsById.values()].sort(
    (first, second) => first.position - second.position || first.label.localeCompare(second.label),
  );
}

export function useSets(userId) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [databaseError, setDatabaseError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadSets = async () => {
      try {
        const staticSets = await loadStaticSets();
        if (!supabase) {
          if (active) setSets(staticSets);
          return;
        }

        try {
          const { data, error: queryError } = await supabase
            .from("setlists")
            .select("set_id,name,kind,song_ids,position,deleted");
          if (queryError) throw queryError;
          if (active) setSets(overlayDatabaseSets(staticSets, data));
        } catch (databaseLoadError) {
          if (!active) return;
          setSets(staticSets);
          setDatabaseError(databaseLoadError.message);
        }
      } catch (loadError) {
        if (!active) return;
        setSets([]);
        setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSets();
    return () => {
      active = false;
    };
  }, []);

  const saveSet = useCallback(
    async (set) => {
      if (!supabase) throw new Error("Supabase is not configured");
      if (!userId) throw new Error("Sign in as an editor before saving");
      const validSet = validateSet(set);
      const { error: saveError } = await supabase.from("setlists").upsert(
        {
          set_id: validSet.id,
          name: validSet.label,
          kind: validSet.kind,
          song_ids: validSet.songIds,
          position: validSet.position,
          deleted: false,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: "set_id" },
      );
      if (saveError) throw saveError;
      setSets((current) => {
        const next = current.filter((item) => item.id !== validSet.id);
        next.push(validSet);
        return next.sort(
          (first, second) =>
            first.position - second.position ||
            first.label.localeCompare(second.label),
        );
      });
      setDatabaseError(null);
    },
    [userId],
  );

  const deleteSet = useCallback(
    async (set) => {
      if (!supabase) throw new Error("Supabase is not configured");
      if (!userId) throw new Error("Sign in as an editor before deleting");
      const { error: deleteError } = await supabase.from("setlists").upsert(
        {
          set_id: set.id,
          name: set.label,
          kind: set.kind,
          song_ids: set.songIds,
          position: set.position,
          deleted: true,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: "set_id" },
      );
      if (deleteError) throw deleteError;
      setSets((current) => current.filter((item) => item.id !== set.id));
      setDatabaseError(null);
    },
    [userId],
  );

  return { sets, loading, error, databaseError, saveSet, deleteSet };
}
