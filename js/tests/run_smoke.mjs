import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smokeEntries = Object.freeze([
  'tests/ref_actions_smoke.ts',
]);

async function bundledEntry(relativeEntry) {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      target: 'es2022',
      minify: false,
      lib: {
        entry: path.join(root, relativeEntry),
        formats: ['es'],
        fileName: 'smoke',
      },
      rollupOptions: {
        external: [],
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result])
    .flatMap((output) => output.output)
    .filter((output) => output.type === 'chunk' && output.isEntry);
  if (outputs.length !== 1) {
    throw new Error(`${relativeEntry} produced ${outputs.length} entry chunks; expected exactly one`);
  }
  return outputs[0].code;
}

for (const entry of smokeEntries) {
  const source = await bundledEntry(entry);
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  await import(moduleUrl);
}
