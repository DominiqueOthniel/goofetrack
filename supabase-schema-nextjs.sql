-- SIA-GOOFE - Schéma PostgreSQL pour Supabase (Next.js)
-- À exécuter dans le SQL Editor de Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trucks (Camions)
CREATE TABLE IF NOT EXISTS trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  immatriculation VARCHAR(50) NOT NULL,
  modele VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('tracteur', 'remorqueuse')),
  sous_type VARCHAR(30) CHECK (sous_type IN ('tracteur_seul', 'tracteur_jumele', 'remorque_seule')),
  remorque_immatriculation VARCHAR(50),
  statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  date_mise_en_circulation DATE NOT NULL,
  photo TEXT,
  proprietaire_id UUID,
  chauffeur_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers (Chauffeurs)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  cni VARCHAR(50),
  numero_permis VARCHAR(50),
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Third Parties (Tiers: clients, fournisseurs, propriétaires)
CREATE TABLE IF NOT EXISTS third_parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'fournisseur', 'proprietaire')),
  telephone VARCHAR(20),
  email VARCHAR(100),
  adresse TEXT,
  ville VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips (Trajets)
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_trajet VARCHAR(50) UNIQUE NOT NULL,
  tracteur_id UUID NOT NULL REFERENCES trucks(id) ON DELETE RESTRICT,
  remorque_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  chauffeur_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  ville_depart VARCHAR(100) NOT NULL,
  ville_arrivee VARCHAR(100) NOT NULL,
  date_depart DATE NOT NULL,
  date_arrivee DATE,
  statut VARCHAR(20) NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  distance_km NUMERIC(10, 2),
  notes_trajet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses (Dépenses)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trajet_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  camion_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  type_depense VARCHAR(20) NOT NULL CHECK (type_depense IN ('carburant', 'peage', 'reparation', 'autre')),
  montant NUMERIC(12, 2) NOT NULL,
  description TEXT,
  justificatif TEXT,
  date_depense DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices (Factures)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_facture VARCHAR(50) UNIQUE NOT NULL,
  tiers_id UUID NOT NULL REFERENCES third_parties(id) ON DELETE RESTRICT,
  trajet_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  montant NUMERIC(12, 2) NOT NULL,
  date_emission DATE NOT NULL,
  date_echeance DATE,
  payee BOOLEAN DEFAULT FALSE,
  date_paiement DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts (Comptes bancaires)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  numero_compte VARCHAR(50) NOT NULL,
  banque VARCHAR(100) NOT NULL,
  solde_initial NUMERIC(15, 2) DEFAULT 0,
  devise VARCHAR(10) DEFAULT 'XAF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Transactions (Transactions bancaires)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compte_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
  montant NUMERIC(15, 2) NOT NULL,
  description TEXT,
  categorie VARCHAR(50),
  reference VARCHAR(100),
  date_transaction DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caisse Config (Configuration caisse)
CREATE TABLE IF NOT EXISTS caisse_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solde_initial NUMERIC(15, 2) NOT NULL DEFAULT 0,
  date_initialisation DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Caisse Transactions (Transactions caisse)
CREATE TABLE IF NOT EXISTS caisse_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('entree', 'sortie')),
  montant NUMERIC(15, 2) NOT NULL,
  motif TEXT,
  reference VARCHAR(100),
  date_transaction DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits (Crédits / Prêts)
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tiers_id UUID NOT NULL REFERENCES third_parties(id) ON DELETE RESTRICT,
  montant_total NUMERIC(15, 2) NOT NULL,
  montant_rembourse NUMERIC(15, 2) DEFAULT 0,
  taux_interet NUMERIC(5, 2),
  date_debut DATE NOT NULL,
  date_fin DATE,
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'en_retard')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Remboursements (Remboursements de crédits)
CREATE TABLE IF NOT EXISTS credit_remboursements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  montant NUMERIC(15, 2) NOT NULL,
  date_remboursement DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parcel Expeditions (Expéditions de colis)
CREATE TABLE IF NOT EXISTS parcel_expeditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_expedition VARCHAR(50) UNIQUE NOT NULL,
  tracteur_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  chauffeur_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  ville_depart VARCHAR(100) NOT NULL,
  ville_arrivee VARCHAR(100) NOT NULL,
  date_expedition DATE NOT NULL,
  date_arrivee DATE,
  statut VARCHAR(20) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'livre', 'annule')),
  expediteur_nom VARCHAR(200) NOT NULL,
  expediteur_telephone VARCHAR(20),
  destinataire_nom VARCHAR(200) NOT NULL,
  destinataire_telephone VARCHAR(20),
  description_colis TEXT,
  poids NUMERIC(10, 2),
  montant_facture NUMERIC(12, 2),
  montant_paye BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personnel (Employés)
CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  poste VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(100),
  date_embauche DATE,
  salaire NUMERIC(12, 2),
  statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver Transactions (Transactions chauffeurs: avances, remboursements, salaires)
CREATE TABLE IF NOT EXISTS driver_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('avance', 'remboursement', 'salaire')),
  montant NUMERIC(12, 2) NOT NULL,
  description TEXT,
  date_transaction DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs (Logs d'audit)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  actor_login VARCHAR(100),
  actor_role VARCHAR(50),
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign Keys pour trucks
ALTER TABLE trucks 
  ADD CONSTRAINT fk_trucks_proprietaire 
  FOREIGN KEY (proprietaire_id) 
  REFERENCES third_parties(id) ON DELETE SET NULL;

ALTER TABLE trucks 
  ADD CONSTRAINT fk_trucks_chauffeur 
  FOREIGN KEY (chauffeur_id) 
  REFERENCES drivers(id) ON DELETE SET NULL;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_trucks_statut ON trucks(statut);
CREATE INDEX IF NOT EXISTS idx_trips_statut ON trips(statut);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(date_depart, date_arrivee);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_invoices_payee ON invoices(payee);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(date_transaction);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_parcel_expeditions_statut ON parcel_expeditions(statut);

-- Fonction de mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_third_parties_updated_at BEFORE UPDATE ON third_parties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_caisse_transactions_updated_at BEFORE UPDATE ON caisse_transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_parcel_expeditions_updated_at BEFORE UPDATE ON parcel_expeditions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON personnel FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS) sur toutes les tables
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE caisse_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_remboursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique d'accès simple (à personnaliser selon vos besoins)
CREATE POLICY "Enable all access for authenticated users" ON trucks FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON drivers FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON third_parties FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON trips FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON expenses FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON invoices FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON bank_accounts FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON bank_transactions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON caisse_config FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON caisse_transactions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON credits FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON credit_remboursements FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON parcel_expeditions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON personnel FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON driver_transactions FOR ALL USING (true);
CREATE POLICY "Enable all access for authenticated users" ON audit_logs FOR ALL USING (true);
