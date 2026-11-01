import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { Leaf, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { signUp } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    const img = new Image();
    img.src = '/images/greenfield-farm-landscape.jpg';
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
  }, []);

  const onSubmit = async (data: RegisterData) => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured. Set up environment variables to enable registration.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName, data.phone);
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes('database error')) {
        toast.error('Database Trigger Notice: Please run supabase/fix_profiles.sql in Supabase SQL editor if user registration fails.', {
          duration: 9000,
        });
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created! You can now log in to your account.');
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-forest-950">
      {/* Background Gradient & Photo */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-forest-950 via-forest-900 to-earth-950 z-0" 
        aria-hidden="true" 
      />
      <div
        className={cn(
          "fixed inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-out z-0 transform scale-100",
          imageLoaded && !imageError ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: `url('/images/greenfield-farm-landscape.jpg')`,
        }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 bg-gradient-to-b from-forest-950/45 via-forest-900/35 to-forest-950/60 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md my-auto">
        <div 
          className="absolute -inset-2 sm:-inset-3 bg-gradient-to-b from-cream-100/30 via-forest-400/20 to-forest-700/25 rounded-3xl blur-xl opacity-75 -z-10"
          aria-hidden="true"
        />

        <div className="bg-white/92 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(5,46,22,0.22)] border border-white/80 p-7 sm:p-9 transition-all">
          <div className="text-center mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center mb-2 group focus:outline-none focus:ring-2 focus:ring-forest-500 rounded-2xl"
              title="Return to Home"
            >
              <div className="w-12 h-12 bg-forest-700 rounded-2xl flex items-center justify-center shadow-md ring-4 ring-forest-100/70 group-hover:bg-forest-800 transition-all duration-200">
                <Leaf className="w-6 h-6 text-emerald-300" />
              </div>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold text-forest-950 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Create Account
            </h1>
            <p className="text-earth-600 text-xs sm:text-sm mt-1">
              Join {settings.business_name} for fresh farm deliveries
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <Input
              label="Full Name *"
              id="reg-name"
              placeholder="e.g. Ramesh Kumar"
              {...register('fullName')}
              error={errors.fullName?.message}
              className="border-forest-200 bg-white/95"
            />
            <Input
              label="Phone Number *"
              id="reg-phone"
              placeholder="10-digit mobile number"
              {...register('phone')}
              error={errors.phone?.message}
              className="border-forest-200 bg-white/95"
            />
            <Input
              label="Email Address *"
              id="reg-email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
              className="border-forest-200 bg-white/95"
            />
            <Input
              label="Password *"
              id="reg-password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
              className="border-forest-200 bg-white/95"
            />
            <Input
              label="Confirm Password *"
              id="reg-confirm"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              className="border-forest-200 bg-white/95"
            />

            <Button
              type="submit"
              className="w-full bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white font-medium shadow-md transition-all h-11 text-base rounded-xl cursor-pointer mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-earth-600 mt-5 pt-4 border-t border-forest-100/80">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-forest-700 hover:text-forest-900 font-semibold underline-offset-4 hover:underline transition-colors"
            >
              Sign In
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-earth-500">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            <span>Secure Agricultural Commerce & Account Services</span>
          </div>
        </div>

        <p className="text-center text-xs text-white/80 font-medium drop-shadow-sm mt-5">
          © {new Date().getFullYear()} {settings.business_name}. Pure, Sustainable & Fresh from the Farm.
        </p>
      </div>
    </div>
  );
}
