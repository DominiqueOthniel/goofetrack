# SIA-GOOFE - Next.js + Supabase

Application de gestion de flotte de transport migrée vers **Next.js 14** avec backend intégré et **Supabase** comme base de données.

## Avantages de cette architecture

✅ **Un seul déploiement** : Frontend + Backend sur Netlify  
✅ **Pas de backend séparé** : Plus besoin de Render, Railway ou Koyeb  
✅ **Base de données gratuite** : Supabase (500 MB, Frankfurt)  
✅ **API Routes intégrées** : `/app/api/*`  
✅ **Scalabilité** : Netlify gère l'auto-scaling  
✅ **Coût** : Complètement gratuit (Netlify + Supabase free tiers)

## Architecture

```
/app
  /api
    /trucks              # CRUD camions
    /drivers             # CRUD chauffeurs
    /trips               # CRUD trajets
    /expenses            # CRUD dépenses
    /invoices            # CRUD factures
    /third-parties       # CRUD tiers
    /bank
      /accounts          # Comptes bancaires
      /transactions      # Transactions bancaires
    /caisse
      /config            # Configuration caisse
      /transactions      # Transactions caisse
    /credits             # Crédits
    /audit-logs          # Logs d'audit
    /parcel-expeditions  # Expéditions colis
    /personnel           # Personnel
    /health              # Health check
  layout.tsx             # Layout principal
  page.tsx               # Page d'accueil
  globals.css            # Styles globaux
/lib
  /db
    supabase.ts          # Client Supabase
    types.ts             # Types TypeScript
  api-response.ts        # Helpers API
/backend                 # Ancien backend NestJS (à supprimer après migration complète)
```

## Installation et Configuration

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd goofe
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Choisir la région **Frankfurt (EU Central)**
3. Dans le SQL Editor, exécuter le fichier `supabase-schema-nextjs.sql`
4. Récupérer les credentials :
   - Project Settings → API
   - Copier `Project URL` et `anon public` key

### 3. Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Développement local

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3001`

## API Endpoints

Tous les endpoints sont préfixés par `/api` :

| Ressource | GET (liste) | GET (un) | POST | PATCH | DELETE |
|-----------|-------------|----------|------|-------|--------|
| Camions | `/api/trucks` | `/api/trucks/:id` | ✅ | ✅ | ✅ |
| Chauffeurs | `/api/drivers` | `/api/drivers/:id` | ✅ | ✅ | ✅ |
| Trajets | `/api/trips` | `/api/trips/:id` | ✅ | ✅ | ✅ |
| Dépenses | `/api/expenses` | `/api/expenses/:id` | ✅ | ✅ | ✅ |
| Factures | `/api/invoices` | `/api/invoices/:id` | ✅ | ✅ | ✅ |
| Tiers | `/api/third-parties` | `/api/third-parties/:id` | ✅ | ✅ | ✅ |
| Comptes bancaires | `/api/bank/accounts` | `/api/bank/accounts/:id` | ✅ | ✅ | ✅ |
| Transactions banque | `/api/bank/transactions` | `/api/bank/transactions/:id` | ✅ | ✅ | ✅ |
| Config caisse | `/api/caisse/config` | - | ✅ | - | - |
| Transactions caisse | `/api/caisse/transactions` | `/api/caisse/transactions/:id` | ✅ | ✅ | ✅ |
| Crédits | `/api/credits` | `/api/credits/:id` | ✅ | ✅ | ✅ |
| Expéditions colis | `/api/parcel-expeditions` | `/api/parcel-expeditions/:id` | ✅ | ✅ | ✅ |
| Personnel | `/api/personnel` | `/api/personnel/:id` | ✅ | ✅ | ✅ |
| Audit logs | `/api/audit-logs` | - | ✅ | - | - |

**Health check** : `GET /api/health` → `{"status":"ok"}`

## Déploiement sur Netlify

### 1. Configuration du projet

Le fichier `netlify.toml` est déjà configuré :

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### 2. Déployer

1. Pousser le code sur GitHub
2. Aller sur [netlify.com](https://netlify.com)
3. **New site** → **Import from Git**
4. Sélectionner le repo
5. Netlify détecte automatiquement Next.js

### 3. Variables d'environnement sur Netlify

Dans **Site settings** → **Environment variables**, ajouter :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_APP_URL=https://votre-app.netlify.app
```

### 4. Déployer

Cliquer sur **Deploy site**. L'application sera disponible sur `https://votre-app.netlify.app`

## Connexion du Frontend

Le frontend React existant dans `/src` doit être migré vers Next.js avec :

1. Conversion en composants serveur/client Next.js
2. Mise à jour des appels API vers `/api/*`
3. Utilisation de `fetch` ou de librairies comme `swr` ou `react-query`

Exemple de requête :

```typescript
// Avant (avec backend NestJS séparé)
const response = await fetch('https://backend.onrender.com/api/trucks');

// Après (avec Next.js)
const response = await fetch('/api/trucks');
```

## Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Base de données** : Supabase (PostgreSQL)
- **Client DB** : @supabase/supabase-js
- **Styling** : Tailwind CSS + shadcn/ui
- **Validation** : Zod (déjà dans le projet)
- **Déploiement** : Netlify
- **Hébergement DB** : Supabase (Frankfurt, EU)

## Avantages vs NestJS séparé

| Critère | NestJS séparé | Next.js intégré |
|---------|---------------|-----------------|
| **Déploiements** | 2 (Front + Back) | 1 (Tout-en-un) |
| **Services requis** | Netlify + Render/Railway | Netlify uniquement |
| **Cold start** | Oui (Render free) | Non (Netlify serverless) |
| **Configuration** | Double | Simple |
| **CORS** | À configurer | Pas de CORS (même origine) |
| **Coût** | ~7$/mois minimum | 0$ (free tier) |
| **Maintenance** | Plus complexe | Plus simple |

## Migration Progressive

Le dossier `/backend` NestJS est conservé pour référence. Une fois la migration du frontend terminée et testée, il pourra être supprimé.

### Prochaines étapes

1. ✅ API Routes Next.js créées
2. ✅ Configuration Supabase
3. ✅ Schéma SQL
4. 🔄 Migration du frontend React
5. 🔄 Tests des endpoints
6. 🔄 Déploiement sur Netlify

## Support

Pour toute question sur la migration, consulter :
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Netlify](https://docs.netlify.com)
