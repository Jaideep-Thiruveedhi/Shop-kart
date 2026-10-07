import { Link } from 'react-router-dom';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatus';
import { formatDate } from '../lib/format';

export default function OrderCard({ order }) {
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-[24px] border border-[#eef3f9] p-5 hover:shadow-[0_12px_30px_rgba(74,95,120,0.1)] transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#7c9cb6]">Order</p>
          <p className="mt-0.5 font-mono text-[15px] font-bold text-[#4a5f78]">
            #{order._id.slice(-8).toUpperCase()}
          </p>
          <p className="mt-0.5 text-[13px] text-[#7c9cb6]">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge paymentStatus={order.paymentStatus} />
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-[#eef3f9] pt-4">
        {order.items.map((item, index) => (
          <li key={`${order._id}-${index}`} className="flex items-center justify-between gap-3 text-[14px]">
            <span className="flex items-center gap-3 min-w-0">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#f4f7fb]"
                />
              )}
              <span className="truncate text-[#4a5f78]">
                {item.name} <span className="text-[#7c9cb6]">× {item.quantity}</span>
              </span>
            </span>
            <span className="font-semibold text-[#4a5f78] shrink-0">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t border-[#eef3f9] flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#7c9cb6]">
          {order.items.length} product{order.items.length === 1 ? '' : 's'} · {totalUnits} unit
          {totalUnits === 1 ? '' : 's'}
        </p>
        <p className="text-[20px] font-extrabold tracking-tight text-[#4a5f78]">
          ₹{order.totalAmount.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="mt-4">
        <Link
          to={`/orders/${order._id}`}
          className="inline-flex items-center justify-center rounded-full border border-[#e6edf5] px-5 py-2.5 text-[13px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}