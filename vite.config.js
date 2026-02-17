import { defineConfig } from 'vite';
import { join, resolve } from 'path';
import cleanPlugin from 'vite-plugin-clean';
import circularDependency from 'vite-plugin-circular-dependency';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
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
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        utils: resolve(__dirname, 'src/utils.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, filename) => {
        return `${filename}.${format}.js`;
      }
    },
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.ts'),
        utils: resolve(__dirname, 'src/utils.ts')
      },
      external: [],
      output: {
        preserveModules: false,
        globals: {},
        exports: 'named'
      }
    },
    sourcemap: false,
    minify: true,
    target: 'es2020'
  }
});
