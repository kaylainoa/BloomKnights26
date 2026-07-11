import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Expose the sponsor API keys from .env to import.meta.env alongside the
  // default VITE_ prefix (keys were provided without a VITE_ prefix).
  envPrefix: ['VITE_', 'GOOGLE_', 'GEMINI_', 'NREL_', 'EIA_', 'CENSUS_'],
})
