# 개발 가이드라인 (AI 에이전트 전용)

이 문서는 AI 에이전트가 이 저장소를 수정할 때 따르는 규칙만 담는다. 일반 개발 지식과 기능 설명은 포함하지 않는다. 명령어와 환경 변수 상세는 `CLAUDE.md`를 따른다.

## 1. 프로젝트 개요

- 스택: Next.js App Router, React 19, Supabase Auth와 Postgres, Tailwind CSS, shadcn/ui, next-themes
- 설치된 `next`는 16.4.4다. `docs/guides/nextjs-15.md`는 15.x 기준이므로 그대로 적용하지 않는다.
- `next.config.ts`에 `cacheComponents: true`가 켜져 있다.
- 경로 별칭 `@/*`는 저장소 루트를 가리킨다. `src/` 디렉터리는 없다.

## 2. 디렉터리 구조와 역할

| 경로                                                           | 역할                                                     | 수정 규칙                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `proxy.ts`                                                     | 모든 요청의 진입점, `updateSession` 호출                 | 인증 로직은 `lib/supabase/proxy.ts`에서만 수정                                   |
| `lib/supabase/proxy.ts`                                        | 세션 갱신과 비로그인 리다이렉트                          | `supabaseResponse` 교체 금지 (아래 4번)                                          |
| `lib/supabase/server.ts`                                       | 서버 컴포넌트, Route Handler, Server Action용 클라이언트 | 호출마다 생성                                                                    |
| `lib/supabase/client.ts`                                       | 클라이언트 컴포넌트용 클라이언트                         | 호출마다 생성                                                                    |
| `lib/utils.ts`                                                 | `hasEnvVars`, `cn` 등 공용 유틸                          | 환경 변수 검사 로직 변경 시 `proxy.ts` 영향 확인                                 |
| `lib/database.types.ts`                                        | DB 타입                                                  | 현재 어떤 파일도 import하지 않음                                                 |
| `app/auth/*/page.tsx`                                          | 인증 화면                                                | 폼 로직은 `components/*-form.tsx`에 둠                                           |
| `app/auth/confirm/route.ts`                                    | 이메일 인증과 재설정 링크 처리                           | 아래 5번 참조                                                                    |
| `app/protected/`                                               | 로그인 필요 영역                                         | 페이지에서도 `getClaims()`로 한 번 더 확인                                       |
| `app/page.tsx`, `components/hero.tsx`, `components/tutorial/*` | 스타터 데모                                              | 실제 기능 개발 시 제거 대상                                                      |
| `components/ui/*`                                              | shadcn/ui 생성 컴포넌트                                  | 직접 수정하지 않고 `npx shadcn@latest add`로 추가                                |
| `supabase/migrations/*.sql`                                    | 스키마 원본                                              | 스키마 변경은 여기에만 새 파일로 추가                                            |
| `docs/guides/*.md`                                             | 프로젝트 참고 지침                                       | `project-structure.md`의 `src/`, `@/hooks`, `@/ui`, `@/utils` 구조는 따르지 않음 |
| `.claude/`                                                     | 에이전트, 명령, 설정                                     | `settings.json`의 deny 목록(`.env`, `secrets/`)을 제거하지 않음                  |

## 3. 코드 작성 규칙

- **변수명, 함수명은 영어 camelCase**를 쓴다. 예: `getUserProfile`, `isLoggedIn`.
- **코드 주석과 문서는 한국어**로 쓴다.
- **함수에는 간단한 JSDoc**을 단다.
- **`console.log`를 쓰지 않는다.** 로깅이 필요하면 적절한 로깅 라이브러리를 도입한다. 현재 저장소에는 로깅 라이브러리가 없다.
- 코드 변경 시 변경 이유를 한두 문장으로 설명한다.
- 에러 보고 시 원인과 해결 방법을 함께 제시한다.
- 모든 수정 파일은 Prettier 대상이다. `PostToolUse` 훅이 Edit, Write, MultiEdit 뒤 자동 실행하므로 수동 포맷은 필요 없다. 훅이 동작하지 않으면 `npm run format`을 실행한다.
- Tailwind 클래스는 `prettier-plugin-tailwindcss`가 정렬하므로 순서를 손으로 맞추지 않는다.

### 예시

