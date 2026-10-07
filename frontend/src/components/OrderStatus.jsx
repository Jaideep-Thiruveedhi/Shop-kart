const STATUS_STYLES = {
  PENDING_PAYMENT: { label: 'Payment pending', className: 'bg-amber-50 text-amber-700' },
  PLACED: { label: 'Placed', className: 'bg-[#eef3ff] text-[#5a8dee]' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-violet-50 text-violet-700' },
  SHIPPED: { label: 'Shipped', className: 'bg-cyan-50 text-cyan-700' },
  DELIVERED: { label: 'Delivered', className: 'bg-emerald-50 text-emerald-700' },
};

const PAYMENT_STYLES = {
  PENDING: { label: 'Payment pending', className: 'bg-amber-50 text-amber-700' },
  PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Payment failed', className: 'bg-red-50 text-red-600' },
};

export function OrderStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? {
    label: status ?? 'Unknown',
    className: 'bg-[#f4f7fb] text-[#7c9cb6]',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${style.className}`}>
      {style.label}
    </span>
  );
}

export function PaymentStatusBadge({ paymentStatus }) {
  const style = PAYMENT_STYLES[paymentStatus] ?? {
    label: paymentStatus ?? 'Unknown',
    className: 'bg-[#f4f7fb] text-[#7c9cb6]',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${style.className}`}>
      {style.label}
    </span>
  );
}

export default OrderStatusBadge;