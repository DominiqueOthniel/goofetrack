/**
 * Ces types decrivent les lignes telles que Supabase les renvoie. Les colonnes
 * numeriques PostgreSQL (`numeric`) arrivent parfois en chaine, d'ou `number | string`.
 */

export type Numeric = number | string;

export type TruckType = 'tracteur' | 'remorqueuse';
export type TruckStatut = 'actif' | 'inactif';
export type TruckSousType = 'tracteur_seul' | 'tracteur_jumele' | 'remorque_seule';
export type TripStatut = 'planifie' | 'en_cours' | 'termine' | 'annule';
export type ThirdPartyType = 'proprietaire' | 'client' | 'fournisseur';
export type PersonnelType = 'stagiaire' | 'employe';
export type InvoiceStatut = 'en_attente' | 'payee';
export type BankAccountType = 'courant' | 'epargne' | 'professionnel';
export type BankTransactionType = 'depot' | 'retrait' | 'virement' | 'prelevement' | 'frais';
export type CaisseTransactionType = 'entree' | 'sortie';
export type CreditType = 'emprunt' | 'pret_accorde';
export type CreditStatut = 'en_cours' | 'solde' | 'en_retard';
export type DriverTransactionType = 'apport' | 'sortie';

export interface Truck {
  id: string;
  immatriculation: string;
  modele: string;
  type: TruckType;
  sousType?: TruckSousType | null;
  remorqueImmatriculation?: string | null;
  statut: TruckStatut;
  dateMiseEnCirculation: string;
  photo?: string | null;
  proprietaireId?: string | null;
  chauffeurId?: string | null;
}

export interface DriverTransaction {
  id: string;
  driverId: string;
  type: DriverTransactionType;
  montant: Numeric;
  date: string;
  description: string;
}

export interface Driver {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  cni?: string | null;
  numeroPermis?: string | null;
  photo?: string | null;
  transactions?: DriverTransaction[];
}

export interface Trip {
  id: string;
  tracteurId?: string | null;
  remorqueuseId?: string | null;
  origine: string;
  destination: string;
  origineLat?: Numeric | null;
  origineLng?: Numeric | null;
  destinationLat?: Numeric | null;
  destinationLng?: Numeric | null;
  chauffeurId: string;
  chauffeurRemplacantId?: string | null;
  remplacementDate?: string | null;
  remplacementLieu?: string | null;
  remplacementMotif?: string | null;
  recetteChauffeurInitial?: Numeric | null;
  recetteChauffeurRemplacant?: Numeric | null;
  prefinancementChauffeurInitial?: Numeric | null;
  prefinancementChauffeurRemplacant?: Numeric | null;
  dateDepart: string;
  dateArrivee?: string | null;
  recette: Numeric;
  prefinancement?: Numeric | null;
  client?: string | null;
  marchandise?: string | null;
  description?: string | null;
  statut: TripStatut;
}

export interface Expense {
  id: string;
  camionId?: string | null;
  tripId?: string | null;
  chauffeurId?: string | null;
  categorie: string;
  sousCategorie?: string | null;
  fournisseurId?: string | null;
  personnelId?: string | null;
  montant: Numeric;
  quantite?: Numeric | null;
  prixUnitaire?: Numeric | null;
  date: string;
  description: string;
}

export interface Invoice {
  id: string;
  numero: string;
  trajetId?: string | null;
  parcelExpeditionId?: string | null;
  expenseId?: string | null;
  statut: InvoiceStatut;
  montantHT: Numeric;
  remise?: Numeric | null;
  montantHTApresRemise?: Numeric | null;
  tva?: Numeric | null;
  tps?: Numeric | null;
  montantTTC: Numeric;
  montantPaye?: Numeric | null;
  dateCreation: string;
  datePaiement?: string | null;
  modePaiement?: string | null;
  notes?: string | null;
}

export interface ThirdParty {
  id: string;
  nom: string;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  type: ThirdPartyType;
  notes?: string | null;
}

export interface Personnel {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  email?: string | null;
  type: PersonnelType;
  poste?: string | null;
  statut: TruckStatut;
  salaireMensuel?: Numeric | null;
  dateEmbauche?: string | null;
  notes?: string | null;
}

export interface BankAccount {
  id: string;
  nom: string;
  numeroCompte: string;
  banque: string;
  type: BankAccountType;
  soldeInitial: Numeric;
  soldeActuel: Numeric;
  devise: string;
  iban?: string | null;
  swift?: string | null;
  notes?: string | null;
}

export interface BankTransaction {
  id: string;
  compteId: string;
  type: BankTransactionType;
  montant: Numeric;
  date: string;
  description: string;
  reference?: string | null;
  beneficiaire?: string | null;
  categorie?: string | null;
}

export interface CaisseConfig {
  id: number;
  soldeInitial: Numeric;
  updatedAt?: string | null;
}

export interface CaisseTransaction {
  id: string;
  type: CaisseTransactionType;
  montant: Numeric;
  date: string;
  description: string;
  utilisateur?: string | null;
  categorie?: string | null;
  reference?: string | null;
  compteBanqueId?: string | null;
  bankTransactionId?: string | null;
  exclutRevenu: boolean;
  createdAt?: string | null;
}

export interface CreditRemboursement {
  id: string;
  creditId: string;
  date: string;
  montant: Numeric;
  note?: string | null;
}

export interface Credit {
  id: string;
  type: CreditType;
  intitule: string;
  preteur: string;
  montantTotal: Numeric;
  montantRembourse: Numeric;
  tauxInteret?: Numeric | null;
  dateDebut: string;
  dateEcheance?: string | null;
  statut: CreditStatut;
  notes?: string | null;
  remboursements?: CreditRemboursement[];
}

export interface ParcelExpeditionLot {
  id: string;
  clients: string;
  unite: string;
  quantite: Numeric;
  prixUnitaire: Numeric;
  montant?: Numeric;
  observations?: string | null;
}

export interface ParcelExpedition {
  id: string;
  reference: string;
  origine: string;
  origineLat?: Numeric | null;
  origineLng?: Numeric | null;
  destination: string;
  destinationLat?: Numeric | null;
  destinationLng?: Numeric | null;
  tracteurId?: string | null;
  remorqueuseId?: string | null;
  chauffeurId: string;
  dateDepart: string;
  dateArrivee?: string | null;
  statut: TripStatut;
  lots: ParcelExpeditionLot[];
  description?: string | null;
  commissionPct?: Numeric | null;
  dateCreation: string;
}

export interface AuditLog {
  id: string;
  module: string;
  action: string;
  entityId?: string | null;
  actorLogin?: string | null;
  actorRole?: string | null;
  summary?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  createdAt: string;
}
