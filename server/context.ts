import { supabaseAdmin } from './supabase';
import type { AppUser, TrpcContext } from './trpc';

export async function createContext(req: Request): Promise<TrpcContext> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return { user: null };

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return { user: null };

    // Get role from oscar_user_profiles
    const { data: profile } = await supabaseAdmin
      .from('oscar_user_profiles')
      .select('role')
      .eq('userId', user.id)
      .single();

    const appUser: AppUser = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.email!,
      role: (profile?.role as 'user' | 'admin') || 'user',
    };

    return { user: appUser };
  } catch {
    return { user: null };
  }
}
