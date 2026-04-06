// Vite config for the Studio protocol artifact.
// Produces a lightweight ES module (~2KB) containing only the binary decoder
// and external widget handler ID query logic. No UI framework dependencies.

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/studio_protocol.ts'),
      formats: ['es'],
      fileName: 'protocol',
    },
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: '[name].js',
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
