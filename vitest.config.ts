import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
  },
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
})
