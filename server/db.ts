import { supabaseAdmin } from './supabase';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'dariondanjou@gmail.com';

// ─── User Profiles ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('oscar_user_profiles')
    .select('*')
    .eq('userId', userId)
    .single();

  if (error || !data) return undefined;
  return data;
}

export async function upsertUserProfile(data: {
  userId: string;
  email: string;
  displayName: string;
  slogan?: string;
  payoutMethod?: string;
  isMonetary: boolean;
}) {
  const role = data.email === ADMIN_EMAIL ? 'admin' : 'user';

  const { error } = await supabaseAdmin
    .from('oscar_user_profiles')
    .upsert(
      {
        userId: data.userId,
        displayName: data.displayName,
        slogan: data.slogan ?? null,
        payoutMethod: data.payoutMethod ?? null,
        isMonetary: data.isMonetary,
        profileComplete: true,
        role,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'userId' },
    );

  if (error) throw error;
}

export async function setUserPaid(userId: string, hasPaid: boolean) {
  const { error } = await supabaseAdmin
    .from('oscar_user_profiles')
    .update({ hasPaid })
    .eq('userId', userId);

  if (error) throw error;
}

// ─── Categories & Nominees ────────────────────────────────────────────────────

export async function getAllCategories() {
  const { data, error } = await supabaseAdmin
    .from('oscar_categories')
    .select('*')
    .order('sortOrder');

  if (error) throw error;
  return data ?? [];
}

export async function getAllNominees() {
  const { data, error } = await supabaseAdmin
    .from('oscar_nominees')
    .select('*')
    .order('categoryId')
    .order('sortOrder');

  if (error) throw error;
  return data ?? [];
}

// ─── Ballots ──────────────────────────────────────────────────────────────────

export async function getBallotByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('oscar_ballots')
    .select('*')
    .eq('userId', userId)
    .single();

  if (error || !data) return undefined;
  return data;
}

export async function getBallotPicks(ballotId: number) {
  const { data, error } = await supabaseAdmin
    .from('oscar_ballot_picks')
    .select('*')
    .eq('ballotId', ballotId);

  if (error) throw error;
  return data ?? [];
}

export async function upsertBallotPicks(
  userId: string,
  picks: Array<{ categoryId: number; nomineeId: number }>,
) {
  // Upsert ballot row
  const { data: ballot, error: ballotError } = await supabaseAdmin
    .from('oscar_ballots')
    .upsert(
      {
        userId,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'userId' },
    )
    .select('id')
    .single();

  if (ballotError || !ballot) throw ballotError || new Error('Failed to upsert ballot');

  // Upsert each pick using ballotId+categoryId unique constraint
  for (const pick of picks) {
    const { error } = await supabaseAdmin
      .from('oscar_ballot_picks')
      .upsert(
        {
          ballotId: ballot.id,
          categoryId: pick.categoryId,
          nomineeId: pick.nomineeId,
        },
        { onConflict: 'ballotId,categoryId' },
      );

    if (error) throw error;
  }
}

// ─── Winners ──────────────────────────────────────────────────────────────────

export async function getAllWinners() {
  const { data, error } = await supabaseAdmin
    .from('oscar_winners')
    .select('*');

  if (error) throw error;
  return data ?? [];
}

export async function setWinner(categoryId: number, nomineeId: number) {
  const { error } = await supabaseAdmin
    .from('oscar_winners')
    .upsert(
      {
        categoryId,
        nomineeId,
        announcedAt: new Date().toISOString(),
      },
      { onConflict: 'categoryId' },
    );

  if (error) throw error;
}

export async function removeWinner(categoryId: number) {
  const { error } = await supabaseAdmin
    .from('oscar_winners')
    .delete()
    .eq('categoryId', categoryId);

  if (error) throw error;
}

// ─── Pool Settings ────────────────────────────────────────────────────────────

export async function getPoolSettings() {
  const { data, error } = await supabaseAdmin
    .from('oscar_pool_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) return null;
  return data;
}

export async function updatePoolSettings(data: {
  cutoffTime?: Date | null;
  ceremonyStarted?: boolean;
  cashappHandle?: string;
  zellePhone?: string;
}) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (data.cutoffTime !== undefined) {
    updateData.cutoffTime = data.cutoffTime ? data.cutoffTime.toISOString() : null;
  }
  if (data.ceremonyStarted !== undefined) {
    updateData.ceremonyStarted = data.ceremonyStarted;
  }
  if (data.cashappHandle !== undefined) {
    updateData.cashappHandle = data.cashappHandle;
  }
  if (data.zellePhone !== undefined) {
    updateData.zellePhone = data.zellePhone;
  }

  const { error } = await supabaseAdmin
    .from('oscar_pool_settings')
    .update(updateData)
    .eq('id', 1);

  if (error) throw error;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard() {
  // Get all winners
  const { data: allWinners } = await supabaseAdmin
    .from('oscar_winners')
    .select('*');

  const winnerNomineeIds = new Set((allWinners ?? []).map((w) => w.nomineeId));

  // Get all profiles with profileComplete=true
  const { data: allProfiles } = await supabaseAdmin
    .from('oscar_user_profiles')
    .select('userId, displayName, slogan, hasPaid, isMonetary')
    .eq('profileComplete', true);

  if (!allProfiles || allProfiles.length === 0) return [];

  if (winnerNomineeIds.size === 0) {
    return allProfiles.map((p) => ({ ...p, score: 0, totalPicks: 0 }));
  }

  // Get all ballots and picks
  const { data: allBallots } = await supabaseAdmin
    .from('oscar_ballots')
    .select('id, userId');

  const { data: allPicks } = await supabaseAdmin
    .from('oscar_ballot_picks')
    .select('ballotId, nomineeId');

  const ballotMap = new Map((allBallots ?? []).map((b) => [b.userId, b.id]));

  return allProfiles.map((profile) => {
    const ballotId = ballotMap.get(profile.userId);
    if (!ballotId) return { ...profile, score: 0, totalPicks: 0 };

    const picks = (allPicks ?? []).filter((p) => p.ballotId === ballotId);
    const score = picks.filter((p) => winnerNomineeIds.has(p.nomineeId)).length;
    return { ...profile, score, totalPicks: picks.length };
  });
}

// ─── All Players (admin) ─────────────────────────────────────────────────────

export async function getAllPlayers() {
  const { data, error } = await supabaseAdmin
    .from('oscar_user_profiles')
    .select('userId, displayName, slogan, payoutMethod, hasPaid, isMonetary, profileComplete')
    .eq('profileComplete', true);

  if (error) throw error;
  return data ?? [];
}

// ─── Fans (upsert into existing fans table) ──────────────────────────────────

export async function upsertFan(email: string, displayName: string) {
  const parts = displayName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  const { error } = await supabaseAdmin
    .from('fans')
    .upsert(
      {
        email,
        first_name: firstName,
        last_name: lastName,
      },
      { onConflict: 'email' },
    );

  if (error) {
    // Non-critical: log but don't throw
    console.warn('[upsertFan] Failed to upsert fan:', error.message);
  }
}
