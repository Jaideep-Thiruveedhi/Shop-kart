import { Link } from 'react-router-dom';

export default function WishlistCard({ product, removing, onRemove }) {
  const { _id, name, price, category, image, stock } = product;

  const stockLabel =
    stock === 0 ? 'Out of stock' : stock < 10 ? `${stock} units left` : `${stock} in stock`;
  const stockColor =
    stock === 0 ? 'text-red-500' : stock < 10 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="bg-white rounded-[24px] border border-[#eef3f9] overflow-hidden shadow-sm hover:shadow-[0_12px_30px_rgba(74,95,120,0.12)] hover:-translate-y-1 transition-all flex flex-col">
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
        {/* Server-side reference: out-of-stock saves stay saved, we just flag them. */}
        {stock === 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-red-600 shadow-sm">
            Out of stock
          </span>
        )}
      </div>

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

        <div className="mt-4 space-y-2">
          <Link
            to={`/products/${_id}`}
            className="inline-flex items-center justify-center w-full rounded-full bg-[#8da4be] text-white text-[14px] font-semibold py-3 hover:bg-[#7d94ad] active:scale-[0.98] transition shadow-[0_6px_16px_rgba(141,164,190,0.3)]"
          >
            View Details
          </Link>

          <button
            onClick={() => onRemove(_id)}
            disabled={removing}
            aria-label={`Remove ${name} from wishlist`}
            className="inline-flex items-center justify-center gap-2 w-full rounded-full border border-red-200 text-red-600 text-[14px] font-semibold py-3 hover:bg-red-50 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removing ? (
              <>
                <span className="w-3 h-3 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                Removing…
              </>
            ) : (
              'Remove ♥'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}