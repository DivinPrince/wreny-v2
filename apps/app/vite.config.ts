import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ command }) => ({
  nitro: {
    rollupConfig: {
      external: [/^@sentry\//],
    },
  },
  plugins: [
    // Nitro only in build: on Windows + Bun, Nitro dev uses named pipes that Bun doesn't support
    // See https://github.com/nitrojs/nitro/issues/3917
    ...(command === 'build' ? [nitro()] : []),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
