import { resolve } from "path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    main: {
        build: {
            rollupOptions: {
                output: {
                    format: 'es'
                }
            }
        }
    },
    preload: {
        build: {
            rollupOptions: {
                output: {
                    format: 'es'
                }
            }
        }
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
                // no need if run 'p i' from root directory, but interesting ways around, keep it for now
                // Ensure single React instance
                // 'react': resolve('node_modules/react'),
                // 'react-dom': resolve('node_modules/react-dom'),
            },
            // dedupe: ['react', 'react-dom', 'jotai', 'valtio']
        },
        plugins: [
            react(),
            tailwindcss(),
        ]
    }
});
