/**
 * 컨벤셔널 커밋 규칙. 타입은 /git:commit 명령의 목록과 맞춘다.
 * 제목은 한국어를 쓰므로 대소문자 검사를 끈다.
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 72],
  },
};

export default config;
