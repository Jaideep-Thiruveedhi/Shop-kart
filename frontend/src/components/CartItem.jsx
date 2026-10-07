import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartItem({ item }) {
  const { product, quantity } = item;
  const { updateQuantity, removeFromCart, isPending } = useCart();

  const productId = product._id;
  const busy = isPending(productId);

  // Buttons reflect live server data: `stock` comes from the populated product,
  // so a price/stock change made after add-to-cart is respected immediately.
  const atMax = quantity >= product.stock;
  const lineTotal = product.price * quantity;

  const change = (next) => {
    if (next < 1 || busy) return; // qty 1 -> use the explicit Remove action
    if (next > product.stock) return;
    updateQuantity(productId, next);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-[20px] border border-[#eef3f9]">
      <Link
        to={`/products/${productId}`}
        className="shrink-0 w-full sm:w-[120px] aspect-square rounded-2xl overflow-hidden bg-[#f4f7fb]"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x300?text=No+Image';
          }}
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#5a8dee]">
              {product.category}
            </p>
            <Link
              to={`/products/${productId}`}
              className="mt-0.5 block text-[15px] font-bold leading-5 text-[#4a5f78] hover:text-[#5a8dee] transition line-clamp-2"
            >
              {product.name}
            </Link>
            <p className="mt-1 text-[13px] text-[#7c9cb6]">
              ₹{product.price.toLocaleString('en-IN')} each
            </p>
          </div>

          <p className="text-[18px] font-extrabold tracking-tight text-[#4a5f78] shrink-0">
            ₹{lineTotal.toLocaleString('en-IN')}
          </p>
        </div>

        {atMax && (
          <p className="mt-2 text-[12px] font-semibold text-amber-600">
            Only {product.stock} in stock — you have the maximum available.
          </p>
        )}

        <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-full border border-[#e6edf5] overflow-hidden">
            <button
              onClick={() => change(quantity - 1)}
              disabled={quantity <= 1 || busy}
              aria-label={`Decrease quantity of ${product.name}`}
              className="w-9 h-9 text-[17px] font-bold text-[#4a5f78] hover:bg-[#f4f7fb] disabled:opacity-35 disabled:cursor-not-allowed transition"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-[42px] text-center text-[14px] font-bold text-[#4a5f78]"
            >
              {busy ? '…' : quantity}
            </span>
            <button
              onClick={() => change(quantity + 1)}
              disabled={atMax || busy}
              aria-label={`Increase quantity of ${product.name}`}
              className="w-9 h-9 text-[17px] font-bold text-[#4a5f78] hover:bg-[#f4f7fb] disabled:opacity-35 disabled:cursor-not-allowed transition"
            >
              +
            </button>
          </div>

          <button
            onClick={() => removeFromCart(productId)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <span className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                Updating…
              </>
            ) : (
              'Remove'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}