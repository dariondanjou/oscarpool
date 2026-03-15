import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Trophy, Lock, CheckCircle, Circle, Save } from "lucide-react";
import OscarLayout from "@/components/OscarLayout";

export default function Ballot() {
  const { loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: categoriesData, isLoading: catsLoading } = trpc.nominees.getAll.useQuery();
  const { data: ballotData, isLoading: ballotLoading } = trpc.ballot.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: settings } = trpc.settings.get.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: winners } = trpc.winners.getAll.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const utils = trpc.useUtils();

  const [picks, setPicks] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!profileLoading && isAuthenticated && profile && !profile.profileComplete) {
      navigate("/profile");
    }
  }, [profile, profileLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (ballotData?.picks) {
      const map: Record<number, number> = {};
      ballotData.picks.forEach((p) => {
        map[p.categoryId] = p.nomineeId;
      });
      setPicks(map);
    }
  }, [ballotData]);

  const isClosed = useMemo(() => {
    if (settings?.ceremonyStarted) return true;
    if (settings?.cutoffTime && new Date() > new Date(settings.cutoffTime)) return true;
    return false;
  }, [settings]);

  const winnerMap = useMemo(() => {
    const map: Record<number, number> = {};
    winners?.forEach((w) => { map[w.categoryId] = w.nomineeId; });
    return map;
  }, [winners]);

  const submitBallot = trpc.ballot.submit.useMutation({
    onSuccess: () => {
      utils.ballot.get.invalidate();
      toast.success("Ballot saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePick = (categoryId: number, nomineeId: number) => {
    if (isClosed) return;
    setPicks((prev) => ({ ...prev, [categoryId]: nomineeId }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (isClosed) return;
    setSaving(true);
    const pickArray = Object.entries(picks).map(([catId, nomId]) => ({
      categoryId: Number(catId),
      nomineeId: Number(nomId),
    }));
    await submitBallot.mutateAsync({ picks: pickArray });
    setSaving(false);
  };

  const totalCategories = categoriesData?.length ?? 0;
  const pickedCount = Object.keys(picks).length;
  const progress = totalCategories > 0 ? Math.round((pickedCount / totalCategories) * 100) : 0;

  if (loading || profileLoading || catsLoading || ballotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold-primary)" }} />
      </div>
    );
  }

  return (
    <OscarLayout title="My Ballot">
      <div className="container py-6 max-w-3xl mx-auto">
        {/* Status bar */}
        <div className="oscar-card p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isClosed ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--destructive)" }}>
                <Lock className="w-4 h-4" />
                <span className="font-semibold font-heading">
                  {settings?.ceremonyStarted ? "Ceremony in Progress — Ballots Locked" : "Submission Deadline Passed"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--gold-primary)" }}>
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold font-heading">
                  Ballot Open
                </span>
                {settings?.cutoffTime && (
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    · Closes {new Date(settings.cutoffTime).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-36">
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                <span>{pickedCount} / {totalCategories} picked</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, var(--gold-muted), var(--gold-primary))",
                  }}
                />
              </div>
            </div>

            {!isClosed && (
              <button
                onClick={handleSave}
                disabled={saving || pickedCount === 0}
                className={`btn-gold px-4 py-2 text-xs flex items-center gap-1.5 ${saved ? "opacity-80" : ""}`}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Ballot"}
              </button>
            )}
          </div>
        </div>

        {/* Film strip divider */}
        <div className="film-strip mb-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="film-strip-frame" />
          ))}
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {categoriesData?.map((cat) => {
            const myPick = picks[cat.id];
            const winner = winnerMap[cat.id];
            const isCorrect = myPick && winner && myPick === winner;
            const isWrong = myPick && winner && myPick !== winner;

            return (
              <div
                key={cat.id}
                className="oscar-card p-4 sm:p-5"
                style={{
                  borderColor: winner
                    ? isCorrect
                      ? "rgba(212,168,67,0.6)"
                      : "rgba(212,168,67,0.15)"
                    : undefined,
                }}
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gold-gradient font-heading">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {winner && (
                      <span className="text-xs px-2 py-0.5 font-semibold font-heading" style={{
                        background: "rgba(212,168,67,0.15)",
                        color: "var(--gold-primary)",
                        border: "1px solid rgba(212,168,67,0.3)",
                      }}>
                        Winner Announced
                      </span>
                    )}
                    {isCorrect && (
                      <span className="text-xs font-bold" style={{ color: "var(--gold-primary)" }}>Correct!</span>
                    )}
                    {isWrong && (
                      <span className="text-xs" style={{ color: "var(--destructive)" }}>Missed</span>
                    )}
                  </div>
                </div>

                {/* Gold underline under category name */}
                <div className="gold-divider mb-3" style={{ margin: "0 0 0.75rem 0" }} />

                {/* Nominees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.nominees.map((nom) => {
                    const isPicked = myPick === nom.id;
                    const isWinner = winner === nom.id;

                    return (
                      <button
                        key={nom.id}
                        onClick={() => handlePick(cat.id, nom.id)}
                        disabled={isClosed}
                        className={`flex items-start gap-2.5 p-2.5 text-left transition-all text-sm ${
                          isClosed ? "cursor-default" : "cursor-pointer"
                        }`}
                        style={{
                          border: "1px solid",
                          borderColor: isWinner
                            ? "rgba(212,168,67,0.8)"
                            : isPicked
                            ? "rgba(212,168,67,0.5)"
                            : "rgba(212,168,67,0.1)",
                          background: isWinner
                            ? "rgba(212,168,67,0.12)"
                            : isPicked
                            ? "rgba(212,168,67,0.08)"
                            : "var(--bg-deep)",
                          boxShadow: isPicked && !isWinner ? "0 0 12px rgba(212,168,67,0.1)" : undefined,
                        }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isWinner ? (
                            <Trophy className="w-4 h-4" style={{ color: "var(--gold-primary)" }} />
                          ) : isPicked ? (
                            <CheckCircle className="w-4 h-4" style={{ color: "var(--gold-primary)" }} />
                          ) : (
                            <Circle className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium leading-tight font-body" style={{
                            color: isWinner ? "var(--gold-light)" : isPicked ? "var(--gold-primary)" : "var(--text-primary)",
                          }}>
                            {nom.name}
                          </div>
                          {nom.detail && (
                            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                              {nom.detail}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom save */}
        {!isClosed && pickedCount > 0 && (
          <div className="mt-6 sticky bottom-16 sm:bottom-12">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              {saving ? "Saving..." : `Save Ballot (${pickedCount}/${totalCategories} categories)`}
            </button>
          </div>
        )}
      </div>
    </OscarLayout>
  );
}
