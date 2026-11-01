import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { fetchProducts } from '@/services/api';
import { categories as defaultCategories } from '@/config/site';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const category = defaultCategories.find((c) => c.slug === slug);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'category', slug, search, sortBy],
    queryFn: () => fetchProducts({ categorySlug: slug, search: search || undefined, sortBy }),
  });

  const categoryInfo: Record<string, { title: string; desc: string; emoji: string; color: string }> = {
    'cocks-chickens': {
      title: 'Cocks & Chickens',
      desc: 'Browse our premium poultry selection. Each bird is healthy, well-maintained, and comes with breed and health details.',
      emoji: '🐔',
      color: 'from-amber-700 to-amber-900',
    },
    'buffaloes-livestock': {
      title: 'Buffaloes & Livestock',
      desc: 'Premium livestock catalog with detailed information about breed, health, milk yield, and more.',
      emoji: '🐃',
      color: 'from-earth-700 to-earth-900',
    },
    'fresh-milk-dairy': {
      title: 'Fresh Milk & Dairy',
      desc: 'Farm-fresh dairy products delivered to your doorstep. Milk, ghee, paneer, curd, and more.',
      emoji: '🥛',
      color: 'from-blue-700 to-blue-900',
    },
    'farming-goods': {
      title: 'Farming Goods & Supplies',
      desc: 'Essential agricultural supplies, animal feed, farming tools, and equipment.',
      emoji: '🌾',
      color: 'from-forest-700 to-forest-900',
    },
  };

  const info = categoryInfo[slug || ''] || { title: 'Products', desc: '', emoji: '📦', color: 'from-forest-700 to-forest-900' };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Category Header */}
      <div className={`bg-gradient-to-br ${info.color} text-white py-16`}>
        <div className="container-custom">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{info.title}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{info.emoji}</span>
            <div>
              <h1 className="heading-lg text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                {info.title}
              </h1>
              <p className="text-white/70 max-w-2xl">{info.desc}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${info.title}...`}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-earth-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-earth-400" />
              </button>
            )}
          </div>
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

        {/* Results count */}
        {products && (
          <p className="text-sm text-earth-500 mb-6">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
        )}

        {/* Products */}
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">{info.emoji}</p>
            <h3 className="text-xl font-semibold text-forest-800 mb-2">No products found</h3>
            <p className="text-earth-500 mb-6">
              {search ? 'Try adjusting your search' : 'Products will appear here when added by the admin'}
            </p>
            {search && <Button onClick={() => setSearch('')}>Clear Search</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
