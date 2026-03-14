import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, User, MessageSquare, DollarSign, Trophy } from "lucide-react";
import OscarLayout from "@/components/OscarLayout";

// Payout options — each has a placeholder for the user's own handle/number
const PAYOUT_OPTIONS = [
  {
    value: "cashapp",
    label: "CashApp",
    placeholder: "Your CashApp $handle (e.g. $YourName)",
    prefix: "CashApp: ",
  },
  {
    value: "zelle",
    label: "Zelle",
    placeholder: "Your Zelle phone or email",
    prefix: "Zelle: ",
  },
  {
    value: "applepay",
    label: "Apple Pay",
    placeholder: "Your Apple Pay phone number",
    prefix: "Apple Pay: ",
  },
  {
    value: "other",
    label: "Other",
    placeholder: "Describe your preferred payout method",
    prefix: "",
  },
];

function parseStoredPayout(stored: string): { type: string; detail: string } {
  for (const opt of PAYOUT_OPTIONS) {
    if (opt.prefix && stored.startsWith(opt.prefix)) {
      return { type: opt.value, detail: stored.slice(opt.prefix.length) };
    }
  }
  return { type: "other", detail: stored };
}

export default function ProfileSetup() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();

  const [displayName, setDisplayName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [payoutType, setPayoutType] = useState("cashapp");
  const [payoutDetail, setPayoutDetail] = useState("");
  const [isMonetary, setIsMonetary] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setSlogan(profile.slogan ?? "");
      setIsMonetary(profile.isMonetary ?? true);
      if (profile.payoutMethod) {
        const parsed = parseStoredPayout(profile.payoutMethod);
        setPayoutType(parsed.type);
        setPayoutDetail(parsed.detail);
      }
    } else if (!profileLoading && user) {
      // Pre-fill name from OAuth but leave payout blank — it's the user's own info
      setDisplayName(user.name ?? "");
    }
  }, [profile, profileLoading, user]);

  const upsert = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Profile saved!");
      navigate("/ballot");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setSaving(true);
    let finalPayout: string | undefined;
    if (isMonetary) {
      const opt = PAYOUT_OPTIONS.find((o) => o.value === payoutType);
      if (opt && payoutDetail.trim()) {
        finalPayout = opt.prefix + payoutDetail.trim();
      } else if (payoutDetail.trim()) {
        finalPayout = payoutDetail.trim();
      }
    }
    await upsert.mutateAsync({
      displayName: displayName.trim(),
      slogan: slogan.trim() || undefined,
      payoutMethod: finalPayout,
      isMonetary,
    });
    setSaving(false);
  };

  const currentOpt = PAYOUT_OPTIONS.find((o) => o.value === payoutType) ?? PAYOUT_OPTIONS[0];

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.16_75)]" />
      </div>
    );
  }

  return (
    <OscarLayout title="Player Profile">
      <div className="container py-8 max-w-lg mx-auto">
        {/* Header — slate icon only, no heading or subtitle */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2 trophy-glow">🎬</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div className="oscar-card p-4 sm:p-5">
            <label
              className="flex items-center gap-2 text-xs font-semibold text-[oklch(0.78_0.16_75)] tracking-wider uppercase mb-3"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <User className="w-3.5 h-3.5" />
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'll appear on the leaderboard"
              maxLength={120}
              required
              className="w-full bg-[oklch(0.10_0.01_60)] border border-[oklch(0.25_0.04_75)] px-3 py-2.5 text-sm text-[oklch(0.93_0.03_80)] placeholder-[oklch(0.40_0.03_75)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] focus:ring-1 focus:ring-[oklch(0.78_0.16_75/0.3)] transition-colors"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Slogan */}
          <div className="oscar-card p-4 sm:p-5">
            <label
              className="flex items-center gap-2 text-xs font-semibold text-[oklch(0.78_0.16_75)] tracking-wider uppercase mb-3"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Your Slogan{" "}
              <span className="text-[oklch(0.45_0.03_75)] normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="One sentence — make it memorable!"
              maxLength={280}
              className="w-full bg-[oklch(0.10_0.01_60)] border border-[oklch(0.25_0.04_75)] px-3 py-2.5 text-sm text-[oklch(0.93_0.03_80)] placeholder-[oklch(0.40_0.03_75)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] focus:ring-1 focus:ring-[oklch(0.78_0.16_75/0.3)] transition-colors"
              style={{ borderRadius: 0 }}
            />
            <p className="text-[10px] text-[oklch(0.45_0.03_75)] mt-1.5">{slogan.length}/280</p>
          </div>

          {/* Monetary participation */}
          <div className="oscar-card p-4 sm:p-5">
            <label
              className="flex items-center gap-2 text-xs font-semibold text-[oklch(0.78_0.16_75)] tracking-wider uppercase mb-3"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Trophy className="w-3.5 h-3.5" />
              Participation Type
            </label>

            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="monetary"
                  checked={isMonetary}
                  onChange={() => setIsMonetary(true)}
                  className="mt-0.5 accent-[oklch(0.78_0.16_75)]"
                />
                <div>
                  <div className="text-sm font-semibold text-[oklch(0.82_0.16_78)]">
                    💰 Monetary ($10/ballot)
                  </div>
                  <div className="text-xs text-[oklch(0.55_0.04_75)]">
                    Eligible for 1st, 2nd &amp; 3rd place cash prizes · Multiple ballots accepted
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="monetary"
                  checked={!isMonetary}
                  onChange={() => setIsMonetary(false)}
                  className="mt-0.5 accent-[oklch(0.78_0.16_75)]"
                />
                <div>
                  <div className="text-sm font-medium text-[oklch(0.65_0.01_240)]">
                    🎬 Non-Monetary (free)
                  </div>
                  <div className="text-xs text-[oklch(0.45_0.03_75)]">
                    Play for fun — not eligible for cash prizes
                  </div>
                </div>
              </label>
            </div>

            {/* Multiple ballot reminder */}
            {isMonetary && (
              <div
                className="mt-3 px-3 py-2 text-xs text-[oklch(0.78_0.16_75)]"
                style={{
                  background: "oklch(0.10 0.01 60)",
                  border: "1px solid oklch(0.78 0.16 75 / 0.25)",
                  borderRadius: 0,
                }}
              >
                ✦ You may submit more than one ballot — each additional ballot is $10 and gives you another shot at 1st, 2nd &amp; 3rd place prizes.
              </div>
            )}
          </div>

          {/* Payout method — per-option input field */}
          {isMonetary && (
            <div className="oscar-card p-4 sm:p-5">
              <label
                className="flex items-center gap-2 text-xs font-semibold text-[oklch(0.78_0.16_75)] tracking-wider uppercase mb-3"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Preferred Payout Method
              </label>

              <div className="space-y-3">
                {PAYOUT_OPTIONS.map((opt) => (
                  <div key={opt.value}>
                    <label className="flex items-center gap-3 cursor-pointer mb-1.5">
                      <input
                        type="radio"
                        name="payout"
                        value={opt.value}
                        checked={payoutType === opt.value}
                        onChange={() => setPayoutType(opt.value)}
                        className="accent-[oklch(0.78_0.16_75)]"
                      />
                      <span className="text-sm font-medium text-[oklch(0.85_0.05_80)]">
                        {opt.label}
                      </span>
                    </label>
                    {payoutType === opt.value && (
                      <input
                        type="text"
                        value={payoutDetail}
                        onChange={(e) => setPayoutDetail(e.target.value)}
                        placeholder={opt.placeholder}
                        maxLength={120}
                        className="w-full bg-[oklch(0.10_0.01_60)] border border-[oklch(0.78_0.16_75/0.35)] px-3 py-2.5 text-sm text-[oklch(0.93_0.03_80)] placeholder-[oklch(0.40_0.03_75)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] focus:ring-1 focus:ring-[oklch(0.78_0.16_75/0.3)] transition-colors ml-6"
                        style={{ borderRadius: 0, width: "calc(100% - 1.5rem)" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div
                className="mt-4 p-3 text-xs text-[oklch(0.60_0.04_75)] space-y-0.5"
                style={{
                  background: "oklch(0.10 0.01 60)",
                  border: "1px solid oklch(0.78 0.16 75 / 0.12)",
                  borderRadius: 0,
                }}
              >
                <p className="font-semibold text-[oklch(0.78_0.16_75)]">Pool Payment Info</p>
                <p>
                  💰 CashApp:{" "}
                  <strong className="text-[oklch(0.78_0.16_75)]">$DarionDAnjou</strong>
                </p>
                <p>
                  📱 Zelle / Apple Pay:{" "}
                  <strong className="text-[oklch(0.78_0.16_75)]">+1 404 803 8247</strong>
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
            style={{ fontFamily: "'Cinzel', serif", borderRadius: 0 }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "✦"}
            {saving ? "Saving..." : "Save Profile & Continue to Ballot"}
          </button>
        </form>
      </div>
    </OscarLayout>
  );
}
