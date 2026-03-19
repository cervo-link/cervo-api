import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './src/tests/global-setup.ts',
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/infra/**'],
      exclude: [
        'src/**/*.spec.ts',
        'src/tests/**',
        'src/infra/db/migrations/**',
        'src/infra/db/schema/**',
        'src/infra/http/app.ts',
        'src/main.ts',
      ],
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
})
