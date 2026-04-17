import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import https from 'node:https';

export default defineConfig(async () => ({
  plugins: [
    react(),
    tailwindcss(),
    // Dev-only plugin: forward /tidal-audio-proxy/<host><path> to the real
    // TIDAL audio CDN using Node's https module, without an Origin header,
    // so the CDN does not apply CORS restrictions.
    // The fetch interceptor in index.html rewrites audio CDN URLs to this form.
    {
      name: 'tidal-audio-proxy',
      apply: 'serve' as const,
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const m = req.url?.match(/^\/tidal-audio-proxy\/([a-z0-9.-]+)(\/.*)?$/i);
          if (!m) return next();

          const host = m[1];
          const path = m[2] || '/';

          // Forward browser headers but strip origin/referer so the CDN
          // does not see localhost as the requester.
          const { origin: _o, referer: _r, host: _h, ...fwd } = req.headers;
          const headers = { ...fwd, host };

          const proxy = https.request(
            { hostname: host, path, method: req.method ?? 'GET', headers },
            (upstream) => {
              res.writeHead(upstream.statusCode ?? 502, upstream.headers);
              upstream.pipe(res);
            },
          );
          proxy.on('error', (err) => {
            res.writeHead(502);
            res.end(err.message);
          });
          req.pipe(proxy);
        });
      },
    },
  ],

  build: { target: 'esnext' },
  optimizeDeps: { esbuildOptions: { target: 'esnext' } },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
}));
