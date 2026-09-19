import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Seules les routes API contactent Supabase, donc les identifiants restent
 * cote serveur: pas de prefixe NEXT_PUBLIC, qui les exposerait dans le bundle
 * envoye au navigateur. Les anciens noms restent acceptes en secours pour ne
 * pas casser un deploiement deja configure.
 */
function readCredentials(): { url?: string; key?: string } {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const { url, key } = readCredentials();

  if (!url || !key) {
    throw new Error(
      'Supabase non configure : definir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
