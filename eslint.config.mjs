import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Ratchet: eslint-config-next 16 ships the React Compiler diagnostics
      // as errors. 8 pre-existing sites on 2026-09-11 (both sidebars create
      // components during render; theme-provider and useCountUp set state in
      // an effect; one Date.now() in tenant-detail render). Fix per component
      // as you touch it, then promote each rule back to "error".
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
