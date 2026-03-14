import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from './trpc';
import {
  getAllCategories,
  getAllNominees,
  getAllPlayers,
  getAllWinners,
  getBallotByUserId,
  getBallotPicks,
  getLeaderboard,
  getPoolSettings,
  getUserProfile,
  removeWinner,
  setUserPaid,
  setWinner,
  updatePoolSettings,
  upsertBallotPicks,
  upsertFan,
  upsertUserProfile,
} from './db';
import { supabaseAdmin } from './supabase';

export const appRouter = router({
  auth: router({
    me: publicProcedure.query((opts) => {
      if (!opts.ctx.user) return null;
      return {
        id: opts.ctx.user.id,
        email: opts.ctx.user.email,
        name: opts.ctx.user.name,
        role: opts.ctx.user.role,
      };
    }),

    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { full_name: input.name },
        });

        if (error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        return { success: true, userId: data.user.id };
      }),

    logout: publicProcedure.mutation(() => {
      return { success: true } as const;
    }),
  }),

  // ─── Profile ───────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getUserProfile(ctx.user.id);
      return profile ?? null;
    }),

    upsert: protectedProcedure
      .input(
        z.object({
          displayName: z.string().min(1).max(120),
          slogan: z.string().max(280).optional(),
          payoutMethod: z.string().max(120).optional(),
          isMonetary: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await upsertUserProfile({
          userId: ctx.user.id,
          email: ctx.user.email,
          ...input,
        });
        // Also add to fans table
        await upsertFan(ctx.user.email, input.displayName);
        return { success: true };
      }),
  }),

  // ─── Categories & Nominees ─────────────────────────────────────────────────
  nominees: router({
    getAll: publicProcedure.query(async () => {
      const cats = await getAllCategories();
      const noms = await getAllNominees();
      return cats.map((cat) => ({
        ...cat,
        nominees: noms.filter((n) => n.categoryId === cat.id),
      }));
    }),
  }),

  // ─── Ballot ────────────────────────────────────────────────────────────────
  ballot: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const ballot = await getBallotByUserId(ctx.user.id);
      if (!ballot) return { picks: [] };
      const picks = await getBallotPicks(ballot.id);
      return { ballot, picks };
    }),

    submit: protectedProcedure
      .input(
        z.object({
          picks: z.array(
            z.object({
              categoryId: z.number().int(),
              nomineeId: z.number().int(),
            }),
          ),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Check cutoff
        const settings = await getPoolSettings();
        if (settings?.ceremonyStarted) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Ballot submissions are closed. The ceremony has started!',
          });
        }
        if (settings?.cutoffTime && new Date() > new Date(settings.cutoffTime)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Ballot submission deadline has passed.',
          });
        }
        await upsertBallotPicks(ctx.user.id, input.picks);
        return { success: true };
      }),
  }),

  // ─── Winners ───────────────────────────────────────────────────────────────
  winners: router({
    getAll: publicProcedure.query(async () => {
      return getAllWinners();
    }),
  }),

  // ─── Leaderboard ───────────────────────────────────────────────────────────
  leaderboard: router({
    get: publicProcedure.query(async () => {
      const board = await getLeaderboard();
      return board.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.displayName ?? '').localeCompare(b.displayName ?? '');
      });
    }),
  }),

  // ─── Pool Settings ─────────────────────────────────────────────────────────
  settings: router({
    get: publicProcedure.query(async () => {
      return getPoolSettings();
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    setWinner: adminProcedure
      .input(
        z.object({
          categoryId: z.number().int(),
          nomineeId: z.number().int(),
        }),
      )
      .mutation(async ({ input }) => {
        await setWinner(input.categoryId, input.nomineeId);
        return { success: true };
      }),

    removeWinner: adminProcedure
      .input(z.object({ categoryId: z.number().int() }))
      .mutation(async ({ input }) => {
        await removeWinner(input.categoryId);
        return { success: true };
      }),

    setCutoff: adminProcedure
      .input(
        z.object({
          cutoffTime: z.string().nullable(),
        }),
      )
      .mutation(async ({ input }) => {
        await updatePoolSettings({
          cutoffTime: input.cutoffTime ? new Date(input.cutoffTime) : null,
        });
        return { success: true };
      }),

    toggleCeremony: adminProcedure
      .input(z.object({ started: z.boolean() }))
      .mutation(async ({ input }) => {
        await updatePoolSettings({ ceremonyStarted: input.started });
        return { success: true };
      }),

    markPaid: adminProcedure
      .input(z.object({ userId: z.string(), hasPaid: z.boolean() }))
      .mutation(async ({ input }) => {
        await setUserPaid(input.userId, input.hasPaid);
        return { success: true };
      }),

    getPlayers: adminProcedure.query(async () => {
      return getAllPlayers();
    }),

    updatePaymentInfo: adminProcedure
      .input(
        z.object({
          cashappHandle: z.string().optional(),
          zellePhone: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        await updatePoolSettings(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
