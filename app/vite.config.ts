import { defineConfig } from 'vite';
import pkg from './package.json';
import { createPixuliViteConfig } from './tooling/vite/createConfig';

// https://vitejs.dev/config/
export default defineConfig(createPixuliViteConfig(pkg));
