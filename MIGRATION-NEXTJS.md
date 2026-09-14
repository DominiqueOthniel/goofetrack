# Guide de Migration vers Next.js + Supabase

## Vue d'ensemble

Ce document explique la migration de l'architecture **Vite + React + NestJS + Render/Railway** vers **Next.js + Supabase + Netlify**.

## Changements majeurs

### Architecture

#### Avant
```
Frontend (Vite + React)  →  Netlify
    ↓ API calls
Backend (NestJS)         →  Render/Railway  →  Supabase PostgreSQL
```

#### Après
```
Next.js (Frontend + API Routes)  →  Netlify  →  Supabase PostgreSQL
```

### Bénéfices

1. **Simplicité** : Un seul projet, un seul déploiement
2. **Coût** : 0€ (avant ~7€/mois pour Render)
3. **Performance** : Pas de cold start Render
4. **CORS** : Plus de problèmes de CORS (même origine)
5. **Maintenance** : Configuration unique

## Étapes de migration

### 1. Configuration Supabase

✅ **Fait** : Schéma SQL créé dans `supabase-schema-nextjs.sql`

**À faire par le développeur** :
1. Créer un projet Supabase (gratuit, Frankfurt)
2. Exécuter le schéma SQL dans le SQL Editor
3. Récupérer les credentials (URL + anon key)

### 2. API Routes Next.js

✅ **Fait** : Toutes les routes API créées dans `/app/api/`

**Modules migrés** :
- `/api/trucks` - Gestion des camions
- `/api/drivers` - Gestion des chauffeurs
- `/api/trips` - Gestion des trajets
- `/api/expenses` - Gestion des dépenses
- `/api/invoices` - Gestion des factures
- `/api/third-parties` - Gestion des tiers
- `/api/bank/accounts` - Comptes bancaires
- `/api/bank/transactions` - Transactions bancaires
- `/api/caisse/config` - Configuration caisse
- `/api/caisse/transactions` - Transactions caisse
- `/api/credits` - Gestion des crédits
- `/api/parcel-expeditions` - Expéditions colis
- `/api/personnel` - Gestion du personnel
- `/api/audit-logs` - Logs d'audit

**Équivalences NestJS → Next.js** :

| NestJS | Next.js |
|--------|---------|
| `@Controller()` | `app/api/[resource]/route.ts` |
| `@Get()` | `export async function GET()` |
| `@Post()` | `export async function POST()` |
| `@Patch()` | `export async function PATCH()` |
| `@Delete()` | `export async function DELETE()` |
| `@Param('id')` | `params.id` dans les props |
| TypeORM | Supabase Client |

### 3. Migration du Frontend

🔄 **À faire** : Le frontend React dans `/src` doit être migré vers Next.js

**Changements requis** :

#### Structure des fichiers
```
Avant: src/pages/Trucks.tsx
Après: app/trucks/page.tsx
```

#### Appels API
```typescript
// Avant
const API_URL = import.meta.env.VITE_API_URL;
const response = await fetch(`${API_URL}/trucks`);

// Après
const response = await fetch('/api/trucks');
```

#### Composants
```typescript
// Avant (React client-only)
import { useState } from 'react';

// Après (Next.js client component)
'use client';
import { useState } from 'react';
```

### 4. Variables d'environnement

#### Avant (.env)
```env
VITE_API_URL=https://backend.onrender.com/api
```

#### Après (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 5. Scripts npm

#### Avant (Vite)
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

#### Après (Next.js)
```json
{
  "dev": "next dev -p 3001",
  "build": "next build",
  "start": "next start"
}
```

### 6. Déploiement

#### Avant
- Frontend : Netlify
- Backend : Render (avec configuration séparée)
- DB : Supabase

#### Après
- Application complète : Netlify
- DB : Supabase

**Fichier de configuration** : `netlify.toml` (déjà créé)

## Correspondance des entités

Toutes les entités TypeORM ont été converties en tables Supabase avec les mêmes champs.

### Exemple : Truck

#### NestJS (TypeORM)
```typescript
@Entity('trucks')
export class Truck {
  @PrimaryColumn('uuid')
  id: string;
  
  @Column()
  immatriculation: string;
  
  @ManyToOne(() => Driver)
  chauffeur?: Driver;
}
```

#### Next.js (Supabase)
```typescript
const { data, error } = await supabase
  .from('trucks')
  .select('*, chauffeur:drivers!chauffeurId(*)')
  .eq('id', id);
```

## Checklist de migration

### Backend
- [x] Créer les API routes Next.js
- [x] Configurer le client Supabase
- [x] Créer le schéma SQL
- [x] Migrer tous les endpoints
- [x] Ajouter les helpers (error handling)

### Frontend
- [ ] Migrer les pages React vers Next.js
- [ ] Mettre à jour les appels API
- [ ] Convertir les composants en client/server components
- [ ] Tester toutes les fonctionnalités

### Configuration
- [x] Créer `next.config.js`
- [x] Créer `netlify.toml`
- [x] Créer `.env.example`
- [x] Mettre à jour `package.json`

### Déploiement
- [ ] Configurer Supabase en production
- [ ] Configurer les variables Netlify
- [ ] Tester le déploiement
- [ ] Migrer les données (si nécessaire)

### Nettoyage
- [ ] Supprimer le dossier `/backend` (après tests)
- [ ] Supprimer les fichiers Vite (`vite.config.ts`, `index.html`)
- [ ] Nettoyer les dépendances inutilisées

## Points d'attention

### 1. Relations entre tables

Les relations TypeORM ont été remplacées par des foreign keys SQL. Supabase les gère automatiquement avec la syntaxe :

```typescript
.select('*, relation:table!foreignKey(*)')
```

### 2. UUID

Tous les IDs sont des UUID générés avec `uuid_generate_v4()` dans Supabase ou `uuidv4()` côté Next.js.

### 3. Timestamps

Les champs `created_at` et `updated_at` sont gérés automatiquement par des triggers SQL.

### 4. Validation

La validation est actuellement minime. Pour renforcer :

```typescript
import { z } from 'zod';

const TruckSchema = z.object({
  immatriculation: z.string().min(1),
  modele: z.string().min(1),
  type: z.enum(['tracteur', 'remorqueuse']),
  // ...
});
```

## Rollback

Si besoin de revenir en arrière :

1. Le backend NestJS est conservé dans `/backend`
2. Le frontend React est dans `/src`
3. Remettre les anciens scripts npm
4. Redéployer séparément

## Support

- Next.js : https://nextjs.org/docs
- Supabase : https://supabase.com/docs
- Netlify : https://docs.netlify.com
