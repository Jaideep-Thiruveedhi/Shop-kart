import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ensureLoaded, peek, subscribe, reset as resetWishlist } from '../lib/wishlistSync';
import api from '../services/api';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cart count comes from CartContext, which is already hydrated from GET /cart.
  // The Navbar deliberately does NOT fetch the cart itself — one shared source of
  // truth is the whole point of Lab 05.
  const { totalUnits, loading: cartLoading } = useCart();

  // Wishlist count is read from the backend on demand (see lib/wishlistSync.js).
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (!user) {
      resetWishlist();
      setWishlistCount(0);
      return;
    }

    let cancelled = false;
    const load = () => {
      ensureLoaded().then(() => {
        if (!cancelled) setWishlistCount(peek().length);
      });
    };

    load();
    const unsubscribe = subscribe(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user, location.pathname]);

  const handleLogout = async () => {
    try {
      // Backend clears the HttpOnly cookie; must send credentials
      await api.post('/customers/logout');
    } catch {
      // even if the API fails, clear client state
    } finally {
      setUser(null);
      resetWishlist();
      navigate('/login', { replace: true });
    }
  };

  const linkClass = (path) => {
    const active = location.pathname === path || location.pathname.startsWith(`${path}/`);
    return `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold transition ${
      active ? 'bg-[#f4f7fb] text-[#5a8dee]' : 'text-[#4a5f78] hover:bg-[#f4f7fb]'
    }`;
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#eef3f9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
        <Link to={user ? '/home' : '/login'} className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#5a8dee] flex items-center justify-center text-white font-bold text-[13px] shadow-sm">
            SK
          </div>
          <span className="hidden sm:inline text-[18px] font-bold tracking-tight text-[#4a5f78]">
            ShopKart
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {!user ? (
            <>
              <Link to="/products" className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition">
                Products
              </Link>
              <Link to="/login" className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition">
                Login
              </Link>
              <Link to="/register" className="inline-flex px-6 py-2.5 rounded-full bg-[#8da4be] text-white text-[14px] font-semibold shadow-[0_6px_18px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] transition">
                Create Account
              </Link>
            </>
          ) : (
            <>
              <span className="hidden lg:inline text-[14px] text-[#7c9cb6] mr-2 truncate max-w-[160px]">
                {user.email}
              </span>

              <Link to="/home" className={`${linkClass('/home')} hidden md:inline-flex`}>
                Home
              </Link>
              <Link to="/products" className={linkClass('/products')}>
                Products
              </Link>

              <Link to="/wishlist" className={linkClass('/wishlist')}>
                <span aria-hidden>♡</span>
                <span className="hidden sm:inline">Wishlist</span>
                <Badge count={wishlistCount} />
              </Link>

              <Link to="/cart" className={linkClass('/cart')}>
                <span aria-hidden>🛒</span>
                <span className="hidden sm:inline">Cart</span>
                {/* totalUnits = sum of quantities, i.e. Cart (3) for kbd×2 + mouse×1 */}
                <Badge count={totalUnits} loading={cartLoading} />
              </Link>

              <Link to="/orders" className={`${linkClass('/orders')} hidden md:inline-flex`}>
                Orders
              </Link>

              <button
                onClick={handleLogout}
                className="ml-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8da4be] text-white text-[14px] font-semibold hover:bg-[#7d94ad] active:scale-[0.98] transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Declared at module scope: a component defined inside render would be
// unmounted and recreated on every Navbar render.
function Badge({ count, loading }) {
  if (count <= 0) return null;
  return (
    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#5a8dee] text-white text-[11px] font-bold flex items-center justify-center">
      {loading ? '…' : count}
    </span>
  );
}