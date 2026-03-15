import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, Trophy, DollarSign, Film } from "lucide-react";
import OscarLayout from "@/components/OscarLayout";
import OrnateFrame from "@/components/OrnateFrame";

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const cls = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : "rank-3";
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 font-heading ${cls}`}>
        {rank}
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 font-heading" style={{
      background: "var(--bg-elevated)",
      border: "1px solid rgba(212,168,67,0.15)",
      color: "var(--text-secondary)",
    }}>
      {rank}
    </div>
  );
}

export default function Leaderboard() {
  const { loading, isAuthenticated } = useAuth();
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold-primary)" }} />
      </div>
    );
  }

  const board = leaderboard ?? [];
  const paidPlayers = board.filter((p) => p.isMonetary && p.hasPaid);

  return (
    <OscarLayout title="Live Leaderboard">
      <div className="container py-6 max-w-2xl mx-auto">
        {/* Status header */}
        <OrnateFrame className="mb-6">
          <div className="p-5 text-center" style={{ background: "linear-gradient(160deg, var(--bg-elevated), var(--bg-deep))" }}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-5 h-5 trophy-glow" style={{ color: "var(--gold-primary)" }} />
              <h2 className="text-base sm:text-lg font-bold text-gold-gradient font-display">
                98th Academy Awards Pool
              </h2>
              <Trophy className="w-5 h-5 trophy-glow" style={{ color: "var(--gold-primary)" }} />
            </div>

            <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>{announcedCount} / {totalCategories} awards announced</span>
              <span>·</span>
              <span>{board.length} players</span>
              {settings?.ceremonyStarted && (
                <>
                  <span>·</span>
                  <span className="font-semibold animate-pulse" style={{ color: "var(--gold-primary)" }}>LIVE</span>
                </>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 overflow-hidden" style={{ background: "var(--bg-deep)" }}>
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${(announcedCount / totalCategories) * 100}%`,
                  background: "linear-gradient(90deg, var(--gold-muted), var(--gold-primary))",
                }}
              />
            </div>
          </div>
        </OrnateFrame>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs px-1" style={{ color: "var(--text-secondary)" }}>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" style={{ color: "var(--gold-primary)" }} />
            <span style={{ color: "var(--gold-primary)" }}>Paid — eligible for prizes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Film className="w-3 h-3" style={{ color: "var(--silver-primary)" }} />
            <span style={{ color: "var(--silver-primary)" }}>Non-monetary / unpaid</span>
          </div>
        </div>

        {/* Leaderboard */}
        {board.length === 0 ? (
          <div className="oscar-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-heading">No players yet. Be the first to submit a ballot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {board.map((player, idx) => {
              const rank = idx + 1;
              const isPaid = player.isMonetary && player.hasPaid;
              const isMonetary = player.isMonetary;

              return (
                <div
                  key={player.userId}
                  className="oscar-card p-3 sm:p-4 flex items-center gap-3 transition-all"
                  style={{
                    borderColor: rank === 1 && isPaid ? "rgba(212,168,67,0.5)" : undefined,
                    boxShadow: rank === 1 && isPaid ? "0 0 20px rgba(212,168,67,0.1)" : undefined,
                  }}
                >
                  {/* Sparkle accent for rank 1 */}
                  {rank === 1 && isPaid && (
                    <span className="absolute -top-1 -left-1 text-xs" style={{ color: "var(--gold-sparkle)", opacity: 0.6 }}>✦</span>
                  )}

                  <RankBadge rank={rank} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-semibold text-sm sm:text-base truncate font-heading ${isPaid ? "player-paid" : "player-unpaid"}`}
                      >
                        {isPaid && <DollarSign className="w-3 h-3 inline mr-0.5" style={{ color: "var(--gold-primary)" }} />}
                        {player.displayName}
                      </span>

                      {rank <= 3 && isPaid && (
                        <span className="text-[10px] px-1.5 py-0.5 font-bold" style={{
                          background: rank === 1 ? "rgba(212,168,67,0.2)" : rank === 2 ? "rgba(192,192,192,0.2)" : "rgba(205,127,50,0.2)",
                          color: rank === 1 ? "var(--gold-light)" : rank === 2 ? "var(--silver-light)" : "#D4A76A",
                          border: `1px solid ${rank === 1 ? "rgba(212,168,67,0.4)" : rank === 2 ? "rgba(192,192,192,0.4)" : "rgba(205,127,50,0.4)"}`,
                        }}>
                          {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
                        </span>
                      )}

                      {!isMonetary && (
                        <span className="text-[10px] px-1.5 py-0.5" style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid rgba(212,168,67,0.1)",
                          color: "var(--text-secondary)",
                        }}>
                          Non-monetary
                        </span>
                      )}

                      {isMonetary && !isPaid && (
                        <span className="text-[10px] px-1.5 py-0.5" style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid rgba(185,28,28,0.3)",
                          color: "var(--destructive)",
                        }}>
                          Unpaid
                        </span>
                      )}
                    </div>

                    {player.slogan && (
                      <p className="text-xs mt-0.5 italic truncate font-body" style={{ color: "var(--text-secondary)" }}>
                        "{player.slogan}"
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg sm:text-xl font-black font-heading" style={{
                      color: isPaid ? "var(--gold-primary)" : "var(--silver-primary)",
                    }}>
                      {player.score}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
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
            <p className="text-xs mb-2 font-heading" style={{ color: "var(--text-secondary)" }}>
              Prize Pool Eligible Players ({paidPlayers.length})
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {paidPlayers.slice(0, 3).map((p, i) => (
                <div key={p.userId} className="flex items-center gap-1 text-xs">
                  <span>{i === 0 ? "1st" : i === 1 ? "2nd" : "3rd"}</span>
                  <span className="player-paid font-heading">{p.displayName}</span>
                  <span style={{ color: "var(--text-secondary)" }}>({p.score} pts)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OscarLayout>
  );
}
