import { randomUUID } from 'node:crypto';
import { supabase } from './db/supabase';
import { driversResource } from './resources';

export type DriverTransactionInput = {
  id?: string;
  type: 'apport' | 'sortie';
  montant: number;
  date: string;
  description: string;
};

/**
 * Renvoie `null` quand le client n'a pas fourni la cle `transactions`, pour
 * distinguer « ne rien changer » de « remplacer par une liste vide ».
 */
export function readTransactionsInput(body: Record<string, unknown>): DriverTransactionInput[] | null {
  const value = body.transactions;
  if (value === undefined) return null;
  if (!Array.isArray(value)) return [];

  return value.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      id: typeof row.id === 'string' ? row.id : undefined,
      type: row.type === 'sortie' ? 'sortie' : 'apport',
      montant: Number(row.montant ?? 0),
      date: String(row.date ?? new Date().toISOString().slice(0, 10)),
      description: String(row.description ?? ''),
    };
  });
}

/** Les transactions d'un chauffeur sont remplacees en bloc, comme le faisait le cascade TypeORM. */
export async function replaceDriverTransactions(
  driverId: string,
  transactions: DriverTransactionInput[],
): Promise<string | null> {
  const { error: deleteError } = await supabase
    .from('driver_transactions')
    .delete()
    .eq('driverId', driverId);

  if (deleteError) return deleteError.message;
  if (transactions.length === 0) return null;

  const rows = transactions.map((transaction) => ({
    id: transaction.id ?? randomUUID(),
    driverId,
    type: transaction.type,
    montant: transaction.montant,
    date: transaction.date,
    description: transaction.description,
  }));

  const { error: insertError } = await supabase.from('driver_transactions').insert(rows);
  return insertError?.message ?? null;
}

export async function fetchDriver(driverId: string) {
  return supabase
    .from('drivers')
    .select(driversResource.select ?? '*')
    .eq('id', driverId)
    .maybeSingle();
}
