import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Package, LogOut, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AccountPage() {
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-earth-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-forest-800 mb-2">Sign In Required</h2>
          <p className="text-earth-500 mb-6">Please sign in to view your account</p>
          <Link to="/login"><Button>Sign In</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 text-white py-10">
        <div className="container-custom">
          <h1 className="heading-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>My Account</h1>
          <p className="text-forest-200 mt-1">{user.email}</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:col-span-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-forest-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-forest-900">
                  {profile?.full_name || 'Customer'}
                </h2>
                <p className="text-earth-500 text-sm">{user.email}</p>
                {profile?.phone && <p className="text-earth-500 text-sm">{profile.phone}</p>}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <Link to="/orders" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow group">
            <Package className="w-8 h-8 text-forest-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-forest-900">My Orders</h3>
            <p className="text-sm text-earth-500 mt-1">View your order history</p>
          </Link>

          {isAdmin && (
            <Link to="/admin" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow group">
              <Settings className="w-8 h-8 text-forest-600 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-forest-900">Admin Dashboard</h3>
              <p className="text-sm text-earth-500 mt-1">Manage products & orders</p>
            </Link>
          )}

          <button
            onClick={signOut}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow group text-left w-full"
          >
            <LogOut className="w-8 h-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-forest-900">Sign Out</h3>
            <p className="text-sm text-earth-500 mt-1">Log out of your account</p>
          </button>
        </div>
      </div>
    </div>
  );
}
