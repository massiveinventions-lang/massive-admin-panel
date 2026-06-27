import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  MapPin,
  CreditCard,
  Truck,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "shipped",
  "out_for_delivery",
  "delivered",
  "replacement",
  "cancelled",
  "refunded",
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => adminApi.order(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminApi.updateStatus(id!, status),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "order", id] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Update failed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--foreground)]/50">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-[var(--foreground)]/50 hover:text-[var(--foreground)] text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </button>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Order not found or could not be loaded.</span>
        </div>
      </div>
    );
  }

  const o = data.order;
  const addr = o.shippingAddress;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/orders")}
        className="flex items-center gap-2 text-[var(--foreground)]/50 hover:text-[var(--foreground)] text-sm font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Order {o.id.slice(0, 8)}
          </h1>
          <p className="text-[var(--foreground)]/60 mt-1 text-sm">
            Placed on{" "}
            {new Date(o.createdAt).toLocaleString("en-IN", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-[var(--foreground)]/60">Status:</label>
          <select
            value={o.status}
            disabled={statusMutation.isPending}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            aria-label="Order status"
            className="h-10 px-3 rounded-xl bg-white border border-[var(--foreground)]/15 text-sm font-semibold focus:outline-none focus:border-[var(--accent-brown)]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line items */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--foreground)]/8 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-[var(--foreground)]/50" />
            <h2 className="font-bold text-[var(--foreground)]">Items</h2>
            <span className="text-xs text-[var(--foreground)]/50">
              ({o.items.length} {o.items.length === 1 ? "item" : "items"})
            </span>
          </div>

          <ul className="space-y-3">
            {o.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between py-2 border-b border-[var(--foreground)]/8 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--foreground)] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--foreground)]/50">
                    {item.productId.slice(0, 12)} · qty {item.quantity} × ₹
                    {item.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <p className="font-bold text-[var(--foreground)] ml-3">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-[var(--foreground)]/8 space-y-1.5 text-sm">
            <div className="flex justify-between text-[var(--foreground)]/70">
              <span>Subtotal</span>
              <span>₹{o.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-[var(--foreground)]/70">
              <span>Shipping</span>
              <span>{o.shipping === 0 ? "Free" : `₹${o.shipping.toLocaleString("en-IN")}`}</span>
            </div>
            <div className="flex justify-between font-black text-base pt-2 border-t border-[var(--foreground)]/8 mt-2">
              <span>Total</span>
              <span className="text-[var(--accent-brown)]">
                ₹{o.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[var(--foreground)]/50" />
              <h2 className="font-bold text-[var(--foreground)]">Shipping address</h2>
            </div>
            <div className="text-sm text-[var(--foreground)]/80 space-y-0.5">
              <p className="font-semibold text-[var(--foreground)]">
                {o.customerEmail ?? "—"}
              </p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}, {addr.state} {addr.pincode}
              </p>
              <p>{addr.country ?? "India"}</p>
              <p className="pt-1 text-[var(--foreground)]/60">📞 {addr.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-[var(--foreground)]/50" />
              <h2 className="font-bold text-[var(--foreground)]">Payment</h2>
            </div>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-[var(--foreground)]/60">Razorpay order</dt>
                <dd className="font-mono text-xs truncate max-w-[140px]">
                  {String(o.payment.razorpayOrderId ?? "—")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--foreground)]/60">Payment ID</dt>
                <dd className="font-mono text-xs truncate max-w-[140px]">
                  {String(o.payment.razorpayPaymentId ?? "—")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--foreground)]/60">Signature</dt>
                <dd className="font-mono text-xs">
                  {o.payment.razorpaySignature ? "✓ verified" : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl border border-[var(--foreground)]/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-[var(--foreground)]/50" />
              <h2 className="font-bold text-[var(--foreground)]">Shiprocket</h2>
            </div>
            {o.shippingInfo.awb ? (
              <>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-[var(--foreground)]/60">Courier</dt>
                    <dd className="font-semibold">{o.shippingInfo.courier ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--foreground)]/60">AWB</dt>
                    <dd className="font-mono text-xs">{o.shippingInfo.awb}</dd>
                  </div>
                </dl>
                {o.shippingInfo.trackingUrl && (
                  <a
                    href={o.shippingInfo.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--accent-brown)] hover:underline text-xs font-semibold mt-3"
                  >
                    Track on Shiprocket <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--foreground)]/50">
                No shipment created yet. Will be auto-created once payment is verified.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}