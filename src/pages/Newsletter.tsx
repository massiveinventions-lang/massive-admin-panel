import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Loader2, AlertCircle, Mail } from "lucide-react";
import { adminApi, type Subscriber } from "@/lib/api";

export default function Newsletter() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "subscribers", { q, skip: page * limit, limit }],
    queryFn: () =>
      adminApi.subscribers({
        q: q || undefined,
        skip: page * limit,
        limit,
      }),
  });

  const subs = data?.subscribers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const exportCSV = () => {
    if (!subs.length) return;
    const header = "email,source,createdAt\n";
    const rows = subs
      .map(
        (s) =>
          `${s.email},${s.source},${new Date(s.createdAt).toISOString()}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Newsletter
          </h1>
          <p className="text-[var(--foreground)]/60 mt-1">
            {total} {total === 1 ? "subscriber" : "subscribers"} total
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!subs.length}
          className="h-10 px-4 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white text-sm font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground)]/40" />
        <input
          type="search"
          placeholder="Search by email…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          className="w-full h-10 pl-10 pr-3 rounded-xl bg-white border border-[var(--foreground)]/10 focus:border-[var(--accent-brown)] outline-none text-sm"
        />
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Could not load subscribers.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--soft-gray)] text-[var(--foreground)]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Source</th>
              <th className="text-left px-4 py-3 font-semibold">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-[var(--foreground)]/50">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-[var(--foreground)]/50">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-[var(--foreground)]/20" />
                  {q ? "No subscribers match your search" : "No subscribers yet"}
                </td>
              </tr>
            ) : (
              subs.map((s: Subscriber) => (
                <tr
                  key={s.id}
                  className="border-t border-[var(--foreground)]/8 hover:bg-[var(--background)] transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                    {s.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-[var(--soft-gray)] text-[var(--foreground)]/70 px-2 py-0.5 rounded-full font-semibold">
                      {s.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground)]/60 text-xs">
                    {new Date(s.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--foreground)]/60">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-[var(--foreground)]/10 hover:border-[var(--foreground)]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-[var(--foreground)]/10 hover:border-[var(--foreground)]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}