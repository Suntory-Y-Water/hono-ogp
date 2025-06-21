import type {} from 'hono';

type Head = {
  title?: string;
  description?: string;
};

declare module 'hono' {
  interface Env {
    Bindings: {
      OGP_KV: KVNamespace;
      OGP_IMAGES: R2Bucket;
    };
  }
  interface ContextRenderer {
    // biome-ignore lint/style/useShorthandFunctionType: <explanation>
    (
      content: string | Promise<string>,
      head?: Head,
    ): Response | Promise<Response>;
  }
}
