import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// A browser that refuses site storage throws from window.localStorage itself, so
// only utils/storage.ts, which never throws, may reach it.
const STORAGE = ['localStorage', 'sessionStorage']
const STORAGE_MESSAGE = 'Use utils/storage.ts: a browser that refuses site storage throws here.'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/utils/storage.ts'],
    rules: {
      'no-restricted-globals': ['error', ...STORAGE.map(name => ({ name, message: STORAGE_MESSAGE }))],
      'no-restricted-properties': ['error', ...STORAGE.map(property => ({ property, message: STORAGE_MESSAGE }))],
    },
  },
])
