import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

// Placeholder values keep createClient happy when unconfigured; callers must
// gate any real usage behind isSupabaseConfigured, so no request is ever sent.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder"
);
