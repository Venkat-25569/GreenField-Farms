import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Menu, X,
  LogOut, Package, Settings, ShieldCheck,
  PlusCircle, FolderTree, MessageSquare, Store, PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { siteConfig, navLinks } from '@/config/site';
import { cn } from '@/lib/utils';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const { settings } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();

  // Admin exclusive navigation links
  const adminNavLinks = [
    { name: 'Admin Dashboard', href: '/admin', icon: Settings },
    { name: 'Products', href: '/admin?tab=products', icon: Package },
    { name: 'Add Product', href: '/admin?tab=products&action=add', icon: PlusCircle },
    { name: 'Categories', href: '/admin?tab=overview', icon: FolderTree },
    { name: 'Orders', href: '/admin?tab=orders', icon: ShoppingCart },
    { name: 'Enquiries', href: '/admin?tab=enquiries', icon: MessageSquare },
    { name: 'Settings', href: '/admin?tab=settings', icon: Settings },
    { name: 'Storefront', href: '/', icon: Store },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleReplayIntro = () => {
    sessionStorage.removeItem('venkat_farms_intro_played');
    window.location.reload();
  };

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 w-full',
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-harvest-200/60'
          : 'bg-white/95 backdrop-blur-sm border-b border-earth-100'
      )}
    >
      {/* Top Banner Bar */}
      <div className="bg-forest-900 text-cream-50 text-xs py-1.5 px-4">
        <div className="container-custom flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-cream-200">
              <span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse" />
              📍 {settings.address}
            </span>
            <span className="sm:hidden font-medium">📞 {settings.phone}</span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 bg-harvest-500/20 text-harvest-300 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-harvest-400/30">
                <ShieldCheck className="w-3 h-3 text-harvest-400" /> Admin Mode Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleReplayIntro}
              className="inline-flex items-center gap-1 text-[11px] text-harvest-300 hover:text-harvest-200 transition-colors cursor-pointer"
              title="Watch Cinematic Intro Again"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cinematic Intro</span>
            </button>
            <a
              href={`tel:${settings.phone}`}
              className="hidden sm:inline hover:text-harvest-300 transition-colors"
            >
              📞 {settings.phone}
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="hidden md:inline hover:text-harvest-300 transition-colors"
            >
              ✉️ {settings.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            {settings.logo_url ? (
              <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-md border border-forest-200 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                <img src={settings.logo_url} alt={settings.business_name} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-forest-800 to-forest-950 p-[2px] shadow-md group-hover:shadow-[0_0_15px_rgba(34,197,94,0.35)] transition-all duration-300">
                <div className="w-full h-full rounded-[14px] bg-forest-900 flex items-center justify-center border border-forest-700/50">
                  {/* Stylized Leaf & Bull Horn emblem */}
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-harvest-400 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3C4 7 4 12 7 15" />
                    <path d="M17 3C20 7 20 12 17 15" />
                    <path d="M12 9A5 5 0 0 0 7 14C7 18 10 21 12 21A5 5 0 0 0 17 14C17 10 14 9 12 9Z" />
                    <path d="M12 9V5" />
                  </svg>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-xl md:text-2xl font-extrabold tracking-tight text-forest-950 group-hover:text-forest-800 transition-colors"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {settings.business_name}
                </span>
              </div>
              <p className="text-[11px] text-earth-600 font-medium tracking-wide hidden md:block">
                {settings.tagline}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAdmin ? (
            /* Logged-In Admin Navigation */
            <nav className="hidden xl:flex items-center gap-1">
              {adminNavLinks.map((link) => {
                const Icon = link.icon;
                const active = location.pathname + location.search === link.href || (link.href === '/admin' && location.pathname === '/admin' && !location.search);
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      'relative px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5',
                      active
                        ? 'text-forest-900 bg-harvest-100/70 font-bold'
                        : 'text-forest-700 hover:text-forest-950 hover:bg-forest-50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 text-forest-600" />
                    <span>{link.name}</span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-forest-700 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          ) : (
            /* Customer Standard Navigation */
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'relative px-3 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-forest-900 font-semibold'
                        : 'text-forest-700 hover:text-forest-950'
                    )}
                  >
                    <span>{link.name}</span>
                    {/* Active Link Underline Indicator */}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-forest-600 via-harvest-400 to-forest-600 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Action Icons: Search, Cart, Account, Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-2xl transition-colors cursor-pointer"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Cart - CUSTOMER ONLY: Admins never see shopping cart */}
            {!isAdmin ? (
              <Link
                to="/cart"
                className="relative p-2.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-2xl transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-gradient-to-r from-harvest-500 to-sunset-500 text-forest-950 text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-scale-in">
                    {itemCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/admin"
                className="p-2 text-forest-800 bg-forest-100 hover:bg-forest-200/80 rounded-2xl transition-colors flex items-center gap-1.5 border border-forest-300/60 shadow-xs"
                title="Admin Management Dashboard"
              >
                <ShieldCheck className="w-5 h-5 text-forest-700" />
                <span className="text-xs font-bold text-forest-900 hidden md:inline">Admin Hub</span>
              </Link>
            )}

            {/* User Account / Profile */}
            <div className="relative">
              <button
                onClick={() => (user ? setUserMenuOpen(!userMenuOpen) : navigate('/login'))}
                className={cn(
                  'p-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5',
                  user
                    ? 'text-forest-900 bg-harvest-100/80 hover:bg-harvest-200/80'
                    : 'text-forest-700 hover:text-forest-900 hover:bg-forest-50'
                )}
                aria-label="Account menu"
              >
                <User className="w-5 h-5" />
                {user && (
                  <span className="hidden xl:inline text-xs font-semibold text-forest-800">
                    {isAdmin ? 'Admin' : 'Account'}
                  </span>
                )}
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && user && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-earth-200/80 py-2.5 z-50 animate-scale-in">
                    <div className="px-4 py-2.5 border-b border-earth-100">
                      <p className="text-xs text-earth-500 font-medium">Signed in as</p>
                      <p className="text-sm font-semibold text-forest-950 truncate">{user.email}</p>
                      <div className="mt-1">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-forest-100 text-forest-800 px-2 py-0.5 rounded-md font-bold">
                            <ShieldCheck className="w-3 h-3 text-forest-600" /> Administrator
                          </span>
                        ) : (
                          <span className="text-[11px] bg-cream-100 text-earth-700 px-2 py-0.5 rounded-md font-medium">
                            Customer
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 hover:text-forest-950 transition-colors"
                      >
                        <User className="w-4 h-4 text-forest-600" /> My Account
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 hover:text-forest-950 transition-colors"
                      >
                        <Package className="w-4 h-4 text-forest-600" /> My Orders
                      </Link>

                      {isAdmin && (
                        <>
                          <hr className="my-1.5 border-earth-100" />
                          <div className="px-4 py-1 text-[11px] font-bold text-forest-600 tracking-wider uppercase">
                            Admin Controls
                          </div>
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-900 font-semibold bg-forest-50/70 hover:bg-forest-100 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-forest-700" /> Admin Dashboard
                          </Link>
                          <Link
                            to="/admin?tab=products&action=add"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors"
                          >
                            <PlusCircle className="w-4 h-4 text-forest-600" /> Add Product
                          </Link>
                          <Link
                            to="/admin?tab=orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4 text-forest-600" /> Manage Orders
                          </Link>
                          <Link
                            to="/admin?tab=enquiries"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-forest-800 hover:bg-forest-50 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-forest-600" /> Customer Enquiries
                          </Link>
                        </>
                      )}
                    </div>

                    <hr className="my-1 border-earth-100" />
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-2xl transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar Flyout */}
        {searchOpen && (
          <div className="py-3.5 border-t border-earth-100 animate-slide-up">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search livestock, pure dairy milk, farming supplies..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-earth-300 bg-cream-50 text-forest-950 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-inner"
                  autoFocus
                />
              </div>
              <Button type="submit" size="default" className="bg-forest-800 hover:bg-forest-900 text-white shadow-sm">
                Search
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-earth-100 bg-white/98 backdrop-blur-xl animate-slide-up max-h-[80vh] overflow-y-auto">
          <div className="container-custom py-4 space-y-2">
            {/* Admin Links in Mobile if Admin */}
            {isAdmin && (
              <div className="mb-3 p-3 bg-forest-50/80 rounded-2xl border border-forest-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900 mb-2">
                  <ShieldCheck className="w-4 h-4 text-forest-700" /> Admin Controls
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {adminNavLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-forest-800 bg-white shadow-sm border border-earth-100 hover:bg-harvest-50"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Nav Links */}
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
                      active
                        ? 'bg-forest-100 text-forest-900 font-semibold'
                        : 'text-forest-800 hover:bg-forest-50'
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Replay Intro Button in Mobile Menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleReplayIntro();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-harvest-700 bg-harvest-50 rounded-xl hover:bg-harvest-100 transition-colors"
            >
              <PlayCircle className="w-4 h-4 text-harvest-600" /> Watch Cinematic Intro
            </button>

            {/* Auth Buttons for Non-logged-in */}
            {!user && (
              <div className="pt-3 border-t border-earth-100 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  className="flex-1 bg-forest-800 hover:bg-forest-900 text-white rounded-xl"
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
