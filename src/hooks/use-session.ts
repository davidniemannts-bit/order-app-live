import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const client = supabase;
      client.auth.getSession()
        .then(({ data, error }) => {
          if (error) throw error;
          if (!active) return;
          setSession(data.session);
          setLoading(false);
        })
        .catch((error: unknown) => {
          console.error("[Auth] Could not restore session:", error);
          if (!active) return;
          setSession(null);
          setLoading(false);
        });

      const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setLoading(false);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (error) {
      console.error("[Auth] Session initialization failed:", error);
      setSession(null);
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}
