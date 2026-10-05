import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        workbench: 'workbench.html',
        originals: 'originals.html',
        read: 'read.html',
      },
    },
  },
  server: {
    allowedHosts: [
      '24bb-105-163-156-123.ngrok-free.app',
    ],
  },
})
