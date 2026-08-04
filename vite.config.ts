import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // base path pour GitHub Pages (repo docuSnap)
  // En dev local, base = '/' ; en prod GitHub Pages, base = '/docuSnap/'
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.DEPLOY_TARGET === 'pages';
  const base = isGitHubPages ? '/docuSnap/' : '/';

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
