import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export function useEditorAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return undefined;

    let mounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError) throw sessionError;
        setUser(data.session?.user ?? null);
      })
      .catch((sessionError) => {
        if (mounted) setError(sessionError.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error("Supabase is not configured");
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  }, []);

  return {
    user,
    isEditor: user?.app_metadata?.role === "editor",
    loading,
    error,
    signIn,
    signOut,
    configured: supabaseConfigured,
  };
}
