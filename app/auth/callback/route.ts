import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * 리다이렉트 대상이 같은 사이트의 상대 경로인지 검증한다.
 * "/"로 시작하되 "//"(프로토콜 상대 URL)와 "/\"로 시작하는 경로는 거부한다.
 */
function getSafeNextPath(next: string | null): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }
  return "/protected";
}

/**
 * OAuth(Google) 인증 후 돌아오는 콜백. code를 세션으로 교환한 뒤 이동시킨다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("No code provided")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`,
    );
  }

  // 로드밸런서 뒤의 배포 환경에서는 원본 호스트를 사용한다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv || !forwardedHost) {
    return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`https://${forwardedHost}${next}`);
}
