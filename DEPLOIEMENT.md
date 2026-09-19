# Guide de déploiement — SIA-GOOFE

## Architecture

L'application est un projet **Next.js 14** unique : le frontend React et l'API
sont servis par la même application, sur la même origine.

```
Next.js (app/ + src/)  ->  Netlify  ->  Supabase (PostgreSQL)
```

- **Frontend** : l'application React existante (`src/`) est montée par la route
  attrape-tout `app/[[...slug]]/page.tsx`, côté navigateur uniquement.
- **API** : les routes `app/api/**` remplacent l'ancien backend NestJS.
- **Base de données** : Supabase, interrogée via `@supabase/supabase-js`.

Il n'y a plus de service backend séparé : ni Render, ni Railway, ni Koyeb. Le
dossier `backend/` est conservé à titre de référence mais n'est plus déployé.

---

## Étape 1 — Supabase

1. Créer un projet sur [supabase.com](https://supabase.com), région **Frankfurt (EU Central)**.
2. Ouvrir **SQL Editor**, puis exécuter le contenu de `supabase-schema.sql`.
3. Relever les identifiants dans **Project Settings → API** :
   - **Project URL**
   - clé **anon / public**

> Les colonnes composées sont en camelCase et donc entre guillemets dans le
> schéma (`"dateMiseEnCirculation"`). C'est le nommage créé par l'ancien backend
> TypeORM : il est conservé pour rester compatible avec une base existante.

Si votre base a déjà été alimentée par l'ancien backend NestJS, il n'y a rien à
exécuter : le schéma est identique.

---

## Étape 2 — Variables d'environnement Netlify

Dans **Site settings → Environment variables** :

| Variable | Valeur |
|---|---|
| `SUPABASE_URL` | l'URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | la clé **service_role** (Project Settings → API) |

Ces deux variables suffisent. Toute variable `VITE_API_URL` héritée de
l'ancienne architecture peut être supprimée : elle n'est plus lue.

**Pourquoi la clé `service_role` et non la clé `anon`, et pourquoi sans préfixe
`NEXT_PUBLIC_`** : seules les routes API interrogent la base, et elles tournent
côté serveur. Une variable `NEXT_PUBLIC_*` serait au contraire intégrée au
bundle JavaScript envoyé au navigateur, donc lisible par n'importe quel
visiteur. Comme l'application n'impose aucune authentification sur ses routes,
une clé exposée permettrait d'écrire directement en base. Le schéma active donc
RLS sans aucune politique : tout accès direct depuis un navigateur est refusé,
et seule la clé `service_role`, qui contourne RLS, fonctionne côté serveur.

Les anciens noms `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
restent acceptés pour ne pas casser un déploiement existant, mais la clé anon
seule sera refusée par RLS.

---

## Étape 3 — Déploiement

1. Sur [netlify.com](https://netlify.com) : **Add new site → Import from Git**.
2. Sélectionner le dépôt. La configuration est déjà dans `netlify.toml` :
   - commande de build : `npm run build`
   - dossier publié : `.next`
   - extension `@netlify/plugin-nextjs`
3. **Deploy site**.

Chaque `git push` sur `main` déclenche un déploiement, et chaque pull request
obtient une URL de prévisualisation.

---

## Vérification après déploiement

```bash
curl https://votre-site.netlify.app/api/health
# {"status":"ok"}

curl https://votre-site.netlify.app/api/trucks
# [] sur une base vide, sinon la liste des camions
```

Si `/api/health` répond mais que les autres routes renvoient
`Supabase non configure`, les variables d'environnement ne sont pas définies.

Si les routes répondent `[]` alors que la base contient des données, c'est que
la clé utilisée est la clé `anon` : RLS bloque la lecture. Remplacez-la par la
clé `service_role`.

---

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseigner les deux variables Supabase
npm run dev                  # http://localhost:3001
```

Autres commandes utiles :

```bash
npm run build           # build de production
npx tsc --noEmit        # vérification des types
npm run verify:schema   # execute supabase-schema.sql dans PGlite et controle
                        # que chaque table et colonne utilisee par le code existe
```

---

## Points d'attention

- **Suppressions** : les routes `DELETE` renvoient `204` sans corps.
- **Erreurs** : le corps d'erreur est `{ "message": "..." }`, format lu par le
  client API du frontend.
- **Journal d'audit** : les mutations écrivent dans `audit_logs` à partir des
  en-têtes `x-actor-login` et `x-actor-role`. Une écriture d'audit qui échoue
  n'interrompt jamais l'opération métier.
- **Montants** : PostgreSQL renvoie les colonnes `numeric` sous forme de chaîne.
  Le frontend accepte `number | string`, ne pas « corriger » ce point sans
  vérifier les normaliseurs de `src/contexts/AppContext.tsx`.
