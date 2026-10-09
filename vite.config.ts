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
      '66da-105-163-2-202.ngrok-free.app',
    ],
  },
})
