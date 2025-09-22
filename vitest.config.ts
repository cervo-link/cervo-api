import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './src/tests/global-setup.ts',
  },
  envDir: '.env.test',
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
})
