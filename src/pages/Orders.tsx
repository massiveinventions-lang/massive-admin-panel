import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { adminApi, type Order } from "@/lib/api";

const STATUSES = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "replacement", label: "Replacement" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

function statusClass(s: string) {
  if (s === "paid" || s === "shipped" || s === "delivered" || s === "replacement")
    return "bg-green-100 text-green-700";
  if (s === "cancelled" || s === "refunded") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

export default function Orders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "orders", { status, skip: page * limit, limit }],
    queryFn: () =>
      adminApi.orders({
        status: status || undefined,
        skip: page * limit,
        limit,
      }),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Orders
          </h1>
          <p className="text-[var(--foreground)]/60 mt-1">
            {total} {total === 1 ? "order" : "orders"} total
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            type="button"
            key={s.value}
            onClick={() => {
              setStatus(s.value);
              setPage(0);
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
          <span>Could not load orders.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--soft-gray)] text-[var(--foreground)]/60 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Order</th>
              <th className="text-left px-4 py-3 font-semibold">Customer</th>
              <th className="text-left px-4 py-3 font-semibold">Items</th>
              <th className="text-right px-4 py-3 font-semibold">Total</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--foreground)]/50">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--foreground)]/50">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((o: Order) => {
                const itemCount = o.items.reduce((s, i) => s + i.quantity, 0);
                return (
                  <tr
                    key={o.id}
                    className="border-t border-[var(--foreground)]/8 hover:bg-[var(--background)] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]/70">
                      {o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      <span className="truncate max-w-[200px] inline-block align-middle">
                        {o.customerEmail ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]/70">{itemCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--accent-brown)]">
                      ₹{o.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full inline-block ${statusClass(o.status)}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]/60 text-xs">
                      {new Date(o.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-[var(--accent-brown)] hover:underline text-xs font-semibold inline-flex items-center gap-1"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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