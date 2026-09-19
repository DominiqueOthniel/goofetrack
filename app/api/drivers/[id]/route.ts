import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { deleteHandler, readHandler } from '@/lib/crud';
import { driversResource } from '@/lib/resources';
import { readActor, recordAudit } from '@/lib/audit';
import {
  errorResponse,
  notFoundResponse,
  readJsonBody,
  successResponse,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';
import { fetchDriver, readTransactionsInput, replaceDriverTransactions } from '@/lib/driver-transactions';

export const dynamic = 'force-dynamic';

export const GET = readHandler(driversResource);
export const DELETE = deleteHandler(driversResource);

const SCALAR_FIELDS = ['nom', 'prenom', 'telephone', 'cni', 'numeroPermis', 'photo'] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await readJsonBody(request);
    const { data: before } = await fetchDriver(params.id);
    if (!before) return notFoundResponse('Chauffeur introuvable.');

    const updates: Record<string, unknown> = {};
    for (const field of SCALAR_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('drivers').update(updates).eq('id', params.id);
      if (error) return supabaseErrorResponse(error, 'Chauffeur introuvable.');
    }

    const transactions = readTransactionsInput(body);
    if (transactions !== null) {
      const transactionError = await replaceDriverTransactions(params.id, transactions);
      if (transactionError) return errorResponse(transactionError, 500);
    }

    const { data, error: readError } = await fetchDriver(params.id);
    if (readError) return supabaseErrorResponse(readError);

    await recordAudit({
      module: driversResource.module,
      action: 'UPDATE',
      entityId: params.id,
      actor: readActor(request),
      before,
      after: data,
    });

    return successResponse(data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON')) {
      return errorResponse(error.message, 400);
    }
    return unexpectedErrorResponse(error);
  }
}
