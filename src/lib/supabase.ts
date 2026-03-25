import { createClient } from '@supabase/supabase-js';

export const getSupabaseConfig = () => {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');
  return { url, key };
};

export const setSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
};

export const createSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  return createClient(url, key);
};

// This will be null initially if keys are missing
export let supabase = createSupabaseClient();

export const refreshSupabaseClient = () => {
  supabase = createSupabaseClient();
  return supabase;
};
