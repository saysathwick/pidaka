/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: "hearth";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
