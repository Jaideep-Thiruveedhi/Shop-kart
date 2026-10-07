import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { loadRazorpayScript } from '../lib/razorpay';
import CheckoutForm from '../components/CheckoutForm';
import OrderSummary from '../components/OrderSummary';

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, loading, clearCart } = useCart();

  // Two distinct in-flight phases so the button label tells the truth about
  // which step is running: (1) creating the order, (2) verifying the payment.
  const [phase, setPhase] = useState('idle'); // idle | creating | verifying
  const [error, setError] = useState('');

  // Guards against a double submit creating two payment orders.
  const busyRef = useRef(false);

  if (!user) {
    return (
      <Shell title="Checkout">
        <Notice
          icon="🔒"
          title="Please log in to check out"
          body="Your cart is tied to your account."
        >
          <Link to="/login" className={btnPrimary}>
            Log in
          </Link>
        </Notice>
      </Shell>
    );
  }

  // Direct navigation to /checkout with an empty cart (Lab 06 edge case).
  if (!loading && cartItems.length === 0) {
    return (
      <Shell title="Checkout">
        <Notice icon="🛒" title="Your cart is empty" body="Add something before checking out.">
          <Link to="/products" className={btnPrimary}>
            Browse Products
          </Link>
        </Notice>
      </Shell>
    );
  }

  /**
   * Step 2 of the flow: Razorpay's handler gave us payment details.
   * The handler firing PROVES NOTHING — anyone can POST a fake success. The
   * only real proof is the HMAC signature, which the backend checks with the
   * Key Secret. So we forward the ids and let the server decide.
   */
  const handlePaymentResponse = async (response, shopKartOrderId) => {
    setPhase('verifying');
    setError('');
    try {
      const { data } = await api.post('/orders/verify-payment', {
        shopKartOrderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      // The backend has cleared the persisted cart. Mirror that in global
      // state immediately so the Navbar reads Cart (0) with no page refresh.
      clearCart();
      navigate(`/order-success/${data.order._id}`, { replace: true });
    } catch (err) {
      // Signature failed / order still unpaid -> cart is deliberately intact.
      setPhase('idle');
      setError(
        err.response?.data?.message ||
          'We could not verify your payment. Your cart has been saved — please try again.',
      );
    } finally {
      busyRef.current = false;
    }
  };

  const handlePlaceOrder = async (shippingAddress) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError('');

    // ---- Step 1: server validates cart + live stock + live prices, snapshots
    // the order and creates the Razorpay order. It does NOT clear the cart.
    try {
      setPhase('creating');
      const { data } = await api.post('/orders/create-payment-order', { shippingAddress });

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        setError('Could not load the Razorpay checkout. Check your network and try again.');
        setPhase('idle');
        busyRef.current = false;
        return;
      }

      setPhase('idle'); // modal is about to take over the screen
      const prefill = shippingAddress;

      const paymentObject = new window.Razorpay({
        key: data.key, // Key ID only — the Key Secret never leaves the backend
        amount: data.amount, // already in paise, calculated server-side
        currency: data.currency,
        name: 'ShopKart',
        description: `Order #${data.shopKartOrderId.slice(-6).toUpperCase()}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: prefill.fullName,
          contact: prefill.phone,
        },
        notes: { shippingAddress: `${prefill.addressLine1}, ${prefill.city}` },
        theme: { color: '#8da4be' },
        handler: (response) => handlePaymentResponse(response, data.shopKartOrderId),
        modal: {
          // Closing the modal abandons the payment. Say so plainly rather than
          // leaving the customer wondering, and keep the cart intact.
          ondismiss: () => {
            setPhase('idle');
            busyRef.current = false;
            setError('Payment was cancelled. Your cart has been saved.');
          },
        },
      });

      paymentObject.on('payment.failed', (response) => {
        setPhase('idle');
        busyRef.current = false;
        setError(
          response?.error?.description ||
            'Payment failed. Your cart has not been cleared. Please try again.',
        );
      });

      paymentObject.open();
    } catch (err) {
      setPhase('idle');
      busyRef.current = false;
      setError(
        err.response?.data?.message || 'Could not start the payment. Please try again.',
      );
    }
  };

  const submitting = phase !== 'idle';

  return (
    <Shell title="Checkout">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[14px] font-semibold text-red-700"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-[24px] border border-[#eef3f9] flex items-center justify-center py-20">
              <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
            </div>
          ) : (
            <CheckoutForm onSubmit={handlePlaceOrder} submitting={submitting} />
          )}

          <p className="text-[12px] text-[#7c9cb6] leading-relaxed">
            <strong className="font-bold">How payment works:</strong> we create the order on our
            server, Razorpay handles the payment in Test Mode, then our server verifies the
            signature before your cart is cleared. Totals shown here are re-checked against live
            prices at checkout.
          </p>
        </div>

        <OrderSummary showItems />
      </div>
    </Shell>
  );
}

function Shell({ title, children }) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5a8dee] hover:underline"
          >
            ← Back to Cart
          </Link>
          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-[#4a5f78]">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function Notice({ icon, title, body, children }) {
  return (
    <div className="bg-white rounded-[24px] border border-[#eef3f9] p-14 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">
        {icon}
      </div>
      <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">{title}</p>
      <p className="mt-1 text-[14px] text-[#7c9cb6]">{body}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const btnPrimary =
  'inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition';