/// <reference types="vite/client" />

/** Package version and build time, set in vite.config.ts. */
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_SHOW_NAME_STORY?: string;
  readonly VITE_RESPONSIBLE_PARTY?: string;
  readonly VITE_RESPONSIBLE_PARTY_ADDRESS?: string;
  readonly VITE_INFORMATION_OFFICER?: string;
  readonly VITE_PRIVACY_EMAIL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
