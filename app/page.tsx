'use client';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-4 gradient-text">
          SIA-GOOFE
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Application de gestion de flotte de transport
        </p>
        <p className="text-sm text-muted-foreground">
          Migration vers Next.js + Supabase en cours...
        </p>
        <div className="mt-8">
          <a
            href="/api/health"
            target="_blank"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tester l'API
          </a>
        </div>
      </div>
    </div>
  );
}
