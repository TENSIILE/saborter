import { defineConfig } from 'vite';
import { join, resolve } from 'path';
import cleanPlugin from 'vite-plugin-clean';
import circularDependency from 'vite-plugin-circular-dependency';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      bundledPackages: []
    }),
    cleanPlugin(),
    circularDependency({
      circleImportThrowErr: true,
      formatOut: (data) => {
        if (!Object.entries(data).length) return {};

        // eslint-disable-next-line no-console
        console.log('\n\r');

        Object.entries(data).forEach(([key, dependencies]) => {
          if (Array.isArray(dependencies)) {
            const message = dependencies
              .flat()
              .map((dependency) => join(__dirname, dependency))
              .concat(join(__dirname, key))
              .join('\n\r => ');

            // eslint-disable-next-line no-console
            console.log(`[Dependency] -> ${message}`);
          }
        });

        throw new Error('Has circle dependency!');
      }
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.es.js';
        if (format === 'cjs') return 'index.cjs.js';
        return `index.${format}.js`;
      }
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: false,
        globals: {}
      }
    },
    sourcemap: false,
    minify: false,
    target: 'es2020'
  }
});
