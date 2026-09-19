import { supabase } from './db/supabase';

/** La configuration de caisse tient sur une ligne unique. */
export const CAISSE_CONFIG_ID = 1;

export async function readCaisseSoldeInitial(): Promise<number> {
  const { data } = await supabase
    .from('caisse_config')
    .select('soldeInitial')
    .eq('id', CAISSE_CONFIG_ID)
    .maybeSingle();

  return Number(data?.soldeInitial ?? 0);
}

/** Une entree credite la caisse, une sortie la debite. */
export function computeCaisseSolde(
  soldeInitial: number,
  transactions: { type?: unknown; montant?: unknown }[],
): number {
  return transactions.reduce((solde, transaction) => {
    const montant = Number(transaction.montant ?? 0);
    if (!Number.isFinite(montant)) return solde;
    return transaction.type === 'sortie' ? solde - montant : solde + montant;
  }, soldeInitial);
}
