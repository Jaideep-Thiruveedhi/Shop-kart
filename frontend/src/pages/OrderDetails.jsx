import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatus';
import { formatDate } from '../lib/format';

export default function OrderDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/${id}`);
      // Ownership is enforced server-side: another user's order id returns 404,
      // so the client never has to guess whether it is allowed to render this.
      if (mounted.current) setOrder(data.order);
    } catch (err) {
      if (mounted.current) {
        const status = err.response?.status;
        setError(
          status === 404
            ? 'Order not found.'
            : err.response?.data?.message || 'We could not load this order.',
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const shell = (children) => (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5a8dee] hover:underline mb-6"
        >
          â† Back to My Orders
        </Link>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="bg-white rounded-[24px] border border-[#eef3f9] flex items-center justify-center py-20">
        <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
      </div>,
    );
  }

  if (error) {
    return shell(
      <div className="bg-white rounded-[24px] border border-red-200 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-2xl">
          âš ï¸
        </div>
        <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">{error}</p>
        <button
          onClick={fetchOrder}
          className="mt-6 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
        >
          Try Again
        </button>
      </div>,
    );
  }

  if (!order) return shell(null);

  const { fullName, phone, addressLine1, city, state, pincode } = order.shippingAddress ?? {};

  return shell(
    <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#7c9cb6]">Order</p>
          <p className="mt-0.5 font-mono text-[18px] font-bold text-[#4a5f78]">
            #{order._id.slice(-10).toUpperCase()}
          </p>
          <p className="mt-1 text-[13px] text-[#7c9cb6]">Placed on {formatDate(order.createdAt)}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge paymentStatus={order.paymentStatus} />
          </div>

          {order.paymentStatus === 'PENDING' && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-700">
              This order is awaiting payment. Your cart was not cleared.
            </p>
          )}
          {order.failureReason && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700">
              {order.failureReason}
            </p>
          )}
        </div>

        {/* Items â€” NOTE: prices come from the order SNAPSHOT, not the live
            Product. A later price change must not rewrite purchase history. */}
        <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6">
          <h2 className="text-[16px] font-bold text-[#4a5f78]">
            Items ({order.items.length})
          </h2>

          <ul className="mt-4 space-y-3">
            {order.items.map((item, index) => (
              <li
                key={`${order._id}-${index}`}
                className="flex items-center justify-between gap-4 pb-3 border-b border-[#eef3f9] last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.image && (
                    <Link
                      to={`/products/${item.product}`}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#f4f7fb]"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  )}
                  <div className="min-w-0">
                    <Link
                      to={`/products/${item.product}`}
                      className="block text-[14px] font-bold text-[#4a5f78] hover:text-[#5a8dee] transition truncate"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[13px] text-[#7c9cb6]">
                      â‚¹{item.price.toLocaleString('en-IN')} Ã— {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-[15px] font-bold text-[#4a5f78] shrink-0">
                  â‚¹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-5 border-t border-[#eef3f9] flex items-baseline justify-between">
            <span className="text-[15px] font-bold text-[#4a5f78]">Total Amount</span>
            <span className="text-[24px] font-extrabold tracking-tight text-[#4a5f78]">
              â‚¹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6">
          <h2 className="text-[16px] font-bold text-[#4a5f78]">Shipping Address</h2>
          <address className="mt-3 text-[14px] not-italic leading-relaxed text-[#7c9cb6]">
            <span className="font-bold text-[#4a5f78]">{fullName}</span>
            <br />
            {addressLine1}
            <br />
            {city}, {state} â€” {pincode}
            <br />
            <span className="text-[#4a5f78]">{phone}</span>
          </address>
        </div>

        {order.razorpayPaymentId && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6">
            <h2 className="text-[16px] font-bold text-[#4a5f78]">Payment Reference</h2>
            <p className="mt-3 text-[13px] text-[#7c9cb6]">
              Razorpay order: <span className="font-mono">{order.razorpayOrderId}</span>
              <br />
              Payment: <span className="font-mono">{order.razorpayPaymentId}</span>
            </p>
            <p className="mt-2 text-[12px] text-[#7c9cb6]">
              Only payment identifiers are stored. No card numbers or CVVs ever touch our
              database.
            </p>
          </div>
        )}

        {/* BONUS â€” dev-only status progression, mirrors PATCH /orders/:id/status */}
        {order.paymentStatus === 'PAID' && order.status !== 'DELIVERED' && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6">
            <h2 className="text-[16px] font-bold text-[#4a5f78]">Advance Status (demo)</h2>
            <p className="mt-1 text-[12px] text-[#7c9cb6]">
              Development helper for the fulfilment flow. A real app would restrict this to an
              admin role.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['CONFIRMED', 'SHIPPED', 'DELIVERED'].map((next) => (
                <button
                  key={next}
                  onClick={async () => {
                    try {
                      await api.patch(`/orders/${order._id}/status`, { status: next });
                      fetchOrder();
                    } catch {
                      /* surfaced by the badge staying unchanged */
                    }
                  }}
                  className="rounded-full border border-[#e6edf5] px-4 py-2 text-[12px] font-bold text-[#4a5f78] hover:bg-[#f4f7fb] transition"
                >
                  Mark {next.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <Link
          to="/products"
          className="inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
        >
          Continue Shopping
        </Link>
    </div>,
  );
}