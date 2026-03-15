import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Film, BarChart2, Settings, LogOut, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface OscarLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function OscarLayout({ children, title }: OscarLayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  const navItems = [
    { href: "/ballot", label: "My Ballot", icon: Film },
    { href: "/leaderboard", label: "Leaderboard", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top gold rule */}
      <div className="gold-rule" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full" style={{
        background: "linear-gradient(180deg, var(--bg-deep) 0%, rgba(10,10,10,0.95) 100%)",
        borderBottom: "1px solid rgba(212,168,67,0.25)",
        backdropFilter: "blur(12px)",
      }}>
        <div className="container">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href={isAuthenticated ? "/ballot" : "/"}>
              <div className="flex items-center gap-2 cursor-pointer group">
                <span className="text-2xl trophy-glow">🏆</span>
                <div className="hidden sm:block">
                  <div className="text-xs text-gold-gradient font-bold tracking-widest uppercase font-heading">
                    Darion D'Anjou Oscar Pool
                  </div>
                  <div className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>
                    Academy Awards 2026
                  </div>
                </div>
                <div className="sm:hidden">
                  <div className="text-xs text-gold-gradient font-bold tracking-wider uppercase font-heading">
                    D'Anjou Oscar Pool
                  </div>
                </div>
              </div>
            </Link>

            {/* Nav */}
            {isAuthenticated && (
              <nav className="flex items-center gap-1 sm:gap-2">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <button
                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all font-heading ${
                        location === href
                          ? "bg-[rgba(212,168,67,0.12)]"
                          : "hover:bg-[rgba(212,168,67,0.08)]"
                      }`}
                      style={{
                        color: location === href ? "var(--gold-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  </Link>
                ))}

                {user?.role === "admin" && (
                  <Link href="/admin">
                    <button
                      className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all font-heading ${
                        location === "/admin"
                          ? "bg-[rgba(212,168,67,0.12)]"
                          : "hover:bg-[rgba(212,168,67,0.08)]"
                      }`}
                      style={{
                        color: location === "/admin" ? "var(--gold-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Admin</span>
                    </button>
                  </Link>
                )}

                <Link href="/profile">
                  <button
                    className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all font-heading ${
                      location === "/profile"
                        ? "bg-[rgba(212,168,67,0.12)]"
                        : "hover:bg-[rgba(212,168,67,0.08)]"
                    }`}
                    style={{
                      color: location === "/profile" ? "var(--gold-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{profile?.displayName ?? "Profile"}</span>
                  </button>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Out</span>
                </button>
              </nav>
            )}

            {!isAuthenticated && (
              <Link href="/">
                <button className="btn-gold px-4 py-1.5 text-xs sm:text-sm">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Page title */}
      {title && (
        <div className="w-full py-3 text-center" style={{ borderBottom: "1px solid rgba(212,168,67,0.15)" }}>
          <h1 className="text-sm sm:text-base font-semibold text-gold-gradient tracking-widest uppercase font-heading">
            {title}
          </h1>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
