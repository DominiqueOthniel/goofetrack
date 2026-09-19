import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { readActor, recordAudit } from '@/lib/audit';
import {
  errorResponse,
  noContentResponse,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/** Supprime l'operation de caisse rattachee a un objet metier (facture, depense). */
export async function DELETE(request: NextRequest) {
  try {
    const reference = new URL(request.url).searchParams.get('reference');
    if (!reference) {
      return errorResponse('Le parametre `reference` est obligatoire.', 400);
    }

    const { data: existing, error: lookupError } = await supabase
      .from('caisse_transactions')
      .select('*')
      .eq('reference', reference);

    if (lookupError) return supabaseErrorResponse(lookupError);

    if (!existing || existing.length === 0) {
      return noContentResponse();
    }

    const { error } = await supabase.from('caisse_transactions').delete().eq('reference', reference);
    if (error) return supabaseErrorResponse(error);

    await recordAudit({
      module: 'caisse',
      action: 'DELETE',
      entityId: String(existing[0].id),
      actor: readActor(request),
      summary: `Operation liee a ${reference}`,
      before: existing.length === 1 ? existing[0] : existing,
    });

    return noContentResponse();
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
