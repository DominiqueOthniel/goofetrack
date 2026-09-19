import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { creditsResource } from '@/lib/resources';
import { readActor, recordAudit } from '@/lib/audit';
import {
  createdResponse,
  errorResponse,
  notFoundResponse,
  readJsonBody,
  supabaseErrorResponse,
  unexpectedErrorResponse,
} from '@/lib/api-response';

export const dynamic = 'force-dynamic';

function fetchCredit(creditId: string) {
  return supabase
    .from('credits')
    .select(creditsResource.select ?? '*')
    .eq('id', creditId)
    .maybeSingle();
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await readJsonBody(request);
    const montant = Number(body.montant ?? 0);

    if (!Number.isFinite(montant) || montant <= 0) {
      return errorResponse('Le montant du remboursement doit etre positif.', 400);
    }

    const { data: credit, error: creditError } = await supabase
      .from('credits')
      .select('id, montantTotal, montantRembourse')
      .eq('id', params.id)
      .maybeSingle();

    if (creditError) return supabaseErrorResponse(creditError, 'Credit introuvable.');
    if (!credit) return notFoundResponse('Credit introuvable.');

    const { error: insertError } = await supabase.from('credit_remboursements').insert([
      {
        id: randomUUID(),
        creditId: params.id,
        date: body.date ?? new Date().toISOString().slice(0, 10),
        montant,
        note: body.note ?? null,
      },
    ]);

    if (insertError) return supabaseErrorResponse(insertError);

    const montantTotal = Number(credit.montantTotal ?? 0);
    const montantRembourse = Number(credit.montantRembourse ?? 0) + montant;

    const { error: updateError } = await supabase
      .from('credits')
      .update({
        montantRembourse,
        statut: montantRembourse >= montantTotal ? 'solde' : 'en_cours',
      })
      .eq('id', params.id);

    if (updateError) return supabaseErrorResponse(updateError);

    const { data, error: readError } = await fetchCredit(params.id);
    if (readError) return supabaseErrorResponse(readError);

    await recordAudit({
      module: creditsResource.module,
      action: 'REMBOURSEMENT',
      entityId: params.id,
      actor: readActor(request),
      summary: `Remboursement de ${montant}`,
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
