import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { readActor, recordAudit } from '@/lib/audit';
import {
  createdResponse,
  errorResponse,
  readJsonBody,
  successResponse,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const WRITABLE_FIELDS = [
  'type',
  'montant',
  'date',
  'description',
  'utilisateur',
  'categorie',
  'reference',
  'compteBanqueId',
  'bankTransactionId',
  'exclutRevenu',
] as const;

/**
 * Le frontend rattache une operation de caisse a un objet metier via une
 * reference (`facture:<id>`, `depense:<id>`). Cette route cree l'operation ou
 * met a jour celle qui porte deja cette reference, sans doublon.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference') ?? (body.reference as string | undefined);

    if (!reference) {
      return errorResponse('Le parametre `reference` est obligatoire.', 400);
    }

    const payload: Record<string, unknown> = { reference };
    for (const field of WRITABLE_FIELDS) {
      if (body[field] !== undefined) payload[field] = body[field];
    }

    const { data: existing, error: lookupError } = await supabase
      .from('caisse_transactions')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();

    if (lookupError) return supabaseErrorResponse(lookupError);

    if (existing) {
      const { data, error } = await supabase
        .from('caisse_transactions')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) return supabaseErrorResponse(error);

      await recordAudit({
        module: 'caisse',
        action: 'UPDATE',
        entityId: String(existing.id),
        actor: readActor(request),
        summary: `Operation liee a ${reference}`,
        before: existing,
        after: data,
      });

      return successResponse(data);
    }

    const { data, error } = await supabase
      .from('caisse_transactions')
      .insert([{ id: (body.id as string | undefined) ?? randomUUID(), exclutRevenu: false, ...payload }])
      .select('*')
      .single();

    if (error) return supabaseErrorResponse(error);

    await recordAudit({
      module: 'caisse',
      action: 'CREATE',
      entityId: String(data.id),
      actor: readActor(request),
      summary: `Operation liee a ${reference}`,
      after: data,
    });

    return createdResponse(data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      return errorResponse(error.message, 400);
    }
    return unexpectedErrorResponse(error);
  }
}
