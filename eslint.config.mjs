import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

/**
 * 앱 코드만 검사하도록 범위를 제한한다.
 * mcp-shrimp-task-manager는 독립 서브모듈이므로 제외한다.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Prettier와 충돌하는 스타일 규칙을 끈다. 반드시 마지막에 둔다.
  prettier,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "mcp-shrimp-task-manager/**",
    "supabase/**",
    "lib/database.types.ts",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // 로깅은 적절한 로깅 라이브러리를 사용한다는 프로젝트 규칙을 강제한다.
      "no-console": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
