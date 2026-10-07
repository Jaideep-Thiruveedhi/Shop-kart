import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useWishlistAction from '../hooks/useWishlistAction';

export default function ProductCard({ product }) {
  const { _id, name, price, category, image, stock } = product;

  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, isPending, quantityOf } = useCart();

  const { saved, saving: wishSaving, error: wishError, setError: setWishError, toggle } =
    useWishlistAction(_id, Boolean(user));

  const [cartError, setCartError] = useState('');
  const cartSaving = isPending(_id);
  const inCart = quantityOf(_id) > 0;

  // Wishlist and cart are protected APIs — send anonymous visitors to login
  // rather than firing a request that can only ever return 401.
  const requireLogin = () => {
    if (user) return true;
    navigate('/login');
    return false;
  };

  const handleAddToCart = async () => {
    if (!requireLogin()) return;
    setCartError('');
    const result = await addToCart(_id);
    if (!result.ok) setCartError(result.message);
  };

  const handleWishlist = () => {
    if (!requireLogin()) return;
    setCartError('');
    toggle();
  };

  const stockLabel =
    stock === 0 ? 'Out of stock' : stock < 10 ? `${stock} units left` : `${stock} in stock`;
  const stockColor = stock === 0 ? 'text-red-500' : stock < 10 ? 'text-amber-600' : 'text-emerald-600';

  const rowError = wishError || cartError;

  return (
    <div className="bg-white rounded-[24px] border border-[#eef3f9] overflow-hidden shadow-sm hover:shadow-[0_12px_30px_rgba(74,95,120,0.12)] hover:-translate-y-1 transition-all flex flex-col">
      {/* Image + wishlist affordance */}
      <div className="relative aspect-[4/3] bg-[#f4f7fb] overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/600x450?text=No+Image';
          }}
        />
        <button
          onClick={handleWishlist}
          disabled={wishSaving}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          title={saved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-[18px] leading-none shadow-sm backdrop-blur transition active:scale-95 disabled:opacity-60 ${
            saved
              ? 'bg-red-50 text-red-500 ring-1 ring-red-200'
              : 'bg-white/90 text-[#8da4be] hover:bg-white'
          }`}
        >
          {wishSaving ? (
            <span className="w-4 h-4 border-2 border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
          ) : saved ? (
            '♥'
          ) : (
            '♡'
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#5a8dee]">{category}</p>
        <h3 className="mt-1 text-[15px] font-bold leading-5 text-[#4a5f78] line-clamp-2 min-h-[40px]">
          {name}
        </h3>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="text-[20px] font-extrabold tracking-tight text-[#4a5f78]">
            ₹{price.toLocaleString('en-IN')}
          </span>
          <span className={`text-[12px] font-semibold ${stockColor}`}>{stockLabel}</span>
        </div>

        {rowError && (
          <p role="alert" className="mt-3 text-[12px] font-semibold text-red-600 leading-snug">
            {rowError}
            <button onClick={() => { setWishError(''); setCartError(''); }} className="ml-2 underline">
              Dismiss
            </button>
          </p>
        )}

        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/products/${_id}`}
            className="inline-flex items-center justify-center rounded-full border border-[#e6edf5] text-[#4a5f78] text-[13px] font-semibold py-3 hover:bg-[#f4f7fb] active:scale-[0.98] transition"
          >
            View Details
          </Link>

          <button
            onClick={handleAddToCart}
            disabled={stock === 0 || cartSaving}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#8da4be] text-white text-[13px] font-semibold py-3 hover:bg-[#7d94ad] active:scale-[0.98] transition shadow-[0_6px_16px_rgba(141,164,190,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {stock === 0 ? (
              'Out of Stock'
            ) : cartSaving ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Adding…
              </>
            ) : inCart ? (
              'Add Another'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>

        {/* Wishlist status line, so the action is not icon-only. */}
        <p className="mt-3 text-[12px] font-semibold text-center">
          {wishSaving ? (
            <span className="text-[#7c9cb6]">Saving…</span>
          ) : saved ? (
            <button onClick={handleWishlist} className="text-red-500 hover:underline">
              ♥ Added to Wishlist
            </button>
          ) : (
            <button onClick={handleWishlist} className="text-[#5a8dee] hover:underline">
              ♡ Add to Wishlist
            </button>
          )}
        </p>
      </div>
    </div>
  );
}