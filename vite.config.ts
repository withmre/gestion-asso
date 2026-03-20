import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Pour GitHub Pages : remplacez 'NOM_DU_REPO' par le nom exact de votre dépôt GitHub.
// Exemple : si votre repo s'appelle "gestion-asso", mettez base: '/gestion-asso/'
// Si vous utilisez un domaine custom ou un repo en username.github.io, mettez base: '/'
export default defineConfig({
  base: '/NOM_DU_REPO/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
