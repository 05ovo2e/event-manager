/**
 * 스테이지된 파일에만 도구를 실행한다.
 * 경고도 실패로 처리해 커밋에 lint 경고가 섞이지 않게 한다.
 */
const config = {
  "*.{ts,tsx,js,jsx,mjs}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
  ],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};

export default config;
