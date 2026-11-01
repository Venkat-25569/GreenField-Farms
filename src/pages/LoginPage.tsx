import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf, Loader2, ShieldCheck, Mail, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { siteConfig } from '@/config/site';
import { useSiteSettings } from '@/contexts/SettingsContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [invalidCredentialsHint, setInvalidCredentialsHint] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { signIn } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  // Preload realistic agricultural landscape background image
  useEffect(() => {
    const img = new Image();
    img.src = '/images/greenfield-farm-landscape.jpg';
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
  }, []);

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return;
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
      });
      if (error) throw error;
      setResendSuccess(true);
      toast.success('Confirmation email sent! Please check your inbox and spam folder.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendingEmail(false);
    }
  };

  const onSubmit = async (data: LoginData) => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured. Set up environment variables to enable authentication.');
      return;
    }
    setLoading(true);
    setUnconfirmedEmail(null);
    setInvalidCredentialsHint(null);
    setResendSuccess(false);

    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes('email not confirmed')) {
        setUnconfirmedEmail(data.email);
        toast.error('Email not confirmed. Please verify your email or run the auto-confirm SQL in Supabase.', {
          duration: 6000,
        });
      } else if (lower.includes('invalid login credentials')) {
        setInvalidCredentialsHint(data.email);
        toast.error('Invalid login credentials. Please check your email and password.');
      } else {
        toast.error(error.message);
      }
    } else {
      // Check if user is admin
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userRes.user.id)
            .maybeSingle();

          if (profile?.role === 'admin') {
            toast.success('Welcome back, Admin!');
            navigate(redirectTarget || '/admin');
            return;
          }
        }
      } catch {
        // Fallback normal navigation
      }

      toast.success('Welcome back!');
      navigate(redirectTarget || '/');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-forest-950">
      {/* Fallback rich nature gradient */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-forest-950 via-forest-900 to-earth-950 z-0" 
        aria-hidden="true" 
      />

      {/* Realistic farm landscape background image */}
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

      {/* Nature-inspired green and cream gradient overlay for contrast and depth */}
      <div
        className="fixed inset-0 bg-gradient-to-b from-forest-950/45 via-forest-900/35 to-forest-950/60 z-0 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 bg-radial-[at_top_center] from-cream-100/20 via-transparent to-forest-950/50 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Subtle blur glow effect behind the card */}
        <div 
          className="absolute -inset-2 sm:-inset-3 bg-gradient-to-b from-cream-100/30 via-forest-400/20 to-forest-700/25 rounded-3xl blur-xl opacity-75 -z-10"
          aria-hidden="true"
        />

        {/* Clean white glassmorphism card */}
        <div className="bg-white/92 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(5,46,22,0.22)] border border-white/80 p-7 sm:p-9 transition-all">
          <div className="text-center mb-7">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center mb-3 group focus:outline-none focus:ring-2 focus:ring-forest-500 rounded-2xl"
              title="Return to Home"
            >
              <div className="w-13 h-13 bg-forest-700 rounded-2xl flex items-center justify-center shadow-md ring-4 ring-forest-100/70 group-hover:bg-forest-800 group-hover:scale-105 transition-all duration-200">
                <Leaf className="w-7 h-7 text-emerald-300" />
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-forest-50 border border-forest-200/80 text-forest-800 text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
              GreenField Farms Portal
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-forest-950 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome Back
            </h1>
            <p className="text-earth-600 text-sm mt-1.5">
              Sign in to your {settings.business_name} account
            </p>
          </div>

          {unconfirmedEmail && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50/95 border border-amber-200/90 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 flex-1 leading-relaxed">
                  <p className="font-semibold text-amber-950 mb-1">Email Confirmation Required</p>
                  <p className="text-amber-800 mb-2">
                    Supabase sent a confirmation link to <span className="font-mono font-medium">{unconfirmedEmail}</span>. Please verify your email to log in, or disable email confirmation in Supabase.
                  </p>
                  
                  {resendSuccess ? (
                    <div className="flex items-center gap-1.5 text-forest-700 font-semibold text-xs mt-2 bg-emerald-50 py-1.5 px-2.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Verification email resent! Check your inbox / spam.
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      disabled={resendingEmail}
                      className="mt-1 h-8 text-xs font-semibold bg-white border-amber-300 text-amber-900 hover:bg-amber-100/70"
                    >
                      {resendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Resending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 mr-1.5 text-amber-700" /> Resend Confirmation Email
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {invalidCredentialsHint && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50/95 border border-amber-200/90 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 flex-1 leading-relaxed">
                  <p className="font-semibold text-amber-950 mb-1">Invalid Login Credentials</p>
                  <p className="text-amber-800 mb-2">
                    The email or password does not match any registered account in Supabase.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900 mb-2">
                    <li>
                      Check that you are using your registered email (e.g. <span className="font-mono font-semibold">99240040697@klu.ac.in</span> vs <span className="font-mono font-semibold">99240041063@klu.ac.in</span>).
                    </li>
                    <li>
                      If you haven't created this account yet, please{' '}
                      <Link to="/register" className="font-bold underline text-forest-800 hover:text-forest-950">
                        Register here
                      </Link>.
                    </li>
                    <li>
                      To confirm your email or reset admin access instantly, run <span className="font-mono font-semibold">fix_admin_login.sql</span> in your Supabase SQL editor.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            <Input
              label="Email Address"
              id="login-email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              error={errors.email?.message}
              className="border-forest-200 focus:border-forest-500 focus:ring-forest-500/25 bg-white/95"
            />
            <Input
              label="Password"
              id="login-password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
              className="border-forest-200 focus:border-forest-500 focus:ring-forest-500/25 bg-white/95"
            />

            <Button
              type="submit"
              className="w-full bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 h-12 text-base rounded-xl cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-earth-600 mt-6 pt-5 border-t border-forest-100/80">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-forest-700 hover:text-forest-900 font-semibold underline-offset-4 hover:underline transition-colors"
            >
              Register
            </Link>
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-earth-500">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            <span>Secure Agricultural Commerce & Account Services</span>
          </div>
        </div>

        {/* Subtle footer */}
        <p className="text-center text-xs text-white/80 font-medium drop-shadow-sm mt-6">
          © {new Date().getFullYear()} {settings.business_name}. Pure, Sustainable & Fresh from the Farm.
        </p>
      </div>
    </div>
  );
}
