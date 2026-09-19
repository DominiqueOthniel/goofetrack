'use client';

import nextDynamic from 'next/dynamic';

/**
 * L'application existante repose sur react-router et sur localStorage, elle ne
 * peut donc pas etre rendue sur le serveur.
 */
const App = nextDynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export function ClientApp() {
  return <App />;
}
