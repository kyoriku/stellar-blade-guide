/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Chromium, Firefox and Safari 18.4 take it; TypeScript's DOM types don't list it yet.
interface FocusOptions {
  focusVisible?: boolean
}
