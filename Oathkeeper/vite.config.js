import { defineConfig } from 'vite';
export default defineConfig({esbuild:{jsx:'automatic'},root:'web',base:'./',build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input:{main:'web/index.html',privacy:'web/privacy.html'}}},publicDir:'public'});
