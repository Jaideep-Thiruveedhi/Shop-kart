import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { OrderStatusBadge } from '../components/OrderStatus';
import { formatDate } from '../lib/format';
import { useCart } from '../context/CartContext';

export default function OrderSuccess() {
  const { id } = useParams();
  const { cartItems } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        if (!cancelled) setOrder(data.order);
      } catch {
        // The order is already confirmed; a failed re-read must not turn the
        // success screen into an error page. We simply show less detail.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[32px] border border-[#eef3f9] p-8 sm:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-4xl">
            âœ…
          </div>

          <h1 className="mt-5 text-[24px] font-extrabold tracking-tight text-[#4a5f78]">
            Order Placed Successfully
          </h1>
          <p className="mt-2 text-[14px] text-[#7c9cb6]">
            Payment verified and your order has been saved.
          </p>

          <div className="mt-7 space-y-3 text-left">
            <Row label="Order ID" value={<span className="font-mono">#{id.slice(-10).toUpperCase()}</span>} />
            {order && <Row label="Placed on" value={formatDate(order.createdAt)} />}
            {order && <Row label="Total" value={`â‚¹${order.totalAmount.toLocaleString('en-IN')}`} bold />}
            {order && (
              <Row label="Status" value={<OrderStatusBadge status={order.status} />} />
            )}
            {order?.razorpayPaymentId && (
              <Row
                label="Payment ID"
                value={<span className="font-mono text-[12px]">{order.razorpayPaymentId}</span>}
              />
            )}
          </div>

          {/* Proves the cart was cleared in BOTH places without a refresh. */}
          {cartItems.length === 0 && (
            <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
              Your cart has been cleared â€” see the Navbar count drop to Cart (0).
            </p>
          )}

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/orders"
              className="inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              View My Orders
            </Link>
            <Link
              to={`/orders/${id}`}
              className="inline-flex rounded-full border border-[#e6edf5] px-6 py-2.5 text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition"
            >
              Order Details
            </Link>
            <Link
              to="/products"
              className="inline-flex rounded-full border border-[#e6edf5] px-6 py-2.5 text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition"
            >
              Continue Shopping
            </Link>
          </div>

          {loading && (
            <p className="mt-5 text-[12px] text-[#7c9cb6]">Loading order summaryâ€¦</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[#eef3f9] last:border-0">
      <span className="text-[13px] text-[#7c9cb6]">{label}</span>
      <span className={`text-[14px] text-[#4a5f78] ${bold ? 'font-extrabold text-[16px]' : 'font-semibold'}`}>
        {value}
      </span>
    </div>
  );
}