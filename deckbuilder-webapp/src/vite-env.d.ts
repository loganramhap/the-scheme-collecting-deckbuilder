/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITEA_URL: string
  readonly VITE_GITEA_CLIENT_ID: string
  readonly VITE_GITEA_CLIENT_SECRET: string
  readonly VITE_REDIRECT_URI: string
  readonly VITE_SCRYFALL_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
