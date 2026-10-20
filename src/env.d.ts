/// <reference types="vite/client" />

/** Package version and build time, set in vite.config.ts. */
declare const __BUILD_ID__: string;

interface ImportMetaEnv {
  readonly VITE_SHOW_NAME_STORY?: string;
}
