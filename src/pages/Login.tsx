import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { adminApi, setSession } from "@/lib/api";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { token, email: returnedEmail } = await adminApi.login(email.trim(), password);
      setSession(token, returnedEmail);
      toast.success("Welcome back");
      navigate("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--foreground)] text-white mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
            Massive Inventions
          </h1>
          <p className="text-sm text-[var(--foreground)]/60 mt-1">Admin panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-[var(--foreground)]/8 p-6 sm:p-8 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">Sign in</h2>
          <p className="text-sm text-[var(--foreground)]/60 mb-6">
            Use your admin credentials to access the dashboard.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)]/40" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[var(--soft-gray)] border border-transparent focus:border-[var(--accent-brown)] focus:bg-white outline-none text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)]/40" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-[var(--soft-gray)] border border-transparent focus:border-[var(--accent-brown)] focus:bg-white outline-none text-sm transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-center text-[var(--foreground)]/40 mt-6">
          Restricted area. Unauthorized access is logged.
        </p>
      </div>
    </div>
  );
}