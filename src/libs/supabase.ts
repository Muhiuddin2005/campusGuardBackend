import { createClient, SupabaseClient } from '@supabase/supabase-js';
import configs from '../configs/configs';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    if (!configs.supabase.url || !configs.supabase.serviceRoleKey) {
      console.warn('⚠️ Supabase credentials missing; storage operations will be mock/disabled.');
    }
    supabaseClient = createClient(
      configs.supabase.url || 'https://placeholder.supabase.co',
      configs.supabase.serviceRoleKey || 'placeholder-service-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return supabaseClient;
};

export default getSupabaseClient;