- 해야 할 것: `const { data } = await supabase.auth.getClaims();` 처럼 `getClaims()`로 사용자를 확인한다.
- 하지 말 것: `getSession()`의 결과만으로 인증 여부를 판단한다.
- 해야 할 것: 서버 코드에서 `createClient()`를 함수 안에서 호출한다.
- 하지 말 것: `lib/supabase/*.ts`에 Supabase 클라이언트를 모듈 전역 변수로 만든다. Fluid compute에서 요청 간 공유 문제가 생긴다.

## 4. Supabase 클라이언트와 세션 규칙 (필수)

- **반드시** `lib/supabase/server.ts`, `client.ts`, `proxy.ts` 중 용도에 맞는 것만 쓴다. 새 클라이언트 생성 헬퍼를 만들지 않는다.
- **반드시** 클라이언트를 요청마다 새로 만든다. 모듈 최상위에 두지 않는다.
- **반드시** `lib/supabase/proxy.ts`의 `supabaseResponse`를 그대로 반환한다.
- **금지:** `NextResponse.next()`로 새 응답 객체를 만들어 `supabaseResponse`를 대체하는 것. 쿠키가 동기화되지 않아 세션이 무작위로 끊긴다.
- **금지:** `getClaims()` 호출을 제거하는 것. 제거하면 SSR 세션이 깨진다.
- **금지:** `createServerClient`와 `getClaims()` 사이에 코드를 끼워 넣는 것. 파일 주석이 이를 명시한다.

## 5. 인증 흐름 수정 규칙

- 회원가입은 `supabase.auth.signUp`의 `options.data`에 `username`, `full_name`, `avatar_url`을 담는다. 이 값은 `handle_new_user()` 트리거가 `public.profiles`로 옮긴다.
- 새 사용자 메타데이터 필드를 추가할 때는 다음 파일을 **함께** 수정한다.
  1. `components/sign-up-form.tsx`의 `options.data`
  2. 새 마이그레이션 파일의 `handle_new_user()` 재정의
  3. `profiles` 컬럼이 필요하면 같은 마이그레이션에서 `alter table` 추가
  4. `lib/database.types.ts` 재생성 검토
- `app/auth/confirm/route.ts`를 수정할 때는 다음 두 가지를 함께 고친다.
  - `next` 파라미터는 `/`로 시작하고 `//`로 시작하지 않는 상대 경로만 허용한다. 그 외 값은 `/`로 대체한다.
  - 에러 메시지는 `encodeURIComponent`로 인코딩한 뒤 쿼리에 붙인다.
- 비로그인 허용 경로를 바꿀 때는 `lib/supabase/proxy.ts`의 조건문만 수정한다. 다른 파일에 같은 목록을 복사하지 않는다.
- `/instruments`는 라우트가 없으므로 새 기능에서 쓰지 않는다.

## 6. 데이터베이스와 스키마 변경 규칙

- **반드시** 스키마 변경 전에 Supabase MCP의 `list_tables`로 현재 구조를 확인한다.
- **반드시** 스키마 변경은 `supabase/migrations/`에 새 타임스탬프 파일로 추가한다. 기존 마이그레이션 파일은 수정하지 않는다.
- **반드시** 새 테이블에는 RLS를 켜고 `authenticated` 역할에만 필요한 정책을 준다.
- **반드시** 권한 부여 후 `anon` 권한을 회수한다. 현재 `profiles`는 `revoke all ... from anon`으로 처리되어 있다.
- **금지:** 트리거 전용 security definer 함수를 `authenticated`나 `anon`에 노출하는 것. `handle_new_user()`는 `revoke execute`로 막혀 있다.
- **금지:** `profiles`에 delete 정책을 추가하는 것. 삭제는 `auth.users` 삭제로만 일어난다.
- **금지:** `service_role` 키를 클라이언트 코드나 `NEXT_PUBLIC_` 변수에 넣는 것.
- 스키마 변경 후 `mcp__supabase__get_advisors`로 보안 경고를 확인한다.

## 7. 환경 변수와 비밀 값

- **허용:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 `.env.local`에 둔다.
- **금지:** `.env`, `.env.*`, `secrets/` 파일을 읽거나 수정하는 것. `.claude/settings.json`에서도 deny로 막혀 있다.
- **금지:** API 키, 토큰, 비밀번호, secret key 값을 코드, 커밋, 문서, 메시지에 적는 것.
- **금지:** 서버 전용 비밀 값에 `NEXT_PUBLIC_` 접두사를 붙이는 것.
- 값이 없으면 `hasEnvVars`가 false가 되어 `proxy` 인증 검사가 건너뛰어진다. 이 동작을 바꾸지 않는다.

## 8. Git과 커밋 규칙

- **금지:** 사용자의 명시적 요청 없이 `commit`, `push`, `merge`를 수행하는 것.
- **금지:** 기본 브랜치(`main`)에서 직접 작업 커밋을 만드는 것. 필요하면 브랜치를 먼저 만든다.
- 커밋 메시지는 **한국어 제목**의 컨벤셔널 형식을 쓴다. 허용 타입은 `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`뿐이다.
- 커밋 메시지와 PR 본문에 이모지를 넣지 않는다.
- 커밋에 `.env*`, `secrets/` 파일이 스테이지되면 `pre-commit` 훅이 막는다. 우회하지 않는다.
- `pre-commit`은 `lint-staged`를 실행하며 경고도 실패로 처리한다. `--no-verify`로 건너뛰지 않는다.
- `pre-push`는 `npm run typecheck`를 실행한다. 실패 상태로 push하지 않는다.

## 9. 검증 규칙

- 변경 후 최소한 `npm run typecheck`와 `npm run lint`를 실행한다.
- 푸시 전에는 `npm run check`를 실행한다.
- 빌드 영향이 있는 변경은 `npm run build`로 확인한다.
- **앱에는 테스트 러너와 `test` 스크립트가 없다.** `npm run test`를 실행하지 않고, 테스트를 추가했다고 가정하지 않는다.
- `mcp-shrimp-task-manager/`는 독립 프로젝트다. 그 안의 작업은 해당 디렉터리의 `package.json`으로 실행하며, 루트 ESLint와 Prettier 대상에서 제외되어 있다.

## 10. 다중 파일 동시 수정 규칙

| 변경 내용               | 함께 수정할 파일                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 스키마 변경             | 새 마이그레이션 파일, `lib/database.types.ts` 재생성 검토                             |
| 회원가입 필드 추가      | `components/sign-up-form.tsx`, 새 마이그레이션의 `handle_new_user()`                  |
| 비로그인 허용 경로 추가 | `lib/supabase/proxy.ts`만 수정                                                        |
| 보호 페이지 추가        | 페이지 내 `getClaims()` 확인 추가, 필요 시 `app/protected/layout.tsx` 확인            |
| 인증 폼 문구 변경       | 해당 `components/*-form.tsx`와 `app/auth/*/page.tsx` 제목을 함께 확인                 |
| 데모 제거               | `app/page.tsx`, `components/hero.tsx`, `components/tutorial/*`, 관련 import 전부 확인 |
| 새 shadcn 컴포넌트 추가 | `components/ui/*`에 생성, `components.json` 설정과 일치 확인                          |

## 11. 금지 사항 요약

- **금지:** `src/` 디렉터리 생성, `@/hooks`, `@/ui`, `@/utils` 별칭 추가.
- **금지:** `components/ui/*` 직접 수정 (필요 시 shadcn CLI로 재생성).
- **금지:** `console.log` 사용.
- **금지:** 영어 주석 또는 한국어 변수명 사용.
- **금지:** `.env*`, `secrets/` 읽기와 수정.
- **금지:** 사용자 요청 없는 git 작업.
- **금지:** 기존 마이그레이션 파일 수정.
- **금지:** `proxy.ts` 리다이렉트 목록을 여러 곳에 중복 정의.
- **금지:** `npm run test` 실행 시도 (스크립트 없음).

## 12. 모호한 상황에서의 판단 기준

1. 보안 규칙(4, 6, 7번)은 다른 요구보다 우선한다. 충돌하면 작업을 멈추고 사용자에게 보고한다.
2. 스키마 변경이 필요한지 불확실하면 먼저 `list_tables`로 현재 구조를 확인한다.
3. 기존 코드 패턴과 `docs/guides/*.md`가 충돌하면 `docs/guides`보다 실제 코드 패턴을 따른다. 단 `project-structure.md`의 `src/` 구조는 무시한다.
4. 명령이 `package.json`에 없으면 추측으로 실행하지 않는다. 필요하면 사용자에게 확인한다.
5. 파일 삭제는 대상 파일 내용을 먼저 확인한 뒤 수행한다.
