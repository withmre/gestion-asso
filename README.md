# Gestion Associative V3

Application web de gestion comptable et analytique pour association.
100% statique — aucun serveur requis. Hebergeable sur GitHub Pages.

## Installation

```bash
npm install
npm run dev        # Developpement local
npm run build      # Generer le dossier dist/
```

## Deploiement sur GitHub Pages

### 1. Configurer la base URL

Ouvrez `vite.config.ts` et remplacez `NOM_DU_REPO` par le nom exact de votre depot GitHub :

```ts
base: '/nom-de-votre-repo/',
```

Si vous utilisez un domaine custom ou un repo `username.github.io`, mettez :
```ts
base: '/',
```

### 2. Build et deploiement manuel

```bash
npm run build
```

Puis poussez le contenu du dossier `dist/` sur la branche `gh-pages` :

```bash
# Installer gh-pages une fois
npm install -g gh-pages

# Deployer
gh-pages -d dist
```

### 3. Via GitHub Actions (automatique)

Creez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Puis dans les Settings de votre repo GitHub :
- Pages > Source > Deploy from a branch > gh-pages

## Donnees

Toutes les donnees sont stockees dans le localStorage de votre navigateur.
**Pensez a exporter regulierement vos donnees** depuis la page Parametres.

Développé et pensé pour des besoins spécifiques, peut ne pas convenir à tout usage.
