import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const utils = trpc.useUtils();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setSessionLoading(false);
      if (!session) {
        utils.auth.me.setData(undefined, null);
      } else {
        utils.auth.me.invalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [utils]);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!session,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    utils.auth.me.setData(undefined, null);
  }, [utils]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: sessionLoading || (!!session && meQuery.isLoading),
    error: meQuery.error ?? null,
    isAuthenticated: !!session && !!meQuery.data,
  }), [session, sessionLoading, meQuery.data, meQuery.error, meQuery.isLoading]);

  return {
    ...state,
    session,
    login,
    logout,
    refresh: () => meQuery.refetch(),
  };
}
