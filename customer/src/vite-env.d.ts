/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SEPAY_QR_IMAGE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
