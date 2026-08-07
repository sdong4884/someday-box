import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // CLAUDE.md: domain/ 은 순수 함수. React·Supabase·브라우저 API import 금지.
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "next",
                "next/*",
                "@supabase/*",
                "zustand",
                "@tanstack/*",
                "react-hook-form",
              ],
              message:
                "domain/ 은 순수 함수만 둡니다. 프레임워크·DB 의존은 바깥 레이어로 옮기세요.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message: "domain/ 은 브라우저 API를 쓰지 않습니다. 값으로 주입받으세요.",
        },
        {
          name: "document",
          message: "domain/ 은 브라우저 API를 쓰지 않습니다. 값으로 주입받으세요.",
        },
        {
          name: "localStorage",
          message: "domain/ 은 브라우저 API를 쓰지 않습니다. 값으로 주입받으세요.",
        },
        {
          name: "sessionStorage",
          message: "domain/ 은 브라우저 API를 쓰지 않습니다. 값으로 주입받으세요.",
        },
        {
          name: "navigator",
          message: "domain/ 은 브라우저 API를 쓰지 않습니다. 값으로 주입받으세요.",
        },
      ],
    },
  },
]);

export default eslintConfig;
