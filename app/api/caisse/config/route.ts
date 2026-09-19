import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { CAISSE_CONFIG_ID } from '@/lib/caisse';
import { readActor, recordAudit } from '@/lib/audit';
import {
  errorResponse,
  readJsonBody,
  successResponse,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('caisse_config')
      .select('id, soldeInitial')
      .eq('id', CAISSE_CONFIG_ID)
      .maybeSingle();

    if (error) return supabaseErrorResponse(error);

    return successResponse({
      id: Number(data?.id ?? CAISSE_CONFIG_ID),
      soldeInitial: Number(data?.soldeInitial ?? 0),
    });
  } catch (error) {
    return unexpectedErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const soldeInitial = Number(body.soldeInitial ?? 0);

    if (!Number.isFinite(soldeInitial)) {
      return errorResponse('Le solde initial doit etre un nombre.', 400);
    }

    const { data, error } = await supabase
      .from('caisse_config')
      .upsert(
        {
          id: CAISSE_CONFIG_ID,
          soldeInitial,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('id, soldeInitial')
      .single();

    if (error) return supabaseErrorResponse(error);

    await recordAudit({
      module: 'caisse',
      action: 'UPDATE',
      entityId: String(CAISSE_CONFIG_ID),
      actor: readActor(request),
      summary: `Solde initial porte a ${soldeInitial}`,
      after: data,
    });

    return successResponse({
      id: Number(data.id),
      soldeInitial: Number(data.soldeInitial ?? 0),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      return errorResponse(error.message, 400);
    }
    return unexpectedErrorResponse(error);
  }
}
