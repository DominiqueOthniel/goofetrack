import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase non configure : definir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  client = createClient(url, anonKey);
  return client;
}

/**
 * Le client est resolu au premier acces et non au chargement du module, sinon
 * `next build` echoue quand les variables d'environnement ne sont pas presentes.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const resolved = getSupabaseClient() as unknown as Record<string | symbol, unknown>;
    const value = resolved[property];
    return typeof value === 'function' ? value.bind(resolved) : value;
  },
});
