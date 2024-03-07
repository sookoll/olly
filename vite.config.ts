import { defineConfig } from 'vite'
import path, { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { peerDependencies } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve('./src'),
  build: {
    outDir: '../dist',
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^ol\/.*/, ...Object.keys(peerDependencies)],
      output: {
        globals: (id) => id,
      },
    },
  },
  resolve: {
    alias: {
      src: resolve('src/'),
    },
  },
  plugins: [dts()],
})
