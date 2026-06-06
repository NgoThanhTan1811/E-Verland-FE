/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SELLER_URL: string;
  readonly VITE_USER_URL: string;
  readonly VITE_UPLOAD_URL: string;
  readonly VITE_TUS_ENDPOINT: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
