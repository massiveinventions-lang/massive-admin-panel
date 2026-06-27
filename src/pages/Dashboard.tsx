import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingBag, Mail, Users, IndianRupee, Package, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { adminApi } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  loading?: boolean;
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-5 hover:border-[var(--accent-brown)] transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-brown)]/10 text-[var(--accent-brown)] flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        {href && (
          <ArrowRight className="w-4 h-4 text-[var(--foreground)]/30 group-hover:text-[var(--accent-brown)] group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
      {loading ? (
        <div className="h-8 w-20 bg-[var(--soft-gray)] rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-[var(--foreground)]">{value}</p>
      )}
      <p className="text-sm text-[var(--foreground)]/60 mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.stats,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin", "orders", { limit: 5 }],
    queryFn: () => adminApi.orders({ limit: 5 }),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
          Dashboard
        </h1>
        <p className="text-[var(--foreground)]/60 mt-1">
          Overview of your store activity
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Could not load stats.
            {" "}
            <span className="text-red-600/80">
              {error instanceof Error
                ? error.message
                : "Check the backend is running and you're signed in."}
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total orders"
          value={data?.orders ?? 0}
          icon={ShoppingBag}
          href="/orders"
          loading={isLoading}
        />
        <StatCard
          label="Revenue (paid+)"
          value={`₹${(data?.revenue ?? 0).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          loading={isLoading}
        />
        <StatCard
          label="Subscribers"
          value={data?.subscribers ?? 0}
          icon={Mail}
          href="/newsletter"
          loading={isLoading}
        />
        <StatCard
          label="Customers"
          value={data?.users ?? 0}
          icon={Users}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--foreground)]/8 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--foreground)]">Recent orders</h2>
            <Link
              href="/orders"
              className="text-xs text-[var(--accent-brown)] hover:underline font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders ? (
            recentOrders.orders.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/50 py-8 text-center">
                No orders yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--soft-gray)] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {o.customerEmail ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--foreground)]/50">
                        {o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-bold text-[var(--accent-brown)]">
                        ₹{o.total.toLocaleString("en-IN")}
                      </p>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          o.status === "paid" || o.status === "shipped" || o.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : o.status === "cancelled" || o.status === "refunded"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-[var(--foreground)]/50 py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-5">
          <h2 className="font-bold text-[var(--foreground)] mb-3">At a glance</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--foreground)]/60">Products</dt>
              <dd className="font-semibold">{data?.products ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--foreground)]/60">Paid orders</dt>
              <dd className="font-semibold">{data?.paidOrders ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--foreground)]/60">Pending payment</dt>
              <dd className="font-semibold">
                {(data?.orders ?? 0) - (data?.paidOrders ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--foreground)]/60">Conversion</dt>
              <dd className="font-semibold">
                {data && data.orders > 0
                  ? `${Math.round((data.paidOrders / data.orders) * 100)}%`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}