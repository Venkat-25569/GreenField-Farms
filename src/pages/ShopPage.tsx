import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { fetchProducts, fetchCategories } from '@/services/api';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'shop', search, sortBy],
    queryFn: () => fetchProducts({ search: search || undefined, sortBy }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(search ? { search, sort: sortBy } : { sort: sortBy });
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-forest-800 text-white py-12">
        <div className="container-custom">
          <h1 className="heading-lg text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            All Products
          </h1>
          <p className="text-forest-200">Browse our complete collection of farm products</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-earth-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchParams({ sort: sortBy }); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-earth-400" />
                </button>
              )}
            </div>
            <Button type="submit">Search</Button>
          </form>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
            ]}
            className="w-full sm:w-48"
          />
        </div>

        {/* Category Quick Links */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link to="/shop">
            <Button variant="secondary" size="sm" className="rounded-full">All</Button>
          </Link>
          {categories?.map((cat) => (
            <Link key={cat.slug} to={`/category/${cat.slug}`}>
              <Button variant="ghost" size="sm" className="rounded-full border border-earth-200">
                {cat.name}
              </Button>
            </Link>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🔍</p>
            <h3 className="text-xl font-semibold text-forest-800 mb-2">No products found</h3>
            <p className="text-earth-500 mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => { setSearch(''); setSearchParams({}); }}>Clear Search</Button>
          </div>
        )}
      </div>
    </div>
  );
}
