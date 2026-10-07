import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Shared by /cart and /checkout so both screens present identical totals.
// Every figure here is DERIVED from cartItems on render — nothing is persisted,
// so the summary can never disagree with the cart state behind it.
export default function OrderSummary({ showItems = false, ctaLabel, onCta, ctaDisabled, ctaLoading }) {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalUnits, loading } = useCart();

  const handleCta = () => {
    if (ctaLabel) onCta?.();
    else navigate('/checkout');
  };

  return (
    <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6 lg:sticky lg:top-[88px]">
      <h2 className="text-[18px] font-bold tracking-tight text-[#4a5f78]">Order Summary</h2>

      <dl className="mt-5 space-y-3 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-[#7c9cb6]">
            Items ({cartItems.length} product{cartItems.length === 1 ? '' : 's'})
          </dt>
          <dd className="font-semibold text-[#4a5f78]">{totalUnits} unit{totalUnits === 1 ? '' : 's'}</dd>
        </div>

        {showItems && cartItems.length > 0 && (
          <div className="pt-3 border-t border-[#eef3f9] space-y-2">
            {cartItems.map((item) => (
              <div key={item.product._id} className="flex justify-between gap-3 text-[13px]">
                <dt className="text-[#7c9cb6] truncate">
                  {item.product.name} × {item.quantity}
                </dt>
                <dd className="font-semibold text-[#4a5f78] shrink-0">
                  ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                </dd>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-3 border-t border-[#eef3f9]">
          <dt className="text-[#7c9cb6]">Subtotal</dt>
          <dd className="font-semibold text-[#4a5f78]">₹{subtotal.toLocaleString('en-IN')}</dd>
        </div>
      </dl>

      <div className="mt-5 pt-5 border-t border-[#eef3f9] flex items-baseline justify-between">
        <span className="text-[15px] font-bold text-[#4a5f78]">Total</span>
        <span className="text-[24px] font-extrabold tracking-tight text-[#4a5f78]">
          ₹{subtotal.toLocaleString('en-IN')}
        </span>
      </div>

      <p className="mt-2 text-[12px] text-[#7c9cb6]">
        Taxes and shipping are included. Final amount is re-validated by the server at checkout.
      </p>

      <button
        onClick={handleCta}
        disabled={loading || ctaDisabled || cartItems.length === 0}
        className="mt-5 w-full rounded-full bg-[#8da4be] text-white text-[15px] font-semibold py-3.5 shadow-[0_8px_20px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {ctaLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Processing…
          </span>
        ) : (
          (ctaLabel ?? 'Proceed to Checkout')
        )}
      </button>
    </div>
  );
}