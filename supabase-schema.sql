-- SIA-GOOFE : schema PostgreSQL pour Supabase
--
-- A executer dans le SQL Editor de Supabase sur un projet vierge.
-- Les colonnes composees sont en camelCase et donc entre guillemets : c'est le
-- nommage cree par l'ancien backend TypeORM, conserve pour rester compatible
-- avec les bases existantes et avec le frontend.

-- `gen_random_uuid()` fait partie du coeur de PostgreSQL depuis la version 13,
-- aucune extension n'est necessaire.

-- Tiers : clients, fournisseurs, proprietaires de camions
CREATE TABLE IF NOT EXISTS third_parties (
  id UUID PRIMARY KEY,
  nom VARCHAR NOT NULL,
  telephone VARCHAR,
  email VARCHAR,
  adresse TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('proprietaire', 'client', 'fournisseur')),
  notes TEXT
);

-- Personnel salarie et stagiaires
CREATE TABLE IF NOT EXISTS personnel (
  id UUID PRIMARY KEY,
  nom VARCHAR NOT NULL,
  prenom VARCHAR NOT NULL,
  telephone VARCHAR,
  email VARCHAR,
  type VARCHAR(20) NOT NULL CHECK (type IN ('stagiaire', 'employe')),
  poste VARCHAR,
  statut VARCHAR(20) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
  "salaireMensuel" NUMERIC(15, 2),
  "dateEmbauche" DATE,
  notes TEXT
);

-- Chauffeurs
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY,
  nom VARCHAR NOT NULL,
  prenom VARCHAR NOT NULL,
  telephone VARCHAR NOT NULL,
  cni VARCHAR,
  "numeroPermis" VARCHAR,
  photo VARCHAR
);

-- Avances et remboursements rattaches a un chauffeur
CREATE TABLE IF NOT EXISTS driver_transactions (
  id UUID PRIMARY KEY,
  "driverId" UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('apport', 'sortie')),
  montant NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL
);

-- Camions : tracteurs et remorqueuses
CREATE TABLE IF NOT EXISTS trucks (
  id UUID PRIMARY KEY,
  immatriculation VARCHAR NOT NULL,
  modele VARCHAR NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('tracteur', 'remorqueuse')),
  "sousType" VARCHAR(30),
  "remorqueImmatriculation" VARCHAR,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('actif', 'inactif')),
  "dateMiseEnCirculation" DATE NOT NULL,
  photo VARCHAR,
  "proprietaireId" UUID REFERENCES third_parties(id),
  "chauffeurId" UUID REFERENCES drivers(id)
);

-- Trajets, avec prise en charge d'un chauffeur remplacant en cours de route
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY,
  "tracteurId" UUID REFERENCES trucks(id),
  "remorqueuseId" UUID REFERENCES trucks(id),
  origine VARCHAR NOT NULL,
  destination VARCHAR NOT NULL,
  "origineLat" NUMERIC(10, 7),
  "origineLng" NUMERIC(10, 7),
  "destinationLat" NUMERIC(10, 7),
  "destinationLng" NUMERIC(10, 7),
  "chauffeurId" UUID NOT NULL REFERENCES drivers(id),
  "chauffeurRemplacantId" UUID REFERENCES drivers(id),
  "remplacementDate" DATE,
  "remplacementLieu" VARCHAR,
  "remplacementMotif" TEXT,
  "recetteChauffeurInitial" NUMERIC(15, 2),
  "recetteChauffeurRemplacant" NUMERIC(15, 2),
  "prefinancementChauffeurInitial" NUMERIC(15, 2),
  "prefinancementChauffeurRemplacant" NUMERIC(15, 2),
  "dateDepart" DATE NOT NULL,
  "dateArrivee" DATE,
  recette NUMERIC(15, 2) NOT NULL,
  prefinancement NUMERIC(15, 2),
  client VARCHAR,
  marchandise VARCHAR,
  description TEXT,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule'))
);

-- Depenses : carburant, peage, maintenance, salaires
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  "camionId" UUID REFERENCES trucks(id),
  "tripId" UUID,
  "chauffeurId" UUID,
  categorie VARCHAR NOT NULL,
  "sousCategorie" VARCHAR,
  "fournisseurId" UUID REFERENCES third_parties(id),
  "personnelId" UUID REFERENCES personnel(id),
  montant NUMERIC(15, 2) NOT NULL,
  quantite NUMERIC(12, 2),
  "prixUnitaire" NUMERIC(12, 2),
  date DATE NOT NULL,
  description TEXT NOT NULL
);

-- Factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY,
  numero VARCHAR NOT NULL,
  "trajetId" UUID,
  "parcelExpeditionId" UUID,
  "expenseId" UUID,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('en_attente', 'payee')),
  "montantHT" NUMERIC(15, 2) NOT NULL,
  remise NUMERIC(5, 2),
  "montantHTApresRemise" NUMERIC(15, 2),
  tva NUMERIC(15, 2),
  tps NUMERIC(15, 2),
  "montantTTC" NUMERIC(15, 2) NOT NULL,
  "montantPaye" NUMERIC(15, 2),
  "dateCreation" DATE NOT NULL,
  "datePaiement" DATE,
  "modePaiement" VARCHAR,
  notes TEXT
);

