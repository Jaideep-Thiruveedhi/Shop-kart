export default function SearchBar({ search, onSearchChange, category, onCategoryChange, categories, sort, onSortChange }) {
  return (
    <div className="bg-white rounded-[24px] border border-[#eef3f9] p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row gap-3 lg:items-center">
      {/* Search input */}
      <div className="flex-1 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7c9cb6] pointer-events-none">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-full bg-[#f4f7fb] border border-[#e6eef7] pl-11 pr-5 py-3.5 text-[14px] text-[#4a5f78] placeholder:text-[#7c9cb6]/60 focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 focus:border-[#5a8dee]/40 transition"
        />
      </div>

      {/* Category */}
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-full bg-[#f4f7fb] border border-[#e6eef7] px-5 py-3.5 text-[14px] font-medium text-[#4a5f78] focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 focus:border-[#5a8dee]/40 transition lg:min-w-[180px]"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Bonus: sort */}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded-full bg-[#f4f7fb] border border-[#e6eef7] px-5 py-3.5 text-[14px] font-medium text-[#4a5f78] focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 focus:border-[#5a8dee]/40 transition lg:min-w-[160px]"
        title="Bonus: sort by price"
      >
        <option value="">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
}
