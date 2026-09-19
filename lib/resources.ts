import type { ResourceConfig } from './crud';

/**
 * Les colonnes reprennent exactement le nommage cree par TypeORM dans Supabase:
 * tables en snake_case, colonnes composees en camelCase.
 */

export const trucksResource: ResourceConfig = {
  table: 'trucks',
  module: 'trucks',
  label: 'Camion',
  order: { column: 'immatriculation', ascending: true },
  summarize: (row) => `${row.immatriculation ?? ''} ${row.modele ?? ''}`.trim(),
};

export const driversResource: ResourceConfig = {
  table: 'drivers',
  module: 'drivers',
  label: 'Chauffeur',
  select: '*, transactions:driver_transactions(id, type, montant, date, description)',
  omit: ['transactions'],
  order: { column: 'nom', ascending: true },
  summarize: (row) => `${row.nom ?? ''} ${row.prenom ?? ''}`.trim(),
};

export const tripsResource: ResourceConfig = {
  table: 'trips',
  module: 'trips',
  label: 'Trajet',
  order: { column: 'dateDepart', ascending: false },
  summarize: (row) => `${row.origine ?? ''} vers ${row.destination ?? ''}`,
};

export const expensesResource: ResourceConfig = {
  table: 'expenses',
  module: 'expenses',
  label: 'Depense',
  order: { column: 'date', ascending: false },
  summarize: (row) => `${row.categorie ?? 'Depense'} : ${row.montant ?? 0}`,
};

export const invoicesResource: ResourceConfig = {
  table: 'invoices',
  module: 'invoices',
  label: 'Facture',
  order: { column: 'dateCreation', ascending: false },
  summarize: (row) => `Facture ${row.numero ?? ''}`.trim(),
};

export const thirdPartiesResource: ResourceConfig = {
  table: 'third_parties',
  module: 'third-parties',
  label: 'Tiers',
  order: { column: 'nom', ascending: true },
  summarize: (row) => String(row.nom ?? ''),
};

export const personnelResource: ResourceConfig = {
  table: 'personnel',
  module: 'personnel',
  label: 'Membre du personnel',
  order: { column: 'nom', ascending: true },
  defaults: () => ({ statut: 'actif' }),
  summarize: (row) => `${row.nom ?? ''} ${row.prenom ?? ''}`.trim(),
};

export const parcelExpeditionsResource: ResourceConfig = {
  table: 'parcel_expeditions',
  module: 'parcel-expeditions',
  label: 'Expedition',
  order: { column: 'dateDepart', ascending: false },
  defaults: (body) => ({
    lots: Array.isArray(body.lots) ? body.lots : [],
    dateCreation: new Date().toISOString().slice(0, 10),
  }),
  summarize: (row) => `Expedition ${row.reference ?? ''}`.trim(),
};

export const bankAccountsResource: ResourceConfig = {
  table: 'bank_accounts',
  module: 'bank',
  label: 'Compte bancaire',
  omit: ['transactions', 'compte', 'soldeActuel'],
  order: { column: 'nom', ascending: true },
  // soldeActuel est NOT NULL: a la creation il vaut le solde initial.
  defaults: (body) => ({
    devise: 'FCFA',
    soldeActuel: Number(body.soldeInitial ?? 0),
  }),
  summarize: (row) => `${row.nom ?? ''} (${row.banque ?? ''})`,
};

export const bankTransactionsResource: ResourceConfig = {
  table: 'bank_transactions',
  module: 'bank',
  label: 'Mouvement bancaire',
  omit: ['compte', 'creePar', 'modifiePar'],
  order: { column: 'date', ascending: false },
  summarize: (row) => `${row.type ?? ''} ${row.montant ?? 0}`,
};

export const caisseTransactionsResource: ResourceConfig = {
  table: 'caisse_transactions',
  module: 'caisse',
  label: 'Operation de caisse',
  order: { column: 'date', ascending: false },
  // Le frontend genere lui-meme des identifiants metier pour la caisse.
  acceptClientId: true,
  defaults: () => ({ exclutRevenu: false }),
  summarize: (row) => `${row.type ?? ''} ${row.montant ?? 0}`,
};

export const creditsResource: ResourceConfig = {
  table: 'credits',
  module: 'credits',
  label: 'Credit',
  select: '*, remboursements:credit_remboursements(id, date, montant, note)',
  omit: ['remboursements'],
  order: { column: 'dateDebut', ascending: false },
  defaults: () => ({ montantRembourse: 0, statut: 'en_cours' }),
  summarize: (row) => `${row.intitule ?? ''} (${row.preteur ?? ''})`,
};
