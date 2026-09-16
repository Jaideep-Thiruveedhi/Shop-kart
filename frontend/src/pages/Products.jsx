import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

const CATEGORIES = ['Electronics', 'Fashion', 'Books', 'Home'];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const { data } = await api.get('/products', { params });
      // rubric response: { success, count, products }
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  // Debounce search by 350ms to avoid flood; category/sort fire immediately
  useEffect(() => {
    const t = setTimeout(fetchProducts, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[#4a5f78]">Products</h1>
            <p className="text-[14px] text-[#7c9cb6]">Browse our catalog — data from <code className="bg-white px-1.5 py-0.5 rounded border border-[#eef3f9]">GET /products</code></p>
          </div>
          <span className="text-[13px] font-semibold text-[#7c9cb6] bg-white border border-[#eef3f9] rounded-full px-4 py-1.5 self-start sm:self-auto">
            {loading ? 'Loading…' : `${products.length} products`}
          </span>
        </div>

        <SearchBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          categories={CATEGORIES}
          sort={sort}
          onSortChange={setSort}
        />

        {/* States */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] border border-[#eef3f9]">
              <div className="w-10 h-10 border-[3px] border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin" />
              <p className="mt-4 text-[14px] font-medium text-[#7c9cb6]">Loading products...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-[24px] border border-red-200 p-10 text-center">
              <p className="text-[15px] font-semibold text-red-600">Something went wrong while loading products.</p>
              <p className="mt-1 text-[13px] text-[#7c9cb6]">{error}</p>
              <button onClick={fetchProducts} className="mt-4 rounded-full bg-[#8da4be] text-white px-6 py-2.5 text-[14px] font-semibold hover:bg-[#7d94ad] transition">Retry</button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-[#eef3f9] p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f4f7fb] flex items-center justify-center mx-auto text-2xl">🛍️</div>
              <p className="mt-4 text-[16px] font-bold text-[#4a5f78]">No products found.</p>
              <p className="mt-1 text-[14px] text-[#7c9cb6]">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
