import { useAuth } from "@/_core/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Mail, ChevronDown } from "lucide-react";
import OrnateFrame from "@/components/OrnateFrame";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#E0E0E0">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [showEmailForm, setShowEmailForm] = useState(false);
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

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'twitter') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/ballot'
      }
    });
    if (error) {
      setFormError(error.message);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-deep)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--gold-primary)" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse, rgba(212,168,67,0.07) 0%, transparent 70%)",
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
          background: "radial-gradient(ellipse, rgba(212,168,67,0.04) 0%, transparent 70%)",
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
      ].map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ top: s.top, left: s.left, fontSize: s.size, opacity: s.opacity, color: "var(--gold-light)" }}
        >
          ★
        </div>
      ))}

      {/* Top gold rule */}
      <div className="gold-rule absolute top-0 left-0 right-0" />

      {/* Main card */}
      <div className="relative z-10 w-full" style={{ maxWidth: "460px" }}>
        <OrnateFrame>
          <div
            style={{
              background: "linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-deep) 100%)",
              padding: "2.5rem 2rem",
            }}
          >
            {/* Trophy */}
            <div className="text-center mb-4">
              <span className="text-6xl trophy-glow inline-block">🏆</span>
            </div>

            {/* Eyebrow */}
            <p className="text-center text-[10px] tracking-[0.35em] uppercase mb-1 font-heading" style={{ color: "var(--gold-primary)" }}>
              The
            </p>

            {/* Main title */}
            <h1
              className="text-center text-gold-gradient font-black leading-tight mb-1 font-display"
              style={{ fontSize: "clamp(1.1rem, 4.5vw, 1.5rem)", letterSpacing: "0.04em" }}
            >
              98th Academy Awards
            </h1>

            {/* Script subtitle */}
            <p className="text-center mt-1 mb-1 font-script" style={{ color: "var(--gold-light)", fontSize: "1.5rem", lineHeight: 1.2 }}>
              You're Cordially Invited
            </p>

            {/* OSCAR WATCH PARTY */}
            <h2
              className="text-center font-black leading-tight mb-1 font-display"
              style={{
                fontSize: "clamp(1.6rem, 7vw, 2.2rem)",
                letterSpacing: "0.06em",
                background: "linear-gradient(180deg, #F5E6B8 0%, #D4A843 40%, #8B7535 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Oscar Watch Party
            </h2>

            {/* Host name */}
            <p className="text-center text-xs tracking-[0.18em] uppercase font-heading mb-3" style={{ color: "var(--text-secondary)" }}>
              Hosted by Darion D'Anjou
            </p>

            {/* Gold divider */}
            <div className="gold-divider mb-4" />

            {/* Event details */}
            <div className="text-center mb-4 space-y-0.5 font-heading" style={{ fontSize: "0.72rem", letterSpacing: "0.06em" }}>
              <p style={{ color: "var(--gold-primary)" }}>Sunday, March 15 · Doors Open 6:00 PM</p>
              <p style={{ color: "var(--text-secondary)" }}>1412 Gates Circle · Atlanta, GA 30316</p>
            </div>

            {/* Pool info box */}
            <div
              className="text-center text-xs mb-5 px-3 py-2.5"
              style={{
                background: "var(--bg-deep)",
                border: "1px solid rgba(212,168,67,0.18)",
              }}
            >
              <p className="font-bold mb-0.5 font-heading" style={{ color: "var(--gold-primary)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
                Oscar Ballot Pool · $10 Per Ballot
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.68rem" }}>
                Multiple Ballots Accepted · 1st, 2nd &amp; 3rd Place Prizes
              </p>
              <p className="mt-0.5" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>
                Non-monetary participation welcome
              </p>
            </div>

            {/* Gold divider */}
            <div className="gold-divider mb-5" />

            {/* Auth Section */}
            <div className="space-y-3">
              <p className="text-center text-[10px] tracking-[0.25em] uppercase font-heading" style={{ color: "var(--gold-primary)" }}>
                Join the Pool
              </p>

              {/* Social login buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 text-xs transition-all hover:border-[var(--gold-primary)]"
                  style={{
                    background: "var(--bg-deep)",
                    border: "1px solid rgba(212,168,67,0.2)",
                    color: "var(--text-primary)",
                  }}
                >
                  <GoogleIcon />
                  <span className="font-body text-[10px]" style={{ color: "var(--text-secondary)" }}>Google</span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('facebook')}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 text-xs transition-all hover:border-[var(--gold-primary)]"
                  style={{
                    background: "var(--bg-deep)",
                    border: "1px solid rgba(212,168,67,0.2)",
                    color: "var(--text-primary)",
                  }}
                >
                  <FacebookIcon />
                  <span className="font-body text-[10px]" style={{ color: "var(--text-secondary)" }}>Facebook</span>
                </button>

                <button
                  onClick={() => handleOAuthLogin('twitter')}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 text-xs transition-all hover:border-[var(--gold-primary)]"
                  style={{
                    background: "var(--bg-deep)",
                    border: "1px solid rgba(212,168,67,0.2)",
                    color: "var(--text-primary)",
                  }}
                >
                  <XIcon />
                  <span className="font-body text-[10px]" style={{ color: "var(--text-secondary)" }}>X</span>
                </button>
              </div>

              {/* Email toggle */}
              <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs transition-all font-heading tracking-wider"
                style={{
                  background: "var(--bg-deep)",
                  border: "1px solid rgba(212,168,67,0.2)",
                  color: "var(--text-secondary)",
                }}
              >
                <Mail className="w-4 h-4" style={{ color: "var(--gold-primary)" }} />
                <span>Sign in with Email</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showEmailForm ? "rotate-180" : ""}`} />
              </button>

              {/* Email form (collapsible) */}
              {showEmailForm && (
                <div className="space-y-3 pt-1">
                  {/* Tabs */}
                  <div className="flex" style={{ borderBottom: "1px solid rgba(212,168,67,0.2)" }}>
                    <button
                      type="button"
                      onClick={() => { setMode("signin"); setFormError(""); }}
                      className="flex-1 py-2 text-xs tracking-widest uppercase transition-all font-heading"
                      style={{
                        color: mode === "signin" ? "var(--gold-primary)" : "var(--text-secondary)",
                        borderBottom: mode === "signin" ? "2px solid var(--gold-primary)" : "2px solid transparent",
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setFormError(""); }}
                      className="flex-1 py-2 text-xs tracking-widest uppercase transition-all font-heading"
                      style={{
                        color: mode === "signup" ? "var(--gold-primary)" : "var(--text-secondary)",
                        borderBottom: mode === "signup" ? "2px solid var(--gold-primary)" : "2px solid transparent",
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
                        placeholder="Your Name"
                        className="w-full px-3 py-2.5 text-sm font-body focus:outline-none transition-colors"
                        style={{
                          background: "var(--bg-deep)",
                          border: "1px solid rgba(212,168,67,0.2)",
                          color: "var(--text-primary)",
                        }}
                      />
                    )}

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="w-full px-3 py-2.5 text-sm font-body focus:outline-none transition-colors"
                      style={{
                        background: "var(--bg-deep)",
                        border: "1px solid rgba(212,168,67,0.2)",
                        color: "var(--text-primary)",
                      }}
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      minLength={6}
                      className="w-full px-3 py-2.5 text-sm font-body focus:outline-none transition-colors"
                      style={{
                        background: "var(--bg-deep)",
                        border: "1px solid rgba(212,168,67,0.2)",
                        color: "var(--text-primary)",
                      }}
                    />

                    {formError && (
                      <p className="text-xs text-center" style={{ color: "var(--destructive)" }}>{formError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={formLoading}
                      className="btn-gold w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                      {formLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>{mode === "signin" ? "Sign In" : "Create Account"}</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Gold divider */}
            <div className="gold-divider mt-5 mb-4" />

            {/* Payment info */}
            <div className="text-center space-y-1" style={{ fontSize: "0.68rem" }}>
              <p className="font-semibold tracking-widest uppercase font-heading" style={{ color: "var(--gold-primary)" }}>
                Pay Into the Pool
              </p>
              <p style={{ color: "var(--text-secondary)" }}>
                CashApp: <span className="font-bold" style={{ color: "var(--gold-primary)" }}>$DarionDAnjou</span>
              </p>
              <p style={{ color: "var(--text-secondary)" }}>
                Zelle / Apple Pay: <span className="font-bold" style={{ color: "var(--gold-primary)" }}>+1 404 803 8247</span>
              </p>
            </div>
          </div>
        </OrnateFrame>

        {/* Film strip below card */}
        <div className="film-strip mt-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="film-strip-frame" />
          ))}
        </div>
      </div>

      {/* Bottom gold rule */}
      <div className="gold-rule absolute bottom-0 left-0 right-0" />
    </div>
  );
}
