import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOrders } from '@/services/api';
import { formatPrice, getStatusColor } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Package, Loader2 } from 'lucide-react';

export function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => fetchOrders(user?.id),
    enabled: !!user,
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-forest-600" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-forest-800 mb-2">Sign In Required</h2>
          <p className="text-earth-500 mb-6">Please sign in to view your orders</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 text-white py-10">
        <div className="container-custom">
          <h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>My Orders</h1>
        </div>
      </div>

      <div className="container-custom py-8 max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-earth-400 font-mono">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-earth-500">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(order.payment_status)}`}>
                      Payment: {order.payment_status}
                    </span>
                  </div>
                </div>

                {order.order_items && (
                  <div className="space-y-2 mb-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-earth-600">{item.product_name} × {item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.line_total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-earth-100">
                  <span className="text-lg font-bold text-forest-700">{formatPrice(order.total_amount)}</span>
                  <span className="text-xs text-earth-400 capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-earth-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-forest-800 mb-2">No Orders Yet</h3>
            <p className="text-earth-500 mb-6">Start shopping to see your orders here</p>
            <Link to="/shop"><Button>Browse Products</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
