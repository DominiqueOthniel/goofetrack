import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { listHandler } from '@/lib/crud';
import { driversResource } from '@/lib/resources';
import { readActor, recordAudit } from '@/lib/audit';
import {
  createdResponse,
  errorResponse,
  readJsonBody,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';
import { fetchDriver, readTransactionsInput, replaceDriverTransactions } from '@/lib/driver-transactions';

export const dynamic = 'force-dynamic';

export const GET = listHandler(driversResource);

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const transactions = readTransactionsInput(body);
    const id = randomUUID();

    const { error } = await supabase.from('drivers').insert([
      {
        id,
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone,
        cni: body.cni ?? null,
        numeroPermis: body.numeroPermis ?? null,
        photo: body.photo ?? null,
      },
    ]);

    if (error) return supabaseErrorResponse(error);

    if (transactions && transactions.length > 0) {
      const transactionError = await replaceDriverTransactions(id, transactions);
      if (transactionError) return errorResponse(transactionError, 500);
    }

    const { data, error: readError } = await fetchDriver(id);
    if (readError) return supabaseErrorResponse(readError);

    await recordAudit({
      module: driversResource.module,
      action: 'CREATE',
      entityId: id,
      actor: readActor(request),
      summary: `${body.nom ?? ''} ${body.prenom ?? ''}`.trim(),
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
