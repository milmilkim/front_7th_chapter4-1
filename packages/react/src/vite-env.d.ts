/// <reference types="vite/client" />

interface Window {
  __INITIAL_DATA__?: {
    products?: unknown[];
    categories?: Record<string, Record<string, unknown>>;
    totalCount?: number;
    currentProduct?: unknown;
    relatedProducts?: unknown[];
    query?: Record<string, string>;
    [key: string]: unknown;
  };
}
