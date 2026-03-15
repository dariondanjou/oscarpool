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
      toast.success("Winner set!");
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold-primary)" }} />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  const announcedCount = winners?.length ?? 0;

  return (
    <OscarLayout title="Pool Master Panel">
      <div className="container py-6 max-w-3xl mx-auto space-y-6">

        {/* Ceremony Controls */}
        <section className="oscar-card p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gold-gradient mb-4 flex items-center gap-2 font-heading">
            <Settings className="w-4 h-4" />
            Ceremony Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ceremony toggle */}
            <div className="p-3" style={{ background: "var(--bg-deep)", border: "1px solid rgba(212,168,67,0.15)" }}>
              <div className="text-xs mb-2 font-semibold uppercase tracking-wider font-heading" style={{ color: "var(--text-secondary)" }}>
                Ceremony Status
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{
                  color: settings?.ceremonyStarted ? "var(--gold-primary)" : "var(--text-secondary)",
                }}>
                  {settings?.ceremonyStarted ? "LIVE — Ballots Locked" : "Not Started"}
                </span>
                <button
                  onClick={() => toggleCeremony.mutate({ started: !settings?.ceremonyStarted })}
                  disabled={toggleCeremony.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                    settings?.ceremonyStarted
                      ? ""
                      : "btn-gold"
                  }`}
                  style={settings?.ceremonyStarted ? {
                    background: "rgba(185,28,28,0.2)",
                    color: "var(--destructive)",
                    border: "1px solid rgba(185,28,28,0.4)",
                  } : undefined}
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
            <div className="p-3" style={{ background: "var(--bg-deep)", border: "1px solid rgba(212,168,67,0.15)" }}>
              <div className="text-xs mb-2 font-semibold uppercase tracking-wider flex items-center gap-1 font-heading" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3 h-3" /> Ballot Cutoff Time
              </div>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={cutoffInput}
                  onChange={(e) => setCutoffInput(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs focus:outline-none transition-colors font-body"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid rgba(212,168,67,0.2)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={handleSetCutoff}
                  disabled={setCutoff.isPending}
                  className="btn-gold px-3 py-1.5 text-xs"
                >
                  {setCutoff.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Set"}
                </button>
              </div>
              {settings?.cutoffTime && (
                <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
                  Current: {new Date(settings.cutoffTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>{announcedCount}/24 winners</span>
            <span>{players?.length ?? 0} players</span>
            <span>{players?.filter((p) => p.hasPaid).length ?? 0} paid</span>
          </div>
        </section>

        {/* Enter Winners */}
        <section className="oscar-card p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gold-gradient mb-4 flex items-center gap-2 font-heading">
            <Trophy className="w-4 h-4" />
            Enter Winners ({announcedCount}/24)
          </h2>

          <div className="space-y-2">
            {categoriesData?.map((cat) => {
              const currentWinner = winnerMap[cat.id];
              const isExpanded = expandedCats.has(cat.id);
              const winnerNom = cat.nominees.find((n) => n.id === currentWinner);

              return (
                <div key={cat.id} className="overflow-hidden" style={{
                  border: `1px solid ${currentWinner ? "rgba(212,168,67,0.4)" : "rgba(212,168,67,0.1)"}`,
                  background: currentWinner ? "var(--bg-surface)" : "var(--bg-deep)",
                }}>
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {currentWinner ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold-primary)" }} />
                      ) : (
                        <Circle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                      )}
                      <span className="text-xs font-semibold truncate font-heading" style={{ color: "var(--text-primary)" }}>
                        {cat.name}
                      </span>
                      {winnerNom && (
                        <span className="text-xs truncate hidden sm:inline" style={{ color: "var(--gold-primary)" }}>
                          → {winnerNom.name}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: "1px solid rgba(212,168,67,0.1)" }}>
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
                              className="flex items-center gap-2 px-2.5 py-2 text-xs text-left transition-all"
                              style={{
                                border: "1px solid",
                                borderColor: isWinner ? "rgba(212,168,67,0.6)" : "rgba(212,168,67,0.1)",
                                background: isWinner ? "rgba(212,168,67,0.15)" : "var(--bg-surface)",
                                color: isWinner ? "var(--gold-light)" : "var(--text-primary)",
                              }}
                            >
                              {isWinner ? (
                                <Trophy className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--gold-primary)" }} />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: "1px solid var(--text-secondary)" }} />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium truncate">{nom.name}</div>
                                {nom.detail && <div className="truncate" style={{ color: "var(--text-secondary)" }}>{nom.detail}</div>}
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

        {/* Players & Payment */}
        <section className="oscar-card p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gold-gradient mb-4 flex items-center gap-2 font-heading">
            <Users className="w-4 h-4" />
            Players &amp; Payment Status
          </h2>

          {playersLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--gold-primary)" }} />
            </div>
          ) : players?.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>No players yet.</p>
          ) : (
            <div className="space-y-2">
              {players?.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: "var(--bg-deep)",
                    border: `1px solid ${player.hasPaid ? "rgba(212,168,67,0.3)" : "rgba(212,168,67,0.1)"}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-semibold truncate font-heading ${player.hasPaid ? "player-paid" : "player-unpaid"}`}>
                        {player.hasPaid && <DollarSign className="w-3 h-3 inline mr-0.5" />}
                        {player.displayName}
                      </span>
                      {!player.isMonetary && (
                        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>(non-monetary)</span>
                      )}
                    </div>
                    {player.payoutMethod && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{player.payoutMethod}</p>
                    )}
                  </div>

                  {player.isMonetary && (
                    <button
                      onClick={() => markPaid.mutate({ userId: player.userId, hasPaid: !player.hasPaid })}
                      disabled={markPaid.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all font-heading"
                      style={{
                        background: player.hasPaid ? "rgba(212,168,67,0.15)" : "rgba(185,28,28,0.1)",
                        color: player.hasPaid ? "var(--gold-primary)" : "var(--destructive)",
                        border: `1px solid ${player.hasPaid ? "rgba(212,168,67,0.4)" : "rgba(185,28,28,0.3)"}`,
                      }}
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

function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={arguments[0]?.style}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
