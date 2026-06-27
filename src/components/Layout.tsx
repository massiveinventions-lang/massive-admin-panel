import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  Mail,
  LogOut,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { clearSession, getEmail } from "@/lib/api";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/replacement-requests", label: "Replacements", icon: Inbox },
  { href: "/newsletter", label: "Newsletter", icon: Mail },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();
  const email = getEmail();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-[var(--foreground)] text-white">
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-brown)] flex items-center justify-center text-white font-black">
              M
            </div>
            <div>
              <p className="font-black text-sm">Massive</p>
              <p className="text-xs text-white/50 -mt-0.5">Admin panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-3 border-t border-white/10" />

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View public site
          </a>
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-white/50">Signed in as</p>
            <p className="text-sm font-semibold truncate">{email ?? "admin"}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession();
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[var(--foreground)] text-white px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-black text-sm">Massive Admin</Link>
        <button
          type="button"
          onClick={() => {
            clearSession();
            window.location.href = "/login";
          }}
          className="text-white/60 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="md:hidden h-14" /> {/* spacer for mobile top bar */}
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}