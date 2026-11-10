# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

- 개발 서버: `npm run dev` (http://localhost:3000)
- 프로덕션 빌드: `npm run build` (통과 확인됨)
- 타입 체크: `npm run typecheck` (`tsc --noEmit`)
- 린트: `npm run lint`, 자동 수정은 `npm run lint:fix`. `mcp-shrimp-task-manager/`는 ESLint와 Prettier 대상에서 제외되어 있다.
- 포맷: `npm run format`(쓰기), `npm run format:check`(검사). Prettier 설정은 `.prettierrc`이며 Tailwind 클래스 정렬 플러그인을 쓴다.
- 푸시 전 전체 점검: `npm run check` (타입 체크, 린트, 포맷 검사를 순서대로 실행)
- 테스트: 앱에는 테스트 러너와 `test` 스크립트가 없다. 따라서 단일 테스트 실행 방법도 없다. `mcp-shrimp-task-manager/`에는 별도 vitest 설정이 있지만 독립 프로젝트이므로 그 디렉터리의 `package.json`을 기준으로 실행한다.
- shadcn/ui 컴포넌트 추가: `npx shadcn@latest add <component>` (`components.json` 기준 default 스타일)

## 커밋과 훅 (자동 실행)

- `pre-commit`: `.env*`와 `secrets/` 파일이 스테이지되면 커밋을 막고, 그 다음 `lint-staged`(ESLint fix와 Prettier)를 실행한다. 경고도 실패로 처리한다.
- `commit-msg`: `commitlint`로 컨벤셔널 형식을 검사한다. 타입은 feat, fix, docs, style, refactor, perf, test, chore만 허용하며 한국어 제목을 쓴다.
- `pre-push`: `npm run typecheck`를 실행한다.
- Claude Code의 `PostToolUse` 훅(`.claude/settings.json`)은 Edit, Write, MultiEdit 뒤 대상 파일에 Prettier를 적용한다.

## 환경 변수

- `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 둔다. 값이 없으면 `lib/utils.ts`의 `hasEnvVars`가 false가 되어 `proxy` 인증 검사를 건너뛰고 `components/env-var-warning.tsx` 경고가 표시된다.
- 두 변수는 브라우저에 노출되는 `NEXT_PUBLIC_` 접두사를 사용한다. 서버 전용 비밀 값은 여기에 넣으면 안 된다.

## 버전 주의

- 설치된 `next`는 16.4.4다. `package.json`은 `"latest"`를 쓰고, `docs/guides/nextjs-15.md`는 15.5.3을 기준으로 하며, `eslint-config-next`는 15.3.1이다. 문서의 버전 지침을 따르기 전에 `node_modules`의 실제 버전을 확인한다.
- `next.config.ts`에 `cacheComponents: true`가 켜져 있다.

## 아키텍처

스택은 Next.js App Router, React 19, Supabase Auth와 Postgres, Tailwind CSS와 shadcn/ui(`components/ui/`), next-themes다. 소스는 `src/` 없이 저장소 루트의 `app/`, `components/`, `lib/`에 있고, 경로 별칭 `@/*`는 저장소 루트를 가리킨다.

### 요청 처리: 세션 갱신과 라우트 보호

- 루트 `proxy.ts`가 모든 요청(정적 자산 제외)에서 `lib/supabase/proxy.ts`의 `updateSession`을 호출한다. 이 함수는 `auth.getClaims()`로 세션 쿠키를 갱신하고, 로그인되지 않은 요청을 `/auth/login`으로 보낸다.
- 허용 경로는 `/`, `/login*`, `/auth*`, 그리고 `/instruments`다. `/instruments`는 현재 라우트가 없으므로 과거 흔적으로 보인다.
- `updateSession`이 반환하는 `supabaseResponse`는 새 `NextResponse`로 바꾸지 말고 그대로 반환해야 한다. 쿠키가 동기화되지 않아 세션이 무작위로 끊긴다. 파일 안의 주석이 이 규칙을 설명한다.
- Supabase 클라이언트는 용도별로 세 개다. `lib/supabase/server.ts`는 서버 컴포넌트, Route Handler, Server Action에서 `cookies()`로 만들고, `lib/supabase/client.ts`는 클라이언트 컴포넌트에서 쓰며, `lib/supabase/proxy.ts`는 proxy 전용이다. 모두 호출할 때마다 새로 생성하고 모듈 전역 변수에 두지 않는다(Fluid compute 주의).
- 보호 페이지는 proxy에서 한 번, 페이지에서 한 번 더 확인한다. 예를 들어 `app/protected/page.tsx`의 `UserDetails`가 `getClaims()`로 확인하고 실패하면 `redirect`한다. `app/protected/layout.tsx`는 네비게이션과 푸터 셸을 제공한다.

### 인증 흐름 (여러 파일에 걸침)

- 폼 컴포넌트(`components/login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`)는 `app/auth/*/page.tsx`에서 렌더링된다.
- 회원가입은 `options.data`에 `username`, `full_name`, `avatar_url`을 담아 보내고, 이 값은 아래 DB 트리거가 `profiles`로 옮긴다.
- 이메일 인증과 비밀번호 재설정 링크는 `app/auth/confirm/route.ts`가 `token_hash`와 `type`으로 `verifyOtp`를 호출한 뒤 `next` 쿼리 값으로 redirect한다. 실패하면 `/auth/error?error=...`로 보낸다.
- 알아둘 점: `next` 값은 검증 없이 redirect에 쓰여 open redirect 여지가 있고, 에러 메시지도 인코딩하지 않고 쿼리에 붙인다. 이 라우트를 수정할 때 함께 고치는 것이 좋다.

### 데이터베이스

- 스키마는 `supabase/migrations/`에서 관리한다. 현재 마이그레이션은 `public.profiles` 하나다.
- `profiles`는 `auth.users`와 1:1이며 사용자 삭제 시 cascade로 함께 삭제된다. `auth.users`에 insert가 일어나면 트리거 `on_auth_user_created`가 security definer 함수 `handle_new_user()`를 실행해 `raw_user_meta_data`로 프로필 행을 만든다.
- RLS가 켜져 있고 `authenticated` 역할에만 본인 행의 select, insert, update를 허용한다. delete는 허용하지 않으며, 삭제는 `auth.users` 삭제로만 일어난다. `anon`의 권한은 모두 회수했다.
- `lib/database.types.ts`는 타입 파일이지만 현재 앱 코드에서 import하지 않는다. 스키마를 바꾸면 이 파일을 다시 생성할지 확인한다.
- Supabase MCP 서버가 `.mcp.json`에 이 프로젝트로 연결되어 있다. 스키마 변경 전에는 `list_tables` 등으로 현재 구조를 먼저 확인한다.

### UI와 테마

- `app/layout.tsx`가 `html`, Geist 폰트, `ThemeProvider`(next-themes, class 방식, 기본값 system)를 설정한다.
- `app/page.tsx`의 `components/hero.tsx`와 `components/tutorial/*`는 스타터 킷의 데모 콘텐츠다. 실제 기능을 만들 때 제거 대상이다.

### 문서와 실제 구조의 차이

- `docs/guides/project-structure.md`는 `src/` 구조와 `@/hooks`, `@/ui`, `@/utils` 별칭을 전제로 하지만 실제 프로젝트에는 해당 없다. 이 문서의 폴더 구조를 그대로 따르지 않는다.
- 나머지 `docs/guides/*.md`(컴포넌트 패턴, 스타일링, react-hook-form, Next.js 지침)는 프로젝트 규칙으로 참고할 수 있다.

### 기타

- `.claude/hooks/notification-hook.sh`는 권한 요청과 입력 대기 시 Slack 알림을 보내는 Notification 훅이며, `.env`의 `SLACK_WEBHOOK_URL`이 필요하다.
