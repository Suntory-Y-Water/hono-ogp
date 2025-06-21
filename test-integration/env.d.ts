import type { Env as WorkerEnv } from '../worker-configuration';

declare module 'cloudflare:test' {
  interface ProvidedEnv extends WorkerEnv {
    OGP_KV: KVNamespace;
    OGP_IMAGES: R2Bucket;
  }
}
