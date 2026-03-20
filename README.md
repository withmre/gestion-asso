# Gestion Associative — Outil de pilotage

Application web de gestion comptable et analytique pour association.
100% statique, hébergeable sur GitHub Pages, aucun serveur requis.

## Fonctionnalités

- Gestion des membres (adhérents, membres, Discord)
- Comptabilité complète (adhésions, dons, ventes, dépenses)
- Comptabilité en partie double (journal, balance)
- Bilan comptable (actif/passif, amortissements)
- Subventions et financements (suivi des dossiers)
- CTF & compétitions
- Partenaires & sponsors
- Suivi du mentorat (sessions, binômes, thématiques)
- KPIs personnalisés (constructeur de formules)
- Dashboard analytique (score de santé, projection de trésorerie)
- Générateur de certificats PDF (adhésion, CTF, mentorat)
- Visuels pour les réseaux sociaux (Instagram, LinkedIn, Story)
- Import HelloAsso (CSV) et Discord (JSON)
- Export Excel mensuel et annuel
- Chiffrement AES-256-GCM des exports
- Compression ZIP / GZ des exports
- Versioning automatique des sauvegardes
- Mode sombre
- Verrouillage par code PIN
- Onboarding guidé

## Déploiement sur GitHub Pages

### 1. Configurer la base URL

Ouvrez `vite.config.ts` et remplacez `NOM_DU_REPO` par le nom de votre dépôt :

```ts
base: '/votre-repo/',
```

### 2. Pousser sur GitHub

Uploadez tous les fichiers dans un dépôt public GitHub,
puis activez GitHub Pages dans Settings → Pages → Branch: `gh-pages`.

Le workflow `.github/workflows/deploy.yml` s'occupe du build et du déploiement
automatiquement à chaque push sur `main`.

## Développement local

```bash
npm install
npm run dev
```

## Données

Toutes les données sont stockées dans le `localStorage` de votre navigateur.
**Exportez régulièrement** depuis Paramètres → Sauvegarde des données.

## Licence

CC BY-NC-ND 4.0 — Utilisation personnelle et associative libre.
Usage commercial et redistribution du code interdits.

© 2025 withmre
