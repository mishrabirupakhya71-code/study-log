import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

// Widget build: produces a single JS + CSS bundle that any website can embed
export default defineConfig({
  plugins: [preact()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  resolve: {
    alias: { react: 'preact/compat', 'react-dom': 'preact/compat' },
  },
  build: {
    outDir: 'dist-widget',
    lib: {
      entry: resolve(import.meta.dirname, 'src/widget/index.jsx'),
      name: 'StudySyncWidget',
      formats: ['iife'],
      fileName: () => 'studysync-widget.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: 'studysync-widget.[ext]',
        // Ensure CSS is inlined into JS for single-file embed
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: false },
    },
  },
});
