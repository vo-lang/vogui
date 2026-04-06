// Vite config for the Studio host bridge artifact.
// Produces a self-contained ES module with text measurement (@chenglou/pretext)
// and DOM ref access functions. Used by Studio to build WASM import entries
// for the web path.

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/studio_host_bridge.ts'),
      formats: ['es'],
      fileName: 'host_bridge',
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
