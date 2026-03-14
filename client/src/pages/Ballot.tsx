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

  // picks: categoryId -> nomineeId
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

  // Load existing picks
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
      toast.success("Ballot saved! 🏆");
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
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.16_75)]" />
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
              <div className="flex items-center gap-2 text-sm text-[oklch(0.65_0.22_25)]">
                <Lock className="w-4 h-4" />
                <span className="font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                  {settings?.ceremonyStarted ? "Ceremony in Progress — Ballots Locked" : "Submission Deadline Passed"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[oklch(0.78_0.16_75)]">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                  Ballot Open
                </span>
                {settings?.cutoffTime && (
                  <span className="text-[oklch(0.55_0.04_75)] text-xs">
                    · Closes {new Date(settings.cutoffTime).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-36">
              <div className="flex justify-between text-xs text-[oklch(0.60_0.04_75)] mb-1">
                <span>{pickedCount} / {totalCategories} picked</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[oklch(0.18_0.02_62)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, oklch(0.62 0.14 70), oklch(0.82 0.16 78))",
                  }}
                />
              </div>
            </div>

            {!isClosed && (
              <button
                onClick={handleSave}
                disabled={saving || pickedCount === 0}
                className={`btn-gold px-4 py-2 rounded-md text-xs flex items-center gap-1.5 ${saved ? "opacity-80" : ""}`}
                style={{ fontFamily: "'Cinzel', serif" }}
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
                      ? "oklch(0.78 0.16 75 / 0.6)"
                      : "oklch(0.25 0.04 75)"
                    : "oklch(0.25 0.04 75 / 0.5)",
                }}
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gold-gradient" style={{ fontFamily: "'Cinzel', serif" }}>
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {winner && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                        background: "oklch(0.78 0.16 75 / 0.15)",
                        color: "oklch(0.78 0.16 75)",
                        border: "1px solid oklch(0.78 0.16 75 / 0.3)",
                        fontFamily: "'Cinzel', serif",
                      }}>
                        🏆 Winner Announced
                      </span>
                    )}
                    {isCorrect && (
                      <span className="text-xs text-[oklch(0.78_0.16_75)] font-bold">✓ Correct!</span>
                    )}
                    {isWrong && (
                      <span className="text-xs text-[oklch(0.55_0.22_25)]">✗ Missed</span>
                    )}
                  </div>
                </div>

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
                        className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-all text-sm ${
                          isClosed ? "cursor-default" : "cursor-pointer"
                        } ${
                          isWinner
                            ? "border-[oklch(0.78_0.16_75/0.8)] bg-[oklch(0.78_0.16_75/0.12)]"
                            : isPicked
                            ? "border-[oklch(0.78_0.16_75/0.5)] bg-[oklch(0.78_0.16_75/0.08)]"
                            : "border-[oklch(0.25_0.04_75/0.4)] bg-[oklch(0.10_0.01_60)] hover:border-[oklch(0.78_0.16_75/0.3)] hover:bg-[oklch(0.78_0.16_75/0.05)]"
                        }`}
                        style={{ border: "1px solid" }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isWinner ? (
                            <span className="text-[oklch(0.78_0.16_75)] text-base">🏆</span>
                          ) : isPicked ? (
                            <CheckCircle className="w-4 h-4 text-[oklch(0.78_0.16_75)]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[oklch(0.35_0.03_75)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`font-medium leading-tight ${
                            isWinner ? "text-[oklch(0.88_0.14_80)]" : isPicked ? "text-[oklch(0.82_0.16_78)]" : "text-[oklch(0.85_0.05_80)]"
                          }`}>
                            {nom.name}
                          </div>
                          {nom.detail && (
                            <div className="text-xs text-[oklch(0.50_0.03_75)] mt-0.5 truncate">
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
              className="btn-gold w-full py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg"
              style={{ fontFamily: "'Cinzel', serif" }}
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
