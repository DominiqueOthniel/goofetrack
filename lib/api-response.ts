import { NextResponse } from 'next/server';

/**
 * Le client HTTP du frontend lit la propriete `message` des reponses d'erreur,
 * toutes les erreurs doivent donc respecter cette forme.
 */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function createdResponse(data: unknown) {
  return NextResponse.json(data, { status: 201 });
}

/** Les suppressions renvoient 204, le client n'essaie alors pas de parser un corps. */
export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

export function notFoundResponse(message = 'Ressource introuvable') {
  return errorResponse(message, 404);
}

type PostgrestLikeError = {
  message: string;
  code?: string;
  details?: string | null;
};

/** Traduit une erreur PostgREST en reponse HTTP lisible. */
export function supabaseErrorResponse(error: PostgrestLikeError, notFoundMessage?: string) {
  if (error.code === 'PGRST116') {
    return notFoundResponse(notFoundMessage ?? 'Ressource introuvable');
  }
  // 23503 violation de cle etrangere, 23505 violation d'unicite
  if (error.code === '23503' || error.code === '23505') {
    return errorResponse(error.message, 409);
  }
  console.error('Erreur Supabase:', error);
  return errorResponse(error.message, 500);
}

export function unexpectedErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erreur interne';
  console.error('Erreur inattendue:', error);
  return errorResponse(message, 500);
}

/** Lit le corps JSON en rejetant proprement un corps absent ou invalide. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Le corps de la requete doit etre un objet JSON.');
    }
    return body as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.includes('objet JSON')
        ? error.message
        : 'Corps JSON invalide.',
    );
  }
}
