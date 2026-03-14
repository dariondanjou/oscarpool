import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (!profileLoading) {
        if (!profile?.profileComplete) {
          navigate("/profile");
        } else {
          navigate("/ballot");
        }
      }
    }
  }, [loading, isAuthenticated, profile, profileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setFormError("Please enter your name.");
          setFormLoading(false);
          return;
        }
        await signupMutation.mutateAsync({
          email: email.trim(),
          password,
          name: name.trim(),
        });
        // After server-side signup, sign in with Supabase client
        await login(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setFormError(err?.message ?? "An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.09 0.01 60)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.78_0.16_75)]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: "oklch(0.09 0.01 60)" }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, oklch(0.78 0.16 75 / 0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "200px",
          background: "radial-gradient(ellipse, oklch(0.65 0.12 70 / 0.05) 0%, transparent 70%)",
        }}
      />

      {/* Scattered gold stars */}
      {[
        { top: "8%", left: "6%", size: 10, opacity: 0.25 },
        { top: "15%", left: "88%", size: 14, opacity: 0.2 },
        { top: "72%", left: "4%", size: 8, opacity: 0.18 },
        { top: "80%", left: "92%", size: 12, opacity: 0.22 },
        { top: "40%", left: "2%", size: 7, opacity: 0.15 },
        { top: "55%", left: "96%", size: 9, opacity: 0.17 },
        { top: "25%", left: "93%", size: 6, opacity: 0.12 },
        { top: "90%", left: "15%", size: 11, opacity: 0.2 },
      ].map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            opacity: s.opacity,
            color: "oklch(0.88 0.14 80)",
          }}
        >
          ★
        </div>
      ))}

      {/* Top gold rule */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.78 0.16 75 / 0.6) 30%, oklch(0.92 0.14 82) 50%, oklch(0.78 0.16 75 / 0.6) 70%, transparent 100%)",
        }}
      />

      {/* Main card */}
      <div
        className="relative z-10 w-full"
        style={{ maxWidth: "420px" }}
      >
        {/* Outer decorative border frame */}
        <div
          style={{
            padding: "3px",
            background:
              "linear-gradient(135deg, oklch(0.62 0.14 70), oklch(0.88 0.14 82), oklch(0.55 0.10 68), oklch(0.88 0.14 82), oklch(0.62 0.14 70))",
          }}
        >
          <div
            style={{
              background: "oklch(0.09 0.01 60)",
              padding: "2px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(160deg, oklch(0.13 0.02 65) 0%, oklch(0.10 0.01 60) 100%)",
                padding: "2.5rem 2rem",
                position: "relative",
              }}
            >
              {/* Corner ornaments */}
              {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
                <span
                  key={i}
                  className={`absolute ${pos} text-[oklch(0.78_0.16_75/0.5)] text-base select-none pointer-events-none`}
                >
                  ✦
                </span>
              ))}

              {/* Trophy */}
              <div className="text-center mb-5">
                <span className="text-6xl trophy-glow" style={{ display: "inline-block" }}>🏆</span>
              </div>

              {/* Eyebrow */}
              <p
                className="text-center text-[10px] tracking-[0.35em] uppercase text-[oklch(0.78_0.16_75)] mb-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                The
              </p>

              {/* Main title */}
              <h1
                className="text-center text-gold-gradient font-black leading-tight mb-1"
                style={{
                  fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                  fontSize: "clamp(1.35rem, 5vw, 1.75rem)",
                  letterSpacing: "0.04em",
                }}
              >
                Darion D'Anjou
              </h1>
              <h2
                className="text-center text-gold-gradient font-black leading-tight"
                style={{
                  fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                  fontSize: "clamp(0.85rem, 3vw, 1.05rem)",
                  letterSpacing: "0.06em",
                }}
              >
                Oscar Pool
              </h2>
              <p
                className="text-center mt-1 text-[oklch(0.65_0.05_80)]"
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                Academy Awards 2026
              </p>

              {/* Script subtitle */}
              <p
                className="text-center text-[oklch(0.75_0.06_80)] mt-2 mb-4"
                style={{
                  fontFamily: "'Pinyon Script', 'Georgia', cursive",
                  fontSize: "1.4rem",
                  lineHeight: 1.2,
                }}
              >
                You're Cordially Invited
              </p>

              {/* Gold divider */}
              <div className="gold-divider mb-4" />

              {/* Event details */}
              <div
                className="text-center text-[oklch(0.78_0.16_75)] mb-4 space-y-0.5"
                style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.06em" }}
              >
                <p>Sunday, March 15 · Doors Open 6:00 PM</p>
                <p className="text-[oklch(0.55_0.04_75)]">1412 Gates Circle · Atlanta, GA 30316</p>
              </div>

              {/* Pool info box */}
              <div
                className="text-center text-xs mb-5 px-3 py-2.5"
                style={{
                  background: "oklch(0.08 0.01 60)",
                  border: "1px solid oklch(0.78 0.16 75 / 0.18)",
                  borderRadius: 0,
                }}
              >
                <p
                  className="text-[oklch(0.82_0.14_78)] font-bold mb-0.5"
                  style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.1em" }}
                >
                  Oscar Ballot Pool · $10 Per Ballot
                </p>
                <p className="text-[oklch(0.65_0.04_75)]" style={{ fontSize: "0.68rem" }}>
                  Multiple Ballots Accepted · 1st, 2nd &amp; 3rd Place Prizes
                </p>
                <p className="text-[oklch(0.48_0.03_75)] mt-0.5" style={{ fontSize: "0.65rem" }}>
                  Non-monetary participation welcome
                </p>
              </div>

              {/* Sign in / Sign up form */}
              <div className="space-y-3">
                {/* Tabs */}
                <div className="flex border-b" style={{ borderColor: "oklch(0.25 0.04 75 / 0.5)" }}>
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setFormError(""); }}
                    className="flex-1 py-2 text-xs tracking-widest uppercase transition-all"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      color: mode === "signin" ? "oklch(0.78 0.16 75)" : "oklch(0.50 0.03 75)",
                      borderBottom: mode === "signin" ? "2px solid oklch(0.78 0.16 75)" : "2px solid transparent",
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setFormError(""); }}
                    className="flex-1 py-2 text-xs tracking-widest uppercase transition-all"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      color: mode === "signup" ? "oklch(0.78 0.16 75)" : "oklch(0.50 0.03 75)",
                      borderBottom: mode === "signup" ? "2px solid oklch(0.78 0.16 75)" : "2px solid transparent",
                    }}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {mode === "signup" && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name (optional)"
                      className="w-full bg-[oklch(0.10_0.01_60)] border border-[oklch(0.25_0.04_75)] px-3 py-2.5 text-sm text-[oklch(0.93_0.03_80)] placeholder-[oklch(0.40_0.03_75)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] focus:ring-1 focus:ring-[oklch(0.78_0.16_75/0.3)] transition-colors"
                      style={{ borderRadius: 0 }}
                    />
                  )}

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full bg-[oklch(0.10_0.01_60)] border border-[oklch(0.25_0.04_75)] px-3 py-2.5 text-sm text-[oklch(0.93_0.03_80)] placeholder-[oklch(0.40_0.03_75)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] focus:ring-1 focus:ring-[oklch(0.78_0.16_75/0.3)] transition-colors"
                    style={{ borderRadius: 0 }}
                  />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    minLength={6}
                    className="w-full bg-[oklch(0.10_0.01_60)] border border-[oklch(0.25_0.04_75)] px-3 py-2.5 text-sm text-[oklch(0.93_0.03_80)] placeholder-[oklch(0.40_0.03_75)] focus:outline-none focus:border-[oklch(0.78_0.16_75)] focus:ring-1 focus:ring-[oklch(0.78_0.16_75/0.3)] transition-colors"
                    style={{ borderRadius: 0 }}
                  />

                  {formError && (
                    <p className="text-xs text-[oklch(0.65_0.22_25)] text-center">{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn-gold w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2"
                    style={{ fontFamily: "'Cinzel', serif", borderRadius: 0 }}
                  >
                    {formLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>✦ &nbsp; {mode === "signin" ? "Sign In" : "Create Account"} &nbsp; ✦</>
                    )}
                  </button>
                </form>
              </div>

              {/* Gold divider */}
              <div className="gold-divider mt-5 mb-4" />

              {/* Payment info */}
              <div className="text-center space-y-1" style={{ fontSize: "0.68rem" }}>
                <p
                  className="text-[oklch(0.78_0.16_75)] font-semibold tracking-widest uppercase"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Pay Into the Pool
                </p>
                <p className="text-[oklch(0.60_0.04_75)]">
                  💰 CashApp:{" "}
                  <span className="text-[oklch(0.82_0.14_78)] font-bold">$DarionDAnjou</span>
                </p>
                <p className="text-[oklch(0.60_0.04_75)]">
                  📱 Zelle / Apple Pay:{" "}
                  <span className="text-[oklch(0.82_0.14_78)] font-bold">+1 404 803 8247</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Film strip below card */}
        <div className="flex justify-center gap-1.5 mt-4 opacity-25">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                width: "14px",
                height: "20px",
                borderRadius: 0,
                background: "oklch(0.78 0.16 75 / 0.25)",
                border: "1px solid oklch(0.78 0.16 75 / 0.35)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom gold rule */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, oklch(0.78 0.16 75 / 0.6) 30%, oklch(0.92 0.14 82) 50%, oklch(0.78 0.16 75 / 0.6) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}
