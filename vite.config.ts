import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  // Relative assets make the built site work both at a user site root and at
  // https://<user>.github.io/<repo>/. Dev keeps the root base.
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  server: { port: 5173 },
}))
