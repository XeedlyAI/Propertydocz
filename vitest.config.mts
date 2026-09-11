import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit-test runner. Tests live next to the code as `*.test.ts` under src/.
 *
 *   npm test            one pass (CI, /verify, the Stop hook)
 *   npm run test:watch  re-runs on save
 *
 * Nothing here touches Supabase, Stripe, Dropbox, Resend, Typst, or Anthropic.
 * The suite pins the pure rules: order pricing, subscription pricing, the
 * Utah validation rules, Typst escaping/interpolation, tenant resolution.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/.claude/**"],
    restoreMocks: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_APP_DOMAIN: "propertydocz.com",
    },
  },
});
