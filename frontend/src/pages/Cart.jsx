import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';

export default function Cart() {
  const { user } = useAuth();
  const { cartItems, loading, error, refreshCart, subtotal, totalUnits } = useCart();

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4">
        <div className="bg-white rounded-[32px] border border-[#eef3f9] p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Please log in to see your cart</p>
          <Link
            to="/login"
            className="mt-6 inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
          >
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[#4a5f78]">My Cart</h1>
            <p className="text-[14px] text-[#7c9cb6]">
              {loading ? 'Loading your cart…' : `${totalUnits} unit${totalUnits === 1 ? '' : 's'} · ₹${subtotal.toLocaleString('en-IN')}`}
            </p>
          </div>
          <Link
            to="/products"
            className="text-[13px] font-semibold text-[#5a8dee] hover:underline self-start sm:self-auto"
          >
            Continue Shopping →
          </Link>
        </div>

        {/* ---- LOADING ---- */}
        {loading && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
            <p className="mt-4 text-[14px] font-medium text-[#7c9cb6]">Loading your cart...</p>
          </div>
        )}

        {/* ---- ERROR ---- */}
        {!loading && error && cartItems.length === 0 && (
          <div className="bg-white rounded-[24px] border border-red-200 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Something went wrong.</p>
            <p className="mt-1 text-[14px] text-[#7c9cb6]">Unable to load your cart.</p>
            {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
            <button
              onClick={refreshCart}
              className="mt-6 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ---- EMPTY ---- */}
        {!loading && !error && cartItems.length === 0 && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] p-14 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">
              🛒
            </div>
            <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Your cart is empty</p>
            <p className="mt-1 text-[14px] text-[#7c9cb6]">Looks like you haven&apos;t added anything yet.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* ---- SUCCESS ---- */}
        {!loading && cartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-[13px] font-semibold text-red-700"
                >
                  {error}
                </div>
              )}

              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/wishlist"
                  className="rounded-full border border-[#e6edf5] px-5 py-2.5 text-[13px] font-semibold text-[#4a5f78] hover:bg-white transition"
                >
                  View Wishlist
                </Link>
                <Link
                  to="/products"
                  className="rounded-full border border-[#e6edf5] px-5 py-2.5 text-[13px] font-semibold text-[#4a5f78] hover:bg-white transition"
                >
                  Add More Products
                </Link>
              </div>
            </div>

            <OrderSummary />
          </div>
        )}
      </div>
    </div>
  );
}