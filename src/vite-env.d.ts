/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_TODAY_IMAGE_1_ID?: string
  readonly VITE_TODAY_IMAGE_2_ID?: string
  readonly VITE_TODAY_IMAGE_3_ID?: string
  readonly VITE_TODAY_IMAGE_4_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