-- Comptes bancaires
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY,
  nom VARCHAR NOT NULL,
  "numeroCompte" VARCHAR NOT NULL,
  banque VARCHAR NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('courant', 'epargne', 'professionnel')),
  "soldeInitial" NUMERIC(15, 2) NOT NULL,
  "soldeActuel" NUMERIC(15, 2) NOT NULL,
  devise VARCHAR(10) NOT NULL DEFAULT 'FCFA',
  iban VARCHAR,
  swift VARCHAR,
  notes TEXT
);

-- Mouvements bancaires
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY,
  "compteId" UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('depot', 'retrait', 'virement', 'prelevement', 'frais')),
  montant NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference VARCHAR,
  beneficiaire VARCHAR,
  categorie VARCHAR
);

-- Configuration de la caisse : une seule ligne, d'identifiant 1
CREATE TABLE IF NOT EXISTS caisse_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  "soldeInitial" NUMERIC(15, 2) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO caisse_config (id, "soldeInitial")
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Operations de caisse. L'identifiant est une chaine car le frontend genere des
-- references metier lisibles plutot que des UUID.
CREATE TABLE IF NOT EXISTS caisse_transactions (
  id VARCHAR(128) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie')),
  montant NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  utilisateur VARCHAR(120),
  categorie VARCHAR(255),
  reference VARCHAR(255),
  "compteBanqueId" UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  "bankTransactionId" VARCHAR(128),
  "exclutRevenu" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Emprunts et prets accordes
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('emprunt', 'pret_accorde')),
  intitule VARCHAR NOT NULL,
  preteur VARCHAR NOT NULL,
  "montantTotal" NUMERIC(15, 2) NOT NULL,
  "montantRembourse" NUMERIC(15, 2) NOT NULL DEFAULT 0,
  "tauxInteret" NUMERIC(15, 2),
  "dateDebut" DATE NOT NULL,
  "dateEcheance" DATE,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('en_cours', 'solde', 'en_retard')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS credit_remboursements (
  id UUID PRIMARY KEY,
  "creditId" UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  montant NUMERIC(15, 2) NOT NULL,
  note TEXT
);

-- Expeditions de colis : les lots sont stockes en JSON
CREATE TABLE IF NOT EXISTS parcel_expeditions (
  id UUID PRIMARY KEY,
  reference VARCHAR NOT NULL,
  origine VARCHAR NOT NULL,
  "origineLat" NUMERIC(10, 7),
  "origineLng" NUMERIC(10, 7),
  destination VARCHAR NOT NULL,
  "destinationLat" NUMERIC(10, 7),
  "destinationLng" NUMERIC(10, 7),
  "tracteurId" UUID REFERENCES trucks(id),
  "remorqueuseId" UUID REFERENCES trucks(id),
  "chauffeurId" UUID NOT NULL REFERENCES drivers(id),
  "dateDepart" DATE NOT NULL,
  "dateArrivee" DATE,
  statut VARCHAR(20) NOT NULL CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  lots JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  "commissionPct" NUMERIC(5, 2),
  "dateCreation" DATE NOT NULL
);

-- Journal d'audit alimente par les routes API
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  "entityId" VARCHAR(128),
  "actorLogin" VARCHAR(120),
  "actorRole" VARCHAR(30),
  summary TEXT,
  "beforeData" JSONB,
  "afterData" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur les colonnes utilisees pour trier et filtrer
CREATE INDEX IF NOT EXISTS idx_trips_date_depart ON trips ("dateDepart" DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_date_creation ON invoices ("dateCreation" DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_compte ON bank_transactions ("compteId");
CREATE INDEX IF NOT EXISTS idx_caisse_transactions_date ON caisse_transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_caisse_transactions_reference ON caisse_transactions (reference);
CREATE INDEX IF NOT EXISTS idx_parcel_expeditions_date ON parcel_expeditions ("dateDepart" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs (module);

-- Le solde courant d'un compte est recalcule a chaque mouvement.
CREATE OR REPLACE FUNCTION recalculate_bank_solde(account_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE bank_accounts
  SET "soldeActuel" = "soldeInitial" + COALESCE((
    SELECT SUM(
      CASE WHEN type IN ('depot', 'virement') THEN montant ELSE -montant END
    )
    FROM bank_transactions
    WHERE "compteId" = account_id
  ), 0)
  WHERE id = account_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_bank_tx_recalc()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_bank_solde(OLD."compteId");
    RETURN OLD;
  END IF;

  PERFORM recalculate_bank_solde(NEW."compteId");
  IF TG_OP = 'UPDATE' AND OLD."compteId" IS DISTINCT FROM NEW."compteId" THEN
    PERFORM recalculate_bank_solde(OLD."compteId");
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bank_transactions_recalc ON bank_transactions;
CREATE TRIGGER bank_transactions_recalc
AFTER INSERT OR UPDATE OR DELETE ON bank_transactions
FOR EACH ROW EXECUTE FUNCTION trg_bank_tx_recalc();
