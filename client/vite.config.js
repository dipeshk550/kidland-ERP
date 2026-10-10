import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: true,
    // Forward /api and /uploads to the Express backend
    proxy: {
      '/api':     { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
    // Pre-warm the most critical modules so they're ready before browser connects
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/context/AuthContext.jsx',
        './src/context/ThemeContext.jsx',
        './src/context/SettingsContext.jsx',
        './src/components/ui/SplashScreen.jsx',
        './src/components/layout/AdminLayout.jsx',
        './src/services/api.js',
      ],
    },
  },

  // Pre-bundle frequently-used heavy dependencies so dev-server doesn't
  // transform them on every cold request (eliminates the "Loading failed" race)
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'axios',
      'react-hot-toast',
      'react-icons/fa',
      'recharts',
    ],
    // Force re-optimisation on next start to avoid stale cache
    force: false,
  },

  build: {
    sourcemap: false,
    // Raise the warning threshold (our bundle is large due to many modules)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Manual chunking: split large vendor libs into separate files
        // so the browser can cache them independently
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion':   ['framer-motion'],
          'vendor-charts':   ['recharts'],
          'vendor-icons':    ['react-icons'],
          'vendor-axios':    ['axios'],
          'vendor-toast':    ['react-hot-toast'],
        },
      },
    },
  },
})