// Vite config for the Studio renderer artifact.
// Produces a fully self-contained ES module with all dependencies bundled
// (preact, radix, tailwind CSS, decoder, events, refs, canvas, audio, etc.).
// No external imports may survive into the output — the blob URL loader
// only resolves relative imports between VFS files.

import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/studio_renderer.ts'),
      formats: ['es'],
      fileName: 'renderer',
    },
    rollupOptions: {
      // Bundle everything — no externals.
      external: [],
      output: {
        entryFileNames: '[name].js',
        // Keep as single chunk to simplify blob URL loading.
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
  },
});
