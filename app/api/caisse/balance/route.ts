import { supabase } from '@/lib/db/supabase';
import { computeCaisseSolde, readCaisseSoldeInitial } from '@/lib/caisse';
import { successResponse, supabaseErrorResponse, unexpectedErrorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const soldeInitial = await readCaisseSoldeInitial();
    const { data, error } = await supabase.from('caisse_transactions').select('type, montant');

    if (error) return supabaseErrorResponse(error);

    return successResponse({
      soldeInitial,
      soldeActuel: computeCaisseSolde(soldeInitial, data ?? []),
    });
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}
