import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Loader2,
  AlertCircle,
  Inbox,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi, type ReplacementRequest } from "@/lib/api";

const STATUSES = [
  { value: "", label: "All", color: "" },
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-700" },
  { value: "resolved", label: "Resolved", color: "bg-blue-100 text-blue-700" },
];

function statusBadgeClass(status: string) {
  return STATUSES.find((s) => s.value === status)?.color ?? "bg-gray-100 text-gray-700";
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function ReplacementRequests() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const limit = 25;

  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "replacement-requests", { status, skip: page * limit, limit }],
    queryFn: () =>
      adminApi.replacementRequests({
        status: status || undefined,
        skip: page * limit,
        limit,
      }),
  });

  const requests = data?.requests ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) =>
      adminApi.updateReplacementRequest(id, { status, adminNotes }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "replacement-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Replacement Requests
          </h1>
          <p className="text-[var(--foreground)]/60 mt-1">
            {total} {total === 1 ? "request" : "requests"} · Review and approve before issuing replacements
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setStatus(s.value);
              setPage(0);
              setSelectedId(null);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              status === s.value
                ? "bg-[var(--foreground)] text-white"
                : "bg-white text-[var(--foreground)]/70 border border-[var(--foreground)]/8 hover:border-[var(--foreground)]/20"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Could not load replacement requests.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LIST */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--foreground)]/8 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-[var(--foreground)]/50">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-10 h-10 mx-auto mb-3 text-[var(--foreground)]/20" />
              <p className="text-sm text-[var(--foreground)]/50">
                {status ? `No ${status} requests` : "No replacement requests yet"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--foreground)]/8 max-h-[calc(100vh-280px)] overflow-y-auto">
              {requests.map((r: ReplacementRequest) => {
                const active = selectedId === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left p-4 hover:bg-[var(--background)] transition-colors ${
                        active ? "bg-[var(--background)]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="font-semibold text-[var(--foreground)] truncate">
                          {r.name}
                        </p>
                        <ChevronRight className="w-4 h-4 text-[var(--foreground)]/30 shrink-0" />
                      </div>
                      <p className="text-xs text-[var(--foreground)]/60 truncate">
                        {r.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(r.status)}`}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs text-[var(--foreground)]/40">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-[var(--foreground)]/8 text-sm">
              <span className="text-[var(--foreground)]/60">
                Page {page + 1} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded-lg font-semibold bg-white border border-[var(--foreground)]/10 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg font-semibold bg-white border border-[var(--foreground)]/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DETAIL */}
        <div className="lg:col-span-3">
          {selectedId ? (
            <RequestDetail
              id={selectedId}
              onUpdate={(status, adminNotes) =>
                updateMutation.mutate({ id: selectedId, status, adminNotes })
              }
              updating={updateMutation.isPending}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-12 text-center">
              <Mail className="w-10 h-10 mx-auto mb-3 text-[var(--foreground)]/20" />
              <p className="text-sm text-[var(--foreground)]/50">
                Select a request from the list to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestDetail({
  id,
  onUpdate,
  updating,
}: {
  id: string;
  onUpdate: (status: string, adminNotes?: string) => void;
  updating: boolean;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "replacement-request", id],
    queryFn: () => adminApi.replacementRequest(id),
  });

  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-8 text-center text-[var(--foreground)]/50">
        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-8">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Could not load this request.</span>
        </div>
      </div>
    );
  }

  const r = data.request;

  return (
    <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black text-[var(--foreground)] truncate">
            {r.name}
          </h2>
          <p className="text-sm text-[var(--foreground)]/60 truncate">{r.email}</p>
          {r.phone && (
            <p className="text-sm text-[var(--foreground)]/60">📞 {r.phone}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${statusBadgeClass(r.status)}`}
        >
          {r.status}
        </span>
      </div>

      {/* Meta */}
      <dl className="text-sm border-y border-[var(--foreground)]/8 py-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-[var(--foreground)]/50">Submitted</dt>
          <dd className="text-[var(--foreground)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(r.createdAt)}
          </dd>
        </div>
        {r.orderId && (
          <div>
            <dt className="text-xs text-[var(--foreground)]/50">Order ID</dt>
            <dd className="font-mono text-xs truncate">{r.orderId}</dd>
          </div>
        )}
        {r.productName && (
          <div className="col-span-2">
            <dt className="text-xs text-[var(--foreground)]/50">Product</dt>
            <dd className="text-[var(--foreground)]">{r.productName}</dd>
          </div>
        )}
        <div className="col-span-2">
          <dt className="text-xs text-[var(--foreground)]/50">Reason</dt>
          <dd className="text-[var(--foreground)]">{r.reason}</dd>
        </div>
      </dl>

      {/* Message */}
      <div>
        <p className="text-xs text-[var(--foreground)]/50 mb-1">Customer message</p>
        <div className="p-3 rounded-xl bg-[var(--soft-gray)] text-sm text-[var(--foreground)] whitespace-pre-wrap">
          {r.message}
        </div>
      </div>

      {/* Reply actions */}
      <div className="border-t border-[var(--foreground)]/8 pt-4 space-y-3">
        <p className="text-xs text-[var(--foreground)]/50">Admin notes (optional)</p>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes — visible to your team only"
          className="w-full p-3 rounded-xl bg-[var(--soft-gray)] border border-transparent focus:border-[var(--accent-brown)] focus:bg-white outline-none text-sm transition-colors resize-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={updating || r.status === "approved"}
            onClick={() => onUpdate("approved", notes || undefined)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
          <button
            type="button"
            disabled={updating || r.status === "declined"}
            onClick={() => onUpdate("declined", notes || undefined)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Decline
          </button>
          <button
            type="button"
            disabled={updating || r.status === "resolved"}
            onClick={() => onUpdate("resolved", notes || undefined)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark resolved
          </button>
          <a
            href={`mailto:${r.email}?subject=Re%3A%20Your%20replacement%20request`}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[var(--foreground)]/15 hover:bg-[var(--soft-gray)] text-[var(--foreground)] text-sm font-semibold transition-colors ml-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Email customer
          </a>
        </div>
      </div>
    </div>
  );
}