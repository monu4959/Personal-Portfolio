import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    // relative asset URLs, so the build works at monu4959.github.io/Personal-Portfolio/ and locally
    base: './',
    plugins: [react()],
    build: {
        outDir: 'dist',
        // the tubes effect ships its own Three.js build; it is lazy-loaded, so a large chunk is expected
        chunkSizeWarningLimit: 1000
    }
});
