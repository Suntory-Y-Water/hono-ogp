/**
 * 単体テスト用Vitest設定
 */

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineWorkersConfig(async () => {
  return {
    plugins: [tsconfigPaths()],
    root: __dirname,
    test: {
      globals: true,
      include: ['./**/*.test.{ts,tsx}'],
      poolOptions: {
        workers: {
          wrangler: {
            configPath: path.resolve(__dirname, '../wrangler.jsonc'),
          },
        },
      },
    },
  };
});
