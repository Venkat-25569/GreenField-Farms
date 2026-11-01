import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, ShoppingCart, MessageSquare, BarChart3,
  Plus, Edit, Trash2, Eye, AlertTriangle, RefreshCw,
  Users, Loader2, Settings, Search, Upload, RotateCcw,
  CheckCircle2, Check, Phone, Mail, MessageCircle, Clock, User, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductForm } from '@/components/admin/ProductForm';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminGetDashboardStats, adminFetchProducts, adminFetchOrders,
  adminFetchEnquiries, adminUpdateOrderStatus, adminUpdatePaymentStatus,
  adminUpdateEnquiryStatus, adminDeleteEnquiry, adminDeleteProduct,
  adminPermanentlyDeleteProduct, adminPurgeDemoProducts, adminCreateProduct,
  adminUpdateProduct, adminReactivateProduct, adminQuickUpdateStock,
  adminRestoreProductStock, uploadProductImage, adminSaveProductImage,
  adminDeleteProductImage, type AdminProductFilter,
} from '@/services/api';
import { formatPrice, getStatusColor, getWhatsAppLink } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/types';

type Tab = 'overview' | 'products' | 'orders' | 'enquiries' | 'settings';

export function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (tabFromUrl && ['overview', 'products', 'orders', 'enquiries', 'settings'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'overview';
  });

  useEffect(() => {
    if (tabFromUrl && ['overview', 'products', 'orders', 'enquiries', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-forest-600" /></div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-forest-800 mb-2">Access Denied</h2>
          <p className="text-earth-500 mb-6">You must be an administrator to access this page.</p>
          <Link to="/login?redirect=/admin"><Button>Sign In as Admin</Button></Link>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-forest-900 text-white py-4">
        <div className="container-custom flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Admin Dashboard</h1>
            <p className="text-forest-300 text-sm">{user.email}</p>
          </div>
          <Link to="/"><Button variant="ghost" className="text-white hover:bg-forest-800">← Back to Site</Button></Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-earth-100 sticky top-0 z-40">
        <div className="container-custom">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-forest-600 text-white'
                    : 'text-earth-600 hover:bg-forest-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'enquiries' && <EnquiriesTab />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminGetDashboardStats,
  });

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const statCards = [
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-forest-100 text-forest-700' },
    { label: 'Available In Stock', value: stats?.availableProducts ?? stats?.totalProducts ?? 0, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Sold Products', value: stats?.soldProducts || 0, icon: RotateCcw, color: 'bg-red-100 text-red-700' },
    { label: 'Low Stock (< 5)', value: stats?.lowStockProducts || 0, icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'bg-blue-100 text-blue-700' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-purple-100 text-purple-700' },
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), icon: BarChart3, color: 'bg-harvest-100 text-forest-900' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl shadow-sm p-6 border border-earth-100">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-forest-900">{value}</p>
          <p className="text-sm text-earth-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

function ProductsTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AdminProductFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>('1');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products', filter],
    queryFn: () => adminFetchProducts(filter),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deactivated');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Failed to deactivate product'),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: adminPermanentlyDeleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Product permanently deleted');
      setConfirmDelete(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to permanently delete product'),
  });

  const purgeDemoMutation = useMutation({
    mutationFn: adminPurgeDemoProducts,
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success(`Permanently removed ${count} demo product${count === 1 ? '' : 's'}`);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to remove demo products'),
  });

  const handlePurgeDemo = () => {
    if (window.confirm('Are you sure you want to permanently delete all demo/sample products from the database? Real products like "cock" will remain safe.')) {
      purgeDemoMutation.mutate();
    }
  };

  const reactivateMutation = useMutation({
    mutationFn: adminReactivateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product reactivated');
    },
    onError: () => toast.error('Failed to reactivate product'),
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => adminRestoreProductStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Product restored as Available!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to restore product'),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => adminQuickUpdateStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Stock updated');
      setEditingStockId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update stock'),
  });

  const handleSaveProduct = async (data: any): Promise<Product> => {
    let savedProduct: Product;
    if (editingProduct) {
      savedProduct = await adminUpdateProduct(editingProduct.id, data);
    } else {
      savedProduct = await adminCreateProduct(data);
    }
    return savedProduct;
  };

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filterTabs: { id: AdminProductFilter; label: string }[] = [
    { id: 'all', label: 'All Products' },
    { id: 'available', label: 'Available In Stock' },
    { id: 'sold', label: 'Sold Products' },
    { id: 'out_of_stock', label: 'Out of Stock' },
    { id: 'low_stock', label: 'Low Stock (< 5)' },
    { id: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="space-y-6">
      {/* Inventory Filter Bar */}
      <div className="flex flex-wrap gap-2 pb-2">
        {filterTabs.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filter === f.id
                ? 'bg-forest-800 text-white shadow-sm'
                : 'bg-white text-forest-900 border border-earth-200 hover:bg-forest-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-earth-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const demoCount = products?.filter((p) => p.name.includes('[Demo]') || p.name.toLowerCase().startsWith('demo')).length || 0;
            if (demoCount === 0) return null;
            return (
              <Button
                variant="outline"
                className="border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:text-red-800 text-xs font-semibold h-10 rounded-xl"
                onClick={handlePurgeDemo}
                disabled={purgeDemoMutation.isPending}
              >
                {purgeDemoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-red-600" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5 text-red-600" />
                    Remove {demoCount} Demo Product{demoCount === 1 ? '' : 's'}
                  </>
                )}
              </Button>
            );
          })()}
          <Button onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Product count */}
      <div className="text-xs text-earth-500 font-medium">
        Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''} in "{filterTabs.find(f => f.id === filter)?.label}"
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-earth-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-forest-800">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-forest-800 hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-forest-800">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-forest-800 hidden sm:table-cell">Inventory Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-forest-800">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-forest-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {filtered.map((product) => {
                  const isLivestock = product.product_type === 'livestock';
                  const isSold = product.availability_status === 'sold' || (isLivestock && product.stock_quantity <= 0);
                  const isOut = !isSold && (product.stock_quantity <= 0 || product.availability_status === 'out_of_stock');
                  const isLow = !isSold && !isOut && product.stock_quantity <= 5;

                  return (
                    <tr key={product.id} className="hover:bg-cream-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.product_images && product.product_images.length > 0 && product.product_images[0].image_url ? (
                            <img
                              src={product.product_images[0].image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-earth-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-earth-100 flex items-center justify-center flex-shrink-0 text-lg">
                              {product.product_type === 'livestock' ? '🐄' : product.product_type === 'dairy' ? '🥛' : '🌾'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-forest-900">{product.name}</div>
                            <div className="text-[11px] text-earth-400 capitalize">{product.product_type.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-earth-500 hidden md:table-cell">{product.category?.name || '-'}</td>
                      <td className="px-4 py-3 font-semibold text-forest-800">{formatPrice(product.price)}</td>
                      
                      {/* Interactive Stock Column */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={newStockValue}
                              onChange={(e) => setNewStockValue(e.target.value)}
                              className="w-16 h-8 px-2 text-xs border border-forest-500 rounded-lg text-forest-900 bg-white"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              className="h-8 px-2.5 text-xs bg-forest-700"
                              onClick={() => {
                                const val = parseInt(newStockValue);
                                if (!isNaN(val) && val >= 0) {
                                  stockMutation.mutate({ id: product.id, stock: val });
                                }
                              }}
                              disabled={stockMutation.isPending}
                            >
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="text-xs text-earth-500 hover:text-earth-700 px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => {
                                setEditingStockId(product.id);
                                setNewStockValue(product.stock_quantity.toString());
                              }}
                              className={`cursor-pointer font-bold text-sm hover:underline flex items-center gap-1 ${
                                isSold ? 'text-red-600' : isOut ? 'text-amber-600' : isLow ? 'text-amber-600' : 'text-forest-800'
                              }`}
                              title="Click to quickly update stock"
                            >
                              {product.stock_quantity} {product.unit || 'units'}
                              <Edit className="w-3 h-3 text-earth-400" />
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3">
                        {!product.is_active ? (
                          <Badge variant="danger">Inactive</Badge>
                        ) : isSold ? (
                          <span className="bg-red-100 text-red-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> SOLD
                          </span>
                        ) : isOut ? (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="bg-orange-100 text-orange-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-orange-200">
                            Low Stock ({product.stock_quantity})
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Available ({product.stock_quantity})
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* Restore Button for Sold or Out of Stock */}
                          {(isSold || isOut) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-harvest-800 bg-harvest-50 hover:bg-harvest-100 border-harvest-300 font-semibold"
                              onClick={() => restoreMutation.mutate({ id: product.id, stock: 1 })}
                              title="Restore product to Available (stock = 1)"
                              disabled={restoreMutation.isPending}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1 text-harvest-700" /> Restore
                            </Button>
                          )}

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-earth-100"
                            onClick={() => { setEditingProduct(product); setShowForm(true); }}
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5 text-forest-700" />
                          </Button>

                          {/* View Customer Page */}
                          <Link to={`/product/${product.slug}`} title="View Product Page">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-earth-100">
                              <Eye className="w-3.5 h-3.5 text-forest-700" />
                            </Button>
                          </Link>

                          {/* Inactive products show Reactivate button */}
                          {!product.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => reactivateMutation.mutate(product.id)}
                              title="Reactivate Product"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Delete button (available for both active and inactive products) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setConfirmDelete(product)}
                            title={product.is_active ? "Delete or Deactivate Product" : "Permanently Delete Product"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-earth-500">
              {search ? 'No products match your search' : `No products found in "${filterTabs.find(f => f.id === filter)?.label}"`}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-in border border-earth-100">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-forest-950 mb-1.5">
                {!confirmDelete.is_active || confirmDelete.name.includes('[Demo]')
                  ? 'Permanently Delete Product?'
                  : 'Delete or Deactivate Product?'}
              </h3>
              <p className="text-sm text-earth-600 mb-6 leading-relaxed">
                {!confirmDelete.is_active || confirmDelete.name.includes('[Demo]') ? (
                  <>
                    Are you sure you want to permanently delete{' '}
                    <strong className="text-forest-900 font-semibold">{confirmDelete.name}</strong> from your database? This action cannot be undone.
                  </>
                ) : (
                  <>
                    What would you like to do with{' '}
                    <strong className="text-forest-900 font-semibold">{confirmDelete.name}</strong>?
                  </>
                )}
              </p>

              <div className="space-y-2.5">
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl h-11"
                  onClick={() => permanentDeleteMutation.mutate(confirmDelete.id)}
                  disabled={permanentDeleteMutation.isPending || deleteMutation.isPending}
                >
                  {permanentDeleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting from Database...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" /> Permanently Delete from Database
                    </>
                  )}
                </Button>

                {confirmDelete.is_active && !confirmDelete.name.includes('[Demo]') && (
                  <Button
                    variant="outline"
                    className="w-full border-earth-300 text-earth-700 hover:bg-earth-50 rounded-xl h-11 font-medium"
                    onClick={() => deleteMutation.mutate(confirmDelete.id)}
                    disabled={permanentDeleteMutation.isPending || deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Deactivating...
                      </>
                    ) : (
                      'Deactivate Only (Hide from Store)'
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full text-earth-500 hover:bg-earth-100 rounded-xl h-10 text-xs"
                  onClick={() => setConfirmDelete(null)}
                  disabled={permanentDeleteMutation.isPending || deleteMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}

function OrdersTab() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: adminFetchOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminUpdateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Order status updated');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminUpdatePaymentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Payment status updated');
    },
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-4">
      {orders && orders.length > 0 ? orders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-earth-400 font-mono">#{order.id.slice(0, 8)}</p>
              <p className="font-semibold text-forest-900">{order.customer_name}</p>
              <p className="text-sm text-earth-500">{order.phone} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
              <p className="text-xs text-earth-400 mt-1">{order.delivery_address}, {order.city}, {order.state} - {order.pincode}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={order.order_status}
                onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                options={[
                  { value: 'pending', label: '🟡 Pending' },
                  { value: 'confirmed', label: '🔵 Confirmed' },
                  { value: 'processing', label: '🟣 Processing' },
                  { value: 'shipped', label: '📦 Shipped' },
                  { value: 'delivered', label: '✅ Delivered' },
                  { value: 'cancelled', label: '❌ Cancelled' },
                ]}
                className="w-40 h-9 text-xs"
              />
              <Select
                value={order.payment_status}
                onChange={(e) => paymentMutation.mutate({ id: order.id, status: e.target.value })}
                options={[
                  { value: 'pending', label: '💰 Pay Pending' },
                  { value: 'paid', label: '✅ Paid' },
                  { value: 'failed', label: '❌ Failed' },
                  { value: 'refunded', label: '↩️ Refunded' },
                ]}
                className="w-40 h-9 text-xs"
              />
            </div>
          </div>

          {order.order_items && (
            <div className="bg-cream-50 rounded-xl p-3 space-y-1">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-earth-600">{item.product_name} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.line_total)}</span>
                </div>
              ))}
              <hr className="border-earth-200" />
              <div className="flex justify-between font-bold text-forest-800">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          )}
        </div>
      )) : (
        <div className="text-center py-12 text-earth-500">No orders yet</div>
      )}
    </div>
  );
}

function EnquiriesTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['admin', 'enquiries'],
    queryFn: adminFetchEnquiries,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminUpdateEnquiryStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success(`Enquiry marked as ${vars.status}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update enquiry status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteEnquiry(id),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Enquiry deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete enquiry');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete the enquiry from "${customerName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const allList = enquiries || [];
  const pendingCount = allList.filter((e) => e.status === 'pending').length;
  const contactedCount = allList.filter((e) => e.status === 'contacted').length;
  const resolvedCount = allList.filter((e) => e.status === 'resolved').length;

  const filteredEnquiries = allList.filter((enq) => {
    // Status filter
    if (statusFilter !== 'all' && enq.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = enq.customer_name?.toLowerCase().includes(q);
      const matchPhone = enq.phone?.toLowerCase().includes(q);
      const matchEmail = enq.email?.toLowerCase().includes(q);
      const matchMsg = enq.message?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchMsg;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-earth-100">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Enquiries', count: allList.length, color: 'bg-forest-100 text-forest-800' },
            { id: 'pending', label: 'Pending', count: pendingCount, color: 'bg-amber-100 text-amber-800' },
            { id: 'contacted', label: 'Contacted', count: contactedCount, color: 'bg-blue-100 text-blue-800' },
            { id: 'resolved', label: 'Resolved', count: resolvedCount, color: 'bg-emerald-100 text-emerald-800' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                statusFilter === tab.id
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'bg-earth-50 text-earth-600 hover:bg-earth-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : tab.color
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-earth-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, message..."
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Enquiries List */}
      <div className="space-y-4">
        {filteredEnquiries.length > 0 ? (
          filteredEnquiries.map((enq) => {
            const created = new Date(enq.created_at);
            const dateStr = created.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = created.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            const isDeleting = deletingId === enq.id;
            const waUrl = getWhatsAppLink(
              enq.phone,
              `Hello ${enq.customer_name}, thank you for contacting Venkat Farms! We are following up regarding your enquiry: "${enq.message.slice(0, 80)}${enq.message.length > 80 ? '...' : ''}"`
            );

            return (
              <div
                key={enq.id}
                className="bg-white rounded-2xl shadow-xs border border-earth-100 p-6 transition-all hover:shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-earth-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {enq.customer_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-forest-950 text-base">{enq.customer_name}</h4>
                        {enq.product?.name && (
                          <Badge variant="outline" className="text-[10px] border-forest-200 text-forest-700 bg-forest-50/50">
                            Product: {enq.product.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-earth-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-earth-400" />
                          {dateStr} at {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <Select
                      value={enq.status}
                      onChange={(e) => statusMutation.mutate({ id: enq.id, status: e.target.value })}
                      options={[
                        { value: 'pending', label: '🟡 Pending' },
                        { value: 'contacted', label: '📞 Contacted' },
                        { value: 'resolved', label: '✅ Resolved' },
                      ]}
                      className="w-36 h-9 text-xs rounded-xl font-medium"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(enq.id, enq.customer_name)}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0 rounded-xl"
                      title="Delete enquiry"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Contact Quick Connect Bar */}
                <div className="flex flex-wrap items-center gap-2 py-3">
                  {/* Phone */}
                  <a
                    href={`tel:${enq.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 text-forest-800 text-xs font-semibold hover:bg-forest-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-forest-600" />
                    <span>Call: {enq.phone}</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  {/* Email */}
                  {enq.email && (
                    <a
                      href={`mailto:${enq.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{enq.email}</span>
                    </a>
                  )}
                </div>

                {/* Complete Message */}
                <div className="mt-2 p-3.5 bg-cream-50/70 border border-forest-100/50 rounded-xl">
                  <p className="text-xs font-semibold text-earth-500 uppercase tracking-wider mb-1">Customer Enquiry Message:</p>
                  <p className="text-sm text-forest-950 whitespace-pre-wrap leading-relaxed">{enq.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-earth-100 py-16 text-center text-earth-500">
            <MessageSquare className="w-10 h-10 text-earth-300 mx-auto mb-3" />
            <p className="font-semibold text-earth-700">No enquiries found</p>
            <p className="text-xs text-earth-400 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or status filter'
                : 'Customer messages from the Contact Us page and Home page will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
