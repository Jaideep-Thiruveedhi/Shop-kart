import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/products/${id}`);
        if (!cancelled) setProduct(data.product ?? data);
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status;
          if (status === 404) setError('Product not found.');
          else if (status === 400) setError('Invalid product ID.');
          else setError(err.response?.data?.message || 'Something went wrong while loading product.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4">
        <div className="bg-white rounded-[24px] border border-[#eef3f9] px-10 py-14 text-center">
          <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[14px] font-medium text-[#7c9cb6]">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-[32px] shadow-sm border border-[#eef3f9] p-8 text-center max-w-md w-full">
          <p className="text-[16px] font-bold text-red-600">{error}</p>
          <Link to="/products" className="inline-flex mt-4 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition">Back to Products</Link>
        </div>
      </div>
    );
  }

  const { name, description, price, category, image, stock } = product;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Link to="/products" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#5a8dee] hover:underline mb-6">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to products
        </Link>

        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(74,95,120,0.12)] border border-white overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="bg-[#f4f7fb] p-6 lg:p-8 flex items-center justify-center">
            <img
              src={image}
              alt={name}
              className="w-full max-h-[520px] object-contain rounded-2xl bg-white"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x800?text=No+Image'; }}
            />
          </div>

          {/* Details */}
          <div className="p-8 lg:p-10 flex flex-col">
            <span className="inline-flex w-fit rounded-full bg-[#eef3ff] text-[#5a8dee] px-3 py-1 text-[11px] font-bold tracking-widest uppercase">{category}</span>
            <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#4a5f78]">{name}</h1>
            <p className="mt-3 text-[14px] leading-6 text-[#7c9cb6]">{description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-[32px] font-extrabold tracking-tight text-[#4a5f78]">₹{price.toLocaleString('en-IN')}</span>
              <span className={`text-[13px] font-semibold px-3 py-1 rounded-full ${stock === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {stock === 0 ? 'Out of stock' : `${stock} units left`}
              </span>
            </div>

            <button
              // UI only — cart in Lab 04
              className="mt-8 w-full rounded-full bg-[#8da4be] text-white font-semibold py-4 shadow-[0_8px_20px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={stock === 0}
              onClick={() => alert('Cart coming in Lab 04 🛒')}
            >
              {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <p className="mt-3 text-center text-[12px] text-[#7c9cb6]">Fetched via <code className="bg-[#f4f7fb] px-1.5 py-0.5 rounded border border-[#eef3f9]">GET /products/:id</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
