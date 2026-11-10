import { defineConfig } from 'vite';
export default defineConfig({root:'web',base:'./',build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input:{main:'web/index.html',privacy:'web/privacy.html'}}},publicDir:'public'});
