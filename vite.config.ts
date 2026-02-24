import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
    base: './', // Required for Electron file:// protocol - ensures relative asset paths
    plugins: [
        react(),
        electron([
            {
                entry: 'electron/main.ts',
                onstart(options) {
                    options.startup();
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        rollupOptions: {
                            external: ['@prisma/client', 'electron', 'sqlite3'],
                            output: {
                                format: 'cjs'
                            }
                        }
                    }
                }
            },
            {
                entry: 'electron/preload.ts',
                onstart(options) {
                    options.reload();
                },
                vite: {
                    build: {
                        outDir: 'dist-electron',
                        lib: {
                            entry: 'electron/preload.ts',
                            formats: ['cjs'],
                            fileName: () => 'preload.js'
                        },
                        rollupOptions: {
                            external: ['electron'],
                            output: {
                                format: 'cjs',
                                exports: 'auto'
                            }
                        }
                    }
                }
            }
        ]),
        renderer()
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        port: 5173
    },
    build: {
        outDir: 'dist'
    }
});
