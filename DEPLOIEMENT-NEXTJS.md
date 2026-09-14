# Déploiement Next.js + Supabase sur Netlify

Guide complet pour déployer SIA-GOOFE sur Netlify avec Supabase.

## Prérequis

- Compte GitHub (gratuit)
- Compte Netlify (gratuit)
- Compte Supabase (gratuit)

## Étape 1 : Configuration Supabase

### 1.1 Créer le projet

1. Aller sur [supabase.com](https://supabase.com)
2. Cliquer sur **New Project**
3. Remplir :
   - **Name** : `goofe` (ou autre)
   - **Database Password** : Créer un mot de passe fort
   - **Region** : **Frankfurt (EU Central)**
4. Cliquer sur **Create new project**
5. Attendre 2-3 minutes que le projet soit prêt

### 1.2 Créer le schéma

1. Dans le projet Supabase, aller dans **SQL Editor**
2. Cliquer sur **New query**
3. Copier le contenu du fichier `supabase-schema-nextjs.sql`
4. Coller dans l'éditeur
5. Cliquer sur **Run** (en bas à droite)
6. Vérifier qu'il n'y a pas d'erreur

### 1.3 Récupérer les credentials

1. Aller dans **Project Settings** (icône engrenage en bas à gauche)
2. Cliquer sur **API** dans le menu
3. Copier :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (la longue clé qui commence par `eyJ...`)

## Étape 2 : Configuration Git

### 2.1 Préparer le dépôt

```bash
# Si pas encore fait
git init
git add .
git commit -m "Migration vers Next.js + Supabase"

# Pousser sur GitHub
git remote add origin https://github.com/votre-username/goofe.git
git branch -M main
git push -u origin main
```

### 2.2 Créer un fichier .env.local (local uniquement)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...votre_key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

⚠️ **Ne jamais commiter le fichier .env.local** (déjà dans .gitignore)

## Étape 3 : Déploiement sur Netlify

### 3.1 Créer le site

1. Aller sur [netlify.com](https://netlify.com)
2. Se connecter avec GitHub
3. Cliquer sur **Add new site** → **Import an existing project**
4. Choisir **GitHub**
5. Autoriser Netlify à accéder aux repos (si nécessaire)
6. Sélectionner le repo `goofe`

### 3.2 Configuration du build

Netlify détecte automatiquement Next.js. Vérifier :

- **Base directory** : (laisser vide)
- **Build command** : `npm run build`
- **Publish directory** : `.next`
- **Branch** : `main`

### 3.3 Configurer les variables d'environnement

1. Avant de déployer, cliquer sur **Advanced build settings**
2. Cliquer sur **New variable** et ajouter :

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` (votre clé anon) |
| `NEXT_PUBLIC_APP_URL` | *(laisser vide pour l'instant)* |

### 3.4 Déployer

1. Cliquer sur **Deploy [nom-du-site]**
2. Attendre 2-5 minutes
3. Une fois le build terminé, l'app sera disponible sur `https://[nom-aleatoire].netlify.app`

### 3.5 Configurer l'URL finale

1. Copier l'URL Netlify (ex: `https://goofe-app.netlify.app`)
2. Retourner dans **Site settings** → **Environment variables**
3. Éditer `NEXT_PUBLIC_APP_URL` et mettre l'URL Netlify
4. Netlify va automatiquement redéployer

### 3.6 (Optionnel) Personnaliser le domaine

1. Dans **Site settings** → **Domain management**
2. Cliquer sur **Options** → **Edit site name**
3. Changer en `goofe` → L'URL devient `https://goofe.netlify.app`

## Étape 4 : Vérification

### 4.1 Health check

Ouvrir dans le navigateur :
```
https://votre-site.netlify.app/api/health
```

Devrait retourner :
```json
{"status":"ok"}
```

### 4.2 Tester un endpoint

```bash
curl https://votre-site.netlify.app/api/trucks
```

Devrait retourner un tableau (vide au début) :
```json
[]
```

### 4.3 Créer un camion de test

```bash
curl -X POST https://votre-site.netlify.app/api/trucks \
  -H "Content-Type: application/json" \
  -d '{
    "immatriculation": "TEST-001",
    "modele": "Volvo FH16",
    "type": "tracteur",
    "statut": "actif",
    "dateMiseEnCirculation": "2023-01-15"
  }'
```

Devrait retourner le camion créé avec son UUID.

## Étape 5 : Configuration avancée

### 5.1 Domaine personnalisé

1. Dans Netlify : **Site settings** → **Domain management**
2. Cliquer sur **Add domain alias**
3. Entrer votre domaine (ex: `app.votredomaine.com`)
4. Suivre les instructions pour configurer les DNS

### 5.2 HTTPS automatique

Netlify configure automatiquement HTTPS avec Let's Encrypt. Rien à faire !

### 5.3 Notifications de déploiement

1. **Site settings** → **Build & deploy** → **Deploy notifications**
2. Configurer des notifications Slack, email, etc.

## Étape 6 : Déploiements futurs

### 6.1 Déploiement automatique

Chaque `git push` sur la branche `main` déclenchera automatiquement un nouveau déploiement.

```bash
git add .
git commit -m "Mise à jour"
git push
```

Netlify va :
1. Détecter le push
2. Lancer le build
3. Déployer automatiquement
4. Envoyer une notification

### 6.2 Preview deployments

Netlify crée automatiquement des "preview deployments" pour les Pull Requests :

1. Créer une branche : `git checkout -b feature/nouvelle-fonctionnalite`
2. Faire les modifications
3. Pousser : `git push origin feature/nouvelle-fonctionnalite`
4. Créer une Pull Request sur GitHub
5. Netlify va créer une preview URL unique pour tester

## Dépannage

### Build échoue

1. Vérifier les logs dans Netlify
2. Vérifier que les variables d'environnement sont bien configurées
3. Tester le build localement : `npm run build`

### API ne répond pas

1. Vérifier que les variables Supabase sont correctes
2. Vérifier dans Supabase que les tables sont créées
3. Vérifier les logs Netlify Functions

### CORS errors

Avec Next.js sur Netlify, il ne devrait pas y avoir de CORS car tout est sur la même origine.

Si des erreurs persistent :
1. Vérifier que les appels API utilisent `/api/*` (relatif)
2. Ne pas utiliser d'URL absolue pour les appels API internes

### Base de données inaccessible

1. Vérifier que le projet Supabase est actif
2. Vérifier les credentials (URL + anon key)
3. Vérifier que les RLS policies autorisent l'accès

## Coûts

### Plan gratuit (suffisant pour démarrer)

- **Netlify** :
  - 100 GB bande passante/mois
  - 300 minutes de build/mois
  - Sites illimités
  
- **Supabase** :
  - 500 MB de base de données
  - 1 GB de stockage fichiers
  - 2 GB de transfert
  - 50,000 utilisateurs actifs/mois

### Passage payant (si nécessaire plus tard)

- **Netlify Pro** : 19$/mois
  - 400 GB bande passante
  - Plus de performances
  
- **Supabase Pro** : 25$/mois
  - 8 GB base de données
  - 100 GB stockage
  - Support prioritaire

## Monitoring

### Netlify Analytics

1. **Analytics** dans le menu Netlify
2. Voir les visites, bande passante, etc.

### Supabase Dashboard

1. **Database** → **Tables** : voir les données
2. **API** → **Logs** : voir les requêtes API
3. **Reports** : statistiques d'utilisation

## Sécurité

### Row Level Security (RLS)

Le schéma SQL active RLS avec une politique permissive par défaut. Pour renforcer :

1. Dans Supabase, aller dans **Authentication** → **Policies**
2. Modifier les policies pour limiter l'accès selon les utilisateurs

### Variables secrètes

⚠️ Les variables `NEXT_PUBLIC_*` sont exposées au navigateur. Pour des secrets :

1. Utiliser des variables sans `NEXT_PUBLIC_` préfixe
2. Elles seront accessibles uniquement côté serveur (API routes)

## Récapitulatif

```
✅ Supabase configuré (Frankfurt)
✅ Schéma SQL créé
✅ Netlify configuré
✅ Variables d'environnement
✅ Déploiement automatique
✅ HTTPS automatique
✅ Preview deployments

🎉 Application en production !
```

**URLs finales** :
- Frontend : `https://goofe.netlify.app`
- API : `https://goofe.netlify.app/api/*`
- Health check : `https://goofe.netlify.app/api/health`
