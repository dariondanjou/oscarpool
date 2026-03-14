import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Trophy, DollarSign, Film, Crown } from "lucide-react";
import OscarLayout from "@/components/OscarLayout";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black rank-1 flex-shrink-0" style={{ fontFamily: "'Cinzel', serif" }}>
      1
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black rank-2 flex-shrink-0" style={{ fontFamily: "'Cinzel', serif" }}>
      2
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black rank-3 flex-shrink-0" style={{ fontFamily: "'Cinzel', serif" }}>
      3
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-[oklch(0.55_0.04_75)]" style={{
      background: "oklch(0.15 0.01 60)",
      border: "1px solid oklch(0.25 0.04 75 / 0.4)",
      fontFamily: "'Cinzel', serif",
    }}>
      {rank}
    </div>
  );
}

export default function Leaderboard() {
  const { loading, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { data: leaderboard, isLoading } = trpc.leaderboard.get.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: winners } = trpc.winners.getAll.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const { data: settings } = trpc.settings.get.useQuery();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [loading, isAuthenticated]);

  const announcedCount = winners?.length ?? 0;
  const totalCategories = 24;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.16_75)]" />
      </div>
    );
  }

  const board = leaderboard ?? [];
  const paidPlayers = board.filter((p) => p.isMonetary && p.hasPaid);
  const allEligible = board.filter((p) => p.isMonetary);

  return (
    <OscarLayout title="Live Leaderboard">
      <div className="container py-6 max-w-2xl mx-auto">
        {/* Status header */}
        <div className="oscar-card p-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-[oklch(0.78_0.16_75)] trophy-glow" />
            <h2 className="text-base sm:text-lg font-bold text-gold-gradient" style={{ fontFamily: "'Cinzel', serif" }}>
              98th Academy Awards Pool
            </h2>
            <Trophy className="w-5 h-5 text-[oklch(0.78_0.16_75)] trophy-glow" />
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-[oklch(0.60_0.04_75)]">
            <span>{announcedCount} / {totalCategories} awards announced</span>
            <span>·</span>
            <span>{board.length} players</span>
            {settings?.ceremonyStarted && (
              <>
                <span>·</span>
                <span className="text-[oklch(0.78_0.16_75)] font-semibold animate-pulse">🔴 LIVE</span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-[oklch(0.18_0.02_62)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(announcedCount / totalCategories) * 100}%`,
                background: "linear-gradient(90deg, oklch(0.62 0.14 70), oklch(0.82 0.16 78))",
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-[oklch(0.55_0.04_75)] px-1">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-[oklch(0.78_0.16_75)]" />
            <span className="text-[oklch(0.78_0.16_75)]">Paid — eligible for prizes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Film className="w-3 h-3 text-[oklch(0.55_0.01_240)]" />
            <span className="text-[oklch(0.55_0.01_240)]">Non-monetary / unpaid</span>
          </div>
        </div>

        {/* Leaderboard */}
        {board.length === 0 ? (
          <div className="oscar-card p-8 text-center text-[oklch(0.50_0.03_75)]">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p style={{ fontFamily: "'Cinzel', serif" }}>No players yet. Be the first to submit a ballot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {board.map((player, idx) => {
              const rank = idx + 1;
              const isPaid = player.isMonetary && player.hasPaid;
              const isMonetary = player.isMonetary;
              const isMe = false; // Could compare by userId if exposed

              return (
                <div
                  key={player.userId}
                  className={`oscar-card p-3 sm:p-4 flex items-center gap-3 transition-all ${
                    rank <= 3 && isPaid ? "border-[oklch(0.78_0.16_75/0.4)]" : ""
                  }`}
                  style={{
                    borderColor: rank === 1 && isPaid ? "oklch(0.78 0.16 75 / 0.5)" : undefined,
                    boxShadow: rank === 1 && isPaid ? "0 0 20px oklch(0.78 0.16 75 / 0.1)" : undefined,
                  }}
                >
                  <RankBadge rank={rank} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Name with paid indicator */}
                      <span
                        className={`font-semibold text-sm sm:text-base truncate ${
                          isPaid ? "player-paid" : "player-unpaid"
                        }`}
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {isPaid && <DollarSign className="w-3 h-3 inline mr-0.5 text-[oklch(0.78_0.16_75)]" />}
                        {player.displayName}
                      </span>

                      {/* Badges */}
                      {rank <= 3 && isPaid && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{
                          background: rank === 1 ? "oklch(0.78 0.16 75 / 0.2)" : rank === 2 ? "oklch(0.60 0.01 240 / 0.2)" : "oklch(0.50 0.08 50 / 0.2)",
                          color: rank === 1 ? "oklch(0.88 0.14 80)" : rank === 2 ? "oklch(0.72 0.01 240)" : "oklch(0.65 0.10 55)",
                          border: `1px solid ${rank === 1 ? "oklch(0.78 0.16 75 / 0.4)" : rank === 2 ? "oklch(0.60 0.01 240 / 0.4)" : "oklch(0.50 0.08 50 / 0.4)"}`,
                        }}>
                          {rank === 1 ? "🥇 1st" : rank === 2 ? "🥈 2nd" : "🥉 3rd"}
                        </span>
                      )}

                      {!isMonetary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-[oklch(0.45_0.03_75)]" style={{
                          background: "oklch(0.15 0.01 60)",
                          border: "1px solid oklch(0.25 0.04 75 / 0.3)",
                        }}>
                          Non-monetary
                        </span>
                      )}

                      {isMonetary && !isPaid && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full text-[oklch(0.55_0.22_25)]" style={{
                          background: "oklch(0.15 0.01 60)",
                          border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                        }}>
                          Unpaid
                        </span>
                      )}
                    </div>

                    {player.slogan && (
                      <p className="text-xs text-[oklch(0.50_0.03_75)] mt-0.5 italic truncate">
                        "{player.slogan}"
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className={`text-lg sm:text-xl font-black ${isPaid ? "text-[oklch(0.78_0.16_75)]" : "text-[oklch(0.55_0.01_240)]"}`} style={{ fontFamily: "'Cinzel', serif" }}>
                      {player.score}
                    </div>
                    <div className="text-[10px] text-[oklch(0.45_0.03_75)]">
                      {player.totalPicks > 0 ? `/ ${player.totalPicks} picks` : "no ballot"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Prize info */}
        {paidPlayers.length > 0 && (
          <div className="mt-6 oscar-card p-4 text-center">
            <div className="gold-divider mb-3" />
            <p className="text-xs text-[oklch(0.60_0.04_75)] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Prize Pool Eligible Players ({paidPlayers.length})
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {paidPlayers.slice(0, 3).map((p, i) => (
                <div key={p.userId} className="flex items-center gap-1 text-xs">
                  <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <span className="player-paid">{p.displayName}</span>
                  <span className="text-[oklch(0.45_0.03_75)]">({p.score} pts)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OscarLayout>
  );
}
