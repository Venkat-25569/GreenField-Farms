import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Helper to strip accidental quotes and trim whitespace
const sanitizeEnv = (val?: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

// Check if a value is a placeholder string
const isPlaceholder = (val: string): boolean => {
  if (!val) return true;
  const lower = val.toLowerCase().trim();
  return (
    lower === 'placeholder' ||
    lower === 'your-anon-key-here' ||
    lower === 'your-publishable-key-here' ||
    lower.includes('placeholder.supabase.co') ||
    lower.includes('your-project.supabase.co')
  );
};

// Validate Supabase URL
const isValidUrl = (url: string): boolean => {
  if (!url || isPlaceholder(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Validate Supabase Key (anon or publishable)
const isValidKey = (key: string): boolean => {
  if (!key || isPlaceholder(key)) return false;
  return key.trim().length > 0;
};

// Pick the first non-empty, non-placeholder value, or fallback to first non-empty
const resolveEnv = (...values: (string | undefined)[]): string => {
  for (const v of values) {
    const sanitized = sanitizeEnv(v);
    if (sanitized && !isPlaceholder(sanitized)) {
      return sanitized;
    }
  }
  for (const v of values) {
    const sanitized = sanitizeEnv(v);
    if (sanitized) return sanitized;
  }
  return '';
};

// Read environment variables (supports Vercel's VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY)
const supabaseUrl = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseKey = resolveEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Security check: verify no service role key is mistakenly used in frontend code
if (supabaseKey.includes('service_role') || supabaseKey.startsWith('sb_secret_')) {
  console.error(
    'CRITICAL SECURITY WARNING: A Supabase service-role or secret key was detected in the frontend environment variables! ' +
    'The service-role key bypasses Row Level Security and must NEVER be exposed in client-side code. ' +
    'Please replace it immediately with your publishable / anon key (sb_publishable_... or anon JWT).'
  );
}

// Check configuration status
export const isSupabaseConfigured = (): boolean => {
  return isValidUrl(supabaseUrl) && isValidKey(supabaseKey);
};

// Create a safe recursive proxy for unconfigured environments so the app does not crash at bundle evaluation
const createFallbackClient = (): SupabaseClient => {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (val: any) => void) =>
          resolve({
            data: { subscription: { unsubscribe: () => {} } },
            error: new Error('Supabase is not configured. Please set up environment variables.'),
          });
      }
      return new Proxy(
        () => ({
          data: { subscription: { unsubscribe: () => {} } },
          error: new Error('Supabase is not configured. Please set up environment variables.'),
        }),
        handler
      );
    },
    apply() {
      return new Proxy(
        () => ({
          data: { subscription: { unsubscribe: () => {} } },
          error: new Error('Supabase is not configured. Please set up environment variables.'),
        }),
        handler
      );
    },
  };
  return new Proxy({}, handler) as SupabaseClient;
};

// Validate that the Supabase URL and key are not empty before initializing the client
if (!isSupabaseConfigured()) {
  console.warn(
    'Supabase credentials are not configured or invalid. The app will run in offline/demo mode. ' +
    'To enable authentication and database operations, set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).'
  );
}

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createFallbackClient();
