export type TruckType = 'tracteur' | 'remorqueuse';
export type TruckStatus = 'actif' | 'inactif';
export type TruckSousType = 'tracteur_seul' | 'tracteur_jumele' | 'remorque_seule';

export interface Truck {
  id: string;
  immatriculation: string;
  modele: string;
  type: TruckType;
  sousType?: TruckSousType;
  remorqueImmatriculation?: string;
  statut: TruckStatus;
  dateMiseEnCirculation: string;
  photo?: string;
  proprietaireId?: string;
  chauffeurId?: string;
}

export interface Driver {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  cni?: string;
  numeroPermis?: string;
  photo?: string;
}

export type TripStatus = 'planifie' | 'en_cours' | 'termine' | 'annule';

export interface Trip {
  id: string;
  numeroTrajet: string;
  tracteurId: string;
  remorqueId?: string;
  chauffeurId: string;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string;
  dateArrivee?: string;
  statut: TripStatus;
  distanceKm?: number;
  notesTrajet?: string;
}

export type ExpenseType = 'carburant' | 'peage' | 'reparation' | 'autre';

export interface Expense {
  id: string;
  trajetId?: string;
  camionId?: string;
  typeDepense: ExpenseType;
  montant: number;
  description?: string;
  justificatif?: string;
  dateDepense: string;
}

export interface Invoice {
  id: string;
  numeroFacture: string;
  tiersId: string;
  trajetId?: string;
  montant: number;
  dateEmission: string;
  dateEcheance?: string;
  payee: boolean;
  datePaiement?: string;
  notes?: string;
}

export interface ThirdParty {
  id: string;
  nom: string;
  type: 'client' | 'fournisseur' | 'proprietaire';
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
}

export interface BankAccount {
  id: string;
  nom: string;
  numeroCompte: string;
  banque: string;
  soldeInitial: number;
  devise: string;
}

export interface BankTransaction {
  id: string;
  compteId: string;
  type: 'credit' | 'debit';
  montant: number;
  description?: string;
  categorie?: string;
  reference?: string;
  dateTransaction: string;
}

export interface CaisseConfig {
  id: string;
  soldeInitial: number;
  dateInitialisation: string;
}

export interface CaisseTransaction {
  id: string;
  type: 'entree' | 'sortie';
  montant: number;
  motif?: string;
  reference?: string;
  dateTransaction: string;
}

export interface Credit {
  id: string;
  tiersId: string;
  montantTotal: number;
  montantRembourse: number;
  tauxInteret?: number;
  dateDebut: string;
  dateFin?: string;
  statut: 'actif' | 'termine' | 'en_retard';
  notes?: string;
}

export interface CreditRemboursement {
  id: string;
  creditId: string;
  montant: number;
  dateRemboursement: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorLogin?: string;
  actorRole?: string;
  details?: string;
  timestamp: string;
}

export interface ParcelExpedition {
  id: string;
  numeroExpedition: string;
  tracteurId?: string;
  chauffeurId?: string;
  villeDepart: string;
  villeArrivee: string;
  dateExpedition: string;
  dateArrivee?: string;
  statut: 'planifie' | 'en_cours' | 'livre' | 'annule';
  expediteurNom: string;
  expediteurTelephone?: string;
  destinataireNom: string;
  destinataireTelephone?: string;
  descriptionColis?: string;
  poids?: number;
  montantFacture?: number;
  montantPaye?: boolean;
  notes?: string;
}

export interface Personnel {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  telephone?: string;
  email?: string;
  dateEmbauche?: string;
  salaire?: number;
  statut: 'actif' | 'inactif';
}

export interface DriverTransaction {
  id: string;
  driverId: string;
  type: 'avance' | 'remboursement' | 'salaire';
  montant: number;
  description?: string;
  dateTransaction: string;
}
