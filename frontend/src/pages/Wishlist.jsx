import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { notifyChanged, seed } from '../lib/wishlistSync';
import WishlistCard from '../components/WishlistCard';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  // Guards against setState after an unmount (React 18+ StrictMode double-mounts
  // effects in dev, so this actually fires during local development).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/wishlist');
      // { success, count, wishlist: [populated products] }
      const list = data.wishlist ?? [];
      if (mounted.current) {
        setItems(list);
        seed(list); // prime the id cache so /products cards render the right state
      }
    } catch (err) {
      if (mounted.current) {
        setError(err.response?.data?.message || 'We could not load your wishlist.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    // Per-item loading state so only the clicked card shows "Removing…".
    setRemovingId(productId);
    const snapshot = items;
    // Optimistic removal, reverted below if the API rejects it. The product
    // genuinely left the wishlist, so we should not force a full reload.
    setItems((prev) => prev.filter((p) => p._id !== productId));
    try {
      await api.delete(`/wishlist/${productId}`);
      notifyChanged();
    } catch (err) {
      if (mounted.current) {
        setItems(snapshot);
        setError(err.response?.data?.message || 'We could not remove that product. Please try again.');
      }
    } finally {
      if (mounted.current) setRemovingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4">
        <div className="bg-white rounded-[32px] border border-[#eef3f9] p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Please log in to see your wishlist</p>
          <p className="mt-1 text-[14px] text-[#7c9cb6]">
            Your wishlist is saved to your account, so it is waiting for you.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[#4a5f78]">My Wishlist</h1>
            <p className="text-[14px] text-[#7c9cb6]">
              {loading
                ? 'Loading your saved products…'
                : `${items.length} product${items.length === 1 ? '' : 's'} saved`}
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
            <p className="mt-4 text-[14px] font-medium text-[#7c9cb6]">
              Loading your wishlist...
            </p>
          </div>
        )}

        {/* ---- ERROR (retry fires a real new request) ---- */}
        {!loading && error && items.length === 0 && (
          <div className="bg-white rounded-[24px] border border-red-200 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Something went wrong.</p>
            <p className="mt-1 text-[14px] text-[#7c9cb6]">We couldn&apos;t load your wishlist.</p>
            {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
            <button
              onClick={fetchWishlist}
              className="mt-6 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ---- EMPTY ---- */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-[24px] border border-[#eef3f9] p-14 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-2xl">
              ❤️
            </div>
            <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">Your wishlist is empty</p>
            <p className="mt-1 text-[14px] text-[#7c9cb6] max-w-sm mx-auto">
              Save products you love and find them here later.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* ---- SUCCESS ---- */}
        {!loading && items.length > 0 && (
          <>
            {/* Inline error banner when a removal fails but the list still renders. */}
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-[13px] font-semibold text-red-700">
                {error}
                <button onClick={fetchWishlist} className="ml-3 underline">
                  Try Again
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((product) => (
                <WishlistCard
                  key={product._id}
                  product={product}
                  removing={removingId === product._id}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}