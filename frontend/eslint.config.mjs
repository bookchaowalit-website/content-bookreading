import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Same preset as the former .eslintrc.json ("next/core-web-vitals"), in flat config for Next 16.
const eslintConfig = defineConfig([
  ...nextVitals,
  {
    // eslint-config-next 16 adds the React Compiler rules to core-web-vitals. Existing data-loading
    // effects (41 places in 23 files) predate them; they are warnings until refactored
    // (specs/001-next16-shared-ci-sentry, follow-up F-01). New code should not add warnings.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts"]),
]);

export default eslintConfig;
