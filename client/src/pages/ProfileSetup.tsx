import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, User, MessageSquare, DollarSign, Trophy } from "lucide-react";
import OscarLayout from "@/components/OscarLayout";

const PAYOUT_OPTIONS = [
  { value: "cashapp", label: "CashApp", placeholder: "Your CashApp $handle (e.g. $YourName)", prefix: "CashApp: " },
  { value: "zelle", label: "Zelle", placeholder: "Your Zelle phone or email", prefix: "Zelle: " },
  { value: "applepay", label: "Apple Pay", placeholder: "Your Apple Pay phone number", prefix: "Apple Pay: " },
  { value: "other", label: "Other", placeholder: "Describe your preferred payout method", prefix: "" },
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

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold-primary)" }} />
      </div>
    );
  }

  return (
    <OscarLayout title="Player Profile">
      <div className="container py-8 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2 trophy-glow">🎬</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name */}
          <div className="oscar-card p-4 sm:p-5">
            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-3 font-heading" style={{ color: "var(--gold-primary)" }}>
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
              className="w-full px-3 py-2.5 text-sm font-body focus:outline-none transition-colors"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid rgba(212,168,67,0.2)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Slogan */}
          <div className="oscar-card p-4 sm:p-5">
            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-3 font-heading" style={{ color: "var(--gold-primary)" }}>
              <MessageSquare className="w-3.5 h-3.5" />
              Your Slogan <span className="normal-case font-normal" style={{ color: "var(--text-secondary)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="One sentence — make it memorable!"
              maxLength={280}
              className="w-full px-3 py-2.5 text-sm font-body focus:outline-none transition-colors"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid rgba(212,168,67,0.2)",
                color: "var(--text-primary)",
              }}
            />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-secondary)" }}>{slogan.length}/280</p>
          </div>

          {/* Monetary participation */}
          <div className="oscar-card p-4 sm:p-5">
            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-3 font-heading" style={{ color: "var(--gold-primary)" }}>
              <Trophy className="w-3.5 h-3.5" />
              Participation Type
            </label>

            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="monetary" checked={isMonetary} onChange={() => setIsMonetary(true)} className="mt-0.5 accent-[#D4A843]" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--gold-primary)" }}>Monetary ($10/ballot)</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Eligible for 1st, 2nd &amp; 3rd place cash prizes</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="monetary" checked={!isMonetary} onChange={() => setIsMonetary(false)} className="mt-0.5 accent-[#D4A843]" />
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--silver-primary)" }}>Non-Monetary (free)</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Play for fun — not eligible for cash prizes</div>
                </div>
              </label>
            </div>

            {isMonetary && (
              <div className="mt-3 px-3 py-2 text-xs" style={{
                background: "var(--bg-deep)",
                border: "1px solid rgba(212,168,67,0.25)",
                color: "var(--gold-primary)",
              }}>
                You may submit more than one ballot — each additional ballot is $10.
              </div>
            )}
          </div>

          {/* Payout method */}
          {isMonetary && (
            <div className="oscar-card p-4 sm:p-5">
              <label className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-3 font-heading" style={{ color: "var(--gold-primary)" }}>
                <DollarSign className="w-3.5 h-3.5" />
                Preferred Payout Method
              </label>

              <div className="space-y-3">
                {PAYOUT_OPTIONS.map((opt) => (
                  <div key={opt.value}>
                    <label className="flex items-center gap-3 cursor-pointer mb-1.5">
                      <input
                        type="radio" name="payout" value={opt.value}
                        checked={payoutType === opt.value}
                        onChange={() => setPayoutType(opt.value)}
                        className="accent-[#D4A843]"
                      />
                      <span className="text-sm font-medium font-body" style={{ color: "var(--text-primary)" }}>{opt.label}</span>
                    </label>
                    {payoutType === opt.value && (
                      <input
                        type="text" value={payoutDetail}
                        onChange={(e) => setPayoutDetail(e.target.value)}
                        placeholder={opt.placeholder} maxLength={120}
                        className="w-full px-3 py-2.5 text-sm font-body focus:outline-none transition-colors ml-6"
                        style={{
                          background: "var(--bg-deep)",
                          border: "1px solid rgba(212,168,67,0.35)",
                          color: "var(--text-primary)",
                          width: "calc(100% - 1.5rem)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 text-xs space-y-0.5" style={{
                background: "var(--bg-deep)",
                border: "1px solid rgba(212,168,67,0.12)",
              }}>
                <p className="font-semibold" style={{ color: "var(--gold-primary)" }}>Pool Payment Info</p>
                <p style={{ color: "var(--text-secondary)" }}>CashApp: <strong style={{ color: "var(--gold-primary)" }}>$DarionDAnjou</strong></p>
                <p style={{ color: "var(--text-secondary)" }}>Zelle / Apple Pay: <strong style={{ color: "var(--gold-primary)" }}>+1 404 803 8247</strong></p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save Profile & Continue to Ballot"}
          </button>
        </form>
      </div>
    </OscarLayout>
  );
}
