import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Loader2, Trophy, Lock, Unlock, Users, Settings, CheckCircle,
  XCircle, DollarSign, Clock, Play, Square, ChevronDown, ChevronUp
} from "lucide-react";
import OscarLayout from "@/components/OscarLayout";

export default function AdminPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: categoriesData, isLoading: catsLoading } = trpc.nominees.getAll.useQuery();
  const { data: winners, isLoading: winnersLoading } = trpc.winners.getAll.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const { data: players, isLoading: playersLoading } = trpc.admin.getPlayers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
    refetchInterval: 15000,
  });

  const utils = trpc.useUtils();

  const [cutoffInput, setCutoffInput] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
    if (!loading && isAuthenticated && user?.role !== "admin") {
      navigate("/ballot");
    }
  }, [loading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (settings?.cutoffTime) {
      const d = new Date(settings.cutoffTime);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCutoffInput(local);
    }
  }, [settings]);

  const winnerMap = useMemo(() => {
    const map: Record<number, number> = {};
    winners?.forEach((w) => { map[w.categoryId] = w.nomineeId; });
    return map;
  }, [winners]);

  const setWinner = trpc.admin.setWinner.useMutation({
    onSuccess: () => {
      utils.winners.getAll.invalidate();
      utils.leaderboard.get.invalidate();
      toast.success("Winner set! 🏆");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeWinner = trpc.admin.removeWinner.useMutation({
    onSuccess: () => {
      utils.winners.getAll.invalidate();
      utils.leaderboard.get.invalidate();
      toast.success("Winner removed.");
    },
    onError: (e) => toast.error(e.message),
  });

  const setCutoff = trpc.admin.setCutoff.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Cutoff time saved!");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCeremony = trpc.admin.toggleCeremony.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success(settings?.ceremonyStarted ? "Ceremony stopped." : "Ceremony started! Ballots locked.");
    },
    onError: (e) => toast.error(e.message),
  });

  const markPaid = trpc.admin.markPaid.useMutation({
    onSuccess: () => {
      utils.admin.getPlayers.invalidate();
      utils.leaderboard.get.invalidate();
      toast.success("Payment status updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSetCutoff = () => {
    if (!cutoffInput) {
      setCutoff.mutate({ cutoffTime: null });
    } else {
      setCutoff.mutate({ cutoffTime: new Date(cutoffInput).toISOString() });
    }
  };

  const toggleCategory = (id: number) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading || catsLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.16_75)]" />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  const announcedCount = winners?.length ?? 0;

  return (
    <OscarLayout title="Pool Master Panel">
      <div className="container py-6 max-w-3xl mx-auto space-y-6">

        {/* ── Ceremony Controls ── */}
        <section className="oscar-card p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gold-gradient mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
            <Settings className="w-4 h-4" />
            Ceremony Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ceremony toggle */}
            <div className="p-3 rounded-lg" style={{ background: "oklch(0.10 0.01 60)", border: "1px solid oklch(0.25 0.04 75 / 0.4)" }}>
              <div className="text-xs text-[oklch(0.60_0.04_75)] mb-2 font-semibold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                Ceremony Status
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${settings?.ceremonyStarted ? "text-[oklch(0.78_0.16_75)]" : "text-[oklch(0.55_0.04_75)]"}`}>
                  {settings?.ceremonyStarted ? "🔴 LIVE — Ballots Locked" : "⏸ Not Started"}
                </span>
                <button
                  onClick={() => toggleCeremony.mutate({ started: !settings?.ceremonyStarted })}
                  disabled={toggleCeremony.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    settings?.ceremonyStarted
                      ? "bg-[oklch(0.55_0.22_25/0.2)] text-[oklch(0.65_0.22_25)] border border-[oklch(0.55_0.22_25/0.4)] hover:bg-[oklch(0.55_0.22_25/0.3)]"
                      : "btn-gold"
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {toggleCeremony.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : settings?.ceremonyStarted ? (
                    <><Square className="w-3.5 h-3.5" /> Stop</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> Start</>
                  )}
                </button>
              </div>
            </div>

            {/* Cutoff time */}
            <div className="p-3 rounded-lg" style={{ background: "oklch(0.10 0.01 60)", border: "1px solid oklch(0.25 0.04 75 / 0.4)" }}>
              <div className="text-xs text-[oklch(0.60_0.04_75)] mb-2 font-semibold uppercase tracking-wider flex items-center gap-1" style={{ fontFamily: "'Cinzel', serif" }}>
                <Clock className="w-3 h-3" /> Ballot Cutoff Time
              </div>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={cutoffInput}
                  onChange={(e) => setCutoffInput(e.target.value)}
                  className="flex-1 bg-[oklch(0.13_0.015_62)] border border-[oklch(0.25_0.04_75)] rounded-md px-2 py-1.5 text-xs text-[oklch(0.85_0.05_80)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] transition-colors"
                />
                <button
                  onClick={handleSetCutoff}
                  disabled={setCutoff.isPending}
                  className="btn-gold px-3 py-1.5 rounded-md text-xs"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {setCutoff.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Set"}
                </button>
              </div>
              {settings?.cutoffTime && (
                <p className="text-[10px] text-[oklch(0.50_0.03_75)] mt-1">
                  Current: {new Date(settings.cutoffTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-4 text-xs text-[oklch(0.55_0.04_75)]">
            <span>🏆 {announcedCount}/24 winners announced</span>
            <span>👥 {players?.length ?? 0} players</span>
            <span>💰 {players?.filter((p) => p.hasPaid).length ?? 0} paid</span>
          </div>
        </section>

        {/* ── Enter Winners ── */}
        <section className="oscar-card p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gold-gradient mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
            <Trophy className="w-4 h-4" />
            Enter Winners ({announcedCount}/24)
          </h2>

          <div className="space-y-2">
            {categoriesData?.map((cat) => {
              const currentWinner = winnerMap[cat.id];
              const isExpanded = expandedCats.has(cat.id);
              const winnerNom = cat.nominees.find((n) => n.id === currentWinner);

              return (
                <div key={cat.id} className="rounded-lg overflow-hidden" style={{
                  border: `1px solid ${currentWinner ? "oklch(0.78 0.16 75 / 0.4)" : "oklch(0.25 0.04 75 / 0.4)"}`,
                  background: currentWinner ? "oklch(0.12 0.02 65)" : "oklch(0.10 0.01 60)",
                }}>
                  {/* Category row */}
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {currentWinner ? (
                        <CheckCircle className="w-4 h-4 text-[oklch(0.78_0.16_75)] flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-[oklch(0.35_0.03_75)] flex-shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-[oklch(0.85_0.05_80)] truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                        {cat.name}
                      </span>
                      {winnerNom && (
                        <span className="text-xs text-[oklch(0.78_0.16_75)] truncate hidden sm:inline">
                          → {winnerNom.name}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[oklch(0.50_0.03_75)] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[oklch(0.50_0.03_75)] flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded nominees */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1.5 border-t border-[oklch(0.25_0.04_75/0.3)]">
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cat.nominees.map((nom) => {
                          const isWinner = currentWinner === nom.id;
                          return (
                            <button
                              key={nom.id}
                              onClick={() => {
                                if (isWinner) {
                                  removeWinner.mutate({ categoryId: cat.id });
                                } else {
                                  setWinner.mutate({ categoryId: cat.id, nomineeId: nom.id });
                                }
                              }}
                              disabled={setWinner.isPending || removeWinner.isPending}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-left transition-all ${
                                isWinner
                                  ? "bg-[oklch(0.78_0.16_75/0.2)] border-[oklch(0.78_0.16_75/0.6)] text-[oklch(0.88_0.14_80)]"
                                  : "bg-[oklch(0.13_0.015_62)] border-[oklch(0.25_0.04_75/0.4)] text-[oklch(0.75_0.04_80)] hover:border-[oklch(0.78_0.16_75/0.4)] hover:bg-[oklch(0.78_0.16_75/0.08)]"
                              }`}
                              style={{ border: "1px solid" }}
                            >
                              {isWinner ? (
                                <Trophy className="w-3.5 h-3.5 text-[oklch(0.78_0.16_75)] flex-shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-[oklch(0.35_0.03_75)] flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium truncate">{nom.name}</div>
                                {nom.detail && <div className="text-[oklch(0.45_0.03_75)] truncate">{nom.detail}</div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Players & Payment ── */}
        <section className="oscar-card p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gold-gradient mb-4 flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
            <Users className="w-4 h-4" />
            Players &amp; Payment Status
          </h2>

          {playersLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[oklch(0.78_0.16_75)]" />
            </div>
          ) : players?.length === 0 ? (
            <p className="text-sm text-[oklch(0.45_0.03_75)] text-center py-4">No players yet.</p>
          ) : (
            <div className="space-y-2">
              {players?.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{
                    background: "oklch(0.10 0.01 60)",
                    border: `1px solid ${player.hasPaid ? "oklch(0.78 0.16 75 / 0.3)" : "oklch(0.25 0.04 75 / 0.3)"}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-semibold truncate ${player.hasPaid ? "player-paid" : "player-unpaid"}`} style={{ fontFamily: "'Cinzel', serif" }}>
                        {player.hasPaid && <DollarSign className="w-3 h-3 inline mr-0.5" />}
                        {player.displayName}
                      </span>
                      {!player.isMonetary && (
                        <span className="text-[10px] text-[oklch(0.45_0.03_75)]">(non-monetary)</span>
                      )}
                    </div>
                    {player.payoutMethod && (
                      <p className="text-[10px] text-[oklch(0.50_0.03_75)] mt-0.5">{player.payoutMethod}</p>
                    )}
                  </div>

                  {player.isMonetary && (
                    <button
                      onClick={() => markPaid.mutate({ userId: player.userId, hasPaid: !player.hasPaid })}
                      disabled={markPaid.isPending}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        player.hasPaid
                          ? "bg-[oklch(0.78_0.16_75/0.15)] text-[oklch(0.78_0.16_75)] border border-[oklch(0.78_0.16_75/0.4)] hover:bg-[oklch(0.55_0.22_25/0.15)] hover:text-[oklch(0.65_0.22_25)] hover:border-[oklch(0.55_0.22_25/0.4)]"
                          : "bg-[oklch(0.55_0.22_25/0.1)] text-[oklch(0.55_0.22_25)] border border-[oklch(0.55_0.22_25/0.3)] hover:bg-[oklch(0.78_0.16_75/0.15)] hover:text-[oklch(0.78_0.16_75)] hover:border-[oklch(0.78_0.16_75/0.4)]"
                      }`}
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {markPaid.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : player.hasPaid ? (
                        <><CheckCircle className="w-3 h-3" /> Paid</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Unpaid</>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </OscarLayout>
  );
}

// Helper component used inside AdminPanel
function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
