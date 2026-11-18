/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: { firebase: ['firebase/app', 'firebase/firestore'], react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
