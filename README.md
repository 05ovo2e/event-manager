# Next.js Supabase App

Next.js와 Supabase Auth로 만든 웹 애플리케이션 스타터킷

## 기술 스택

- Next.js 16, React 19, TypeScript
- Supabase (Auth, Postgres)
- - Tailwind CSS, shadcn/ui

## 시작하기

1. Node.js 20.9 이상을 설치합니다. `.nvmrc`에는 24가 지정되어 있습니다.
2. 의존성을 설치합니다. 설치 중 Husky 훅이 자동으로 활성화됩니다.

   ```bash
   npm install
   ```

3. 프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 프로젝트 값을 입력합니다. Supabase 대시보드의 API 설정에서 값을 확인할 수 있습니다.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable 또는 anon 키>
   ```

4. Supabase 프로젝트에 마이그레이션을 적용합니다. `supabase/migrations/`의 SQL이 `profiles` 테이블과 트리거를 만듭니다.
5. 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

   브라우저에서 http://localhost:3000 을 엽니다.

`.env.local`은 Git에 올라가지 않도록 `.gitignore`에 등록되어 있습니다. 비밀 값은 코드나 커밋에 넣지 마세요.

## 스크립트

| 명령어                 | 설명                            |
| ---------------------- | ------------------------------- |
| `npm run dev`          | 개발 서버 실행                  |
| `npm run build`        | 프로덕션 빌드                   |
| `npm run start`        | 빌드 결과 실행                  |

## 프로젝트 구조

```
app/                 라우트와 페이지 (auth, protected)
  auth/callback/     Google OAuth 콜백
  auth/confirm/      이메일 인증 콜백
components/          화면 컴포넌트, 로그인과 회원가입 폼
components/ui/       shadcn/ui 기본 컴포넌트
lib/supabase/        Supabase 클라이언트 (서버, 브라우저, proxy)
proxy.ts             요청마다 세션을 갱신하고 비로그인 사용자를 리다이렉트
supabase/migrations/ 데이터베이스 스키마
```

## 참고

- 개발 규칙과 명령어는 `CLAUDE.md`에 정리되어 있습니다.
- `mcp-shrimp-task-manager/`는 별도 Git 저장소를 가리키는 서브모듈입니다. 클론할 때는 `git submodule update --init`이 필요합니다.
