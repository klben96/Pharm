import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        client: resolve(__dirname, 'client/index.html'),
        pharmacy: resolve(__dirname, 'pharmacy/index.html'),
        deliverer: resolve(__dirname, 'deliverer/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
})
