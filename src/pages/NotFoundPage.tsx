import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center py-20">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-[120px] leading-none font-bold text-forest-200 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          404
        </div>
        <h1 className="text-2xl font-bold text-forest-900 mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          Page Not Found
        </h1>
        <p className="text-earth-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button size="lg">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" size="lg">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
