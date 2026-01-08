import { defineConfig } from 'vite';
import { resolve } from 'path';
import cleanPlugin from 'vite-plugin-clean';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      bundledPackages: [],
    }),
    cleanPlugin(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Saborter',
      formats: ['es', 'cjs'],
      fileName: format => {
        if (format === 'es') return 'index.es.js';
        if (format === 'cjs') return 'index.cjs.js';
        return `index.${format}.js`;
      },
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: false,
        globals: {},
      },
    },
    sourcemap: false,
    minify: false,
    target: 'es2020',
  },
});
