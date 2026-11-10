"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface GoogleLoginButtonProps {
  /** 버튼에 표시할 문구 */
  label?: string;
  /** 인증 후 이동할 같은 사이트의 상대 경로 */
  next?: string;
}

/**
 * Google OAuth 로그인 버튼. 로그인과 회원가입 폼이 함께 사용한다.
 * 클릭하면 Google 인증 페이지로 이동하고, 인증 후 /auth/callback에서 세션을 만든다.
 */
export function GoogleLoginButton({
  label = "Google로 로그인",
  next = "/protected",
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Google OAuth 흐름을 시작한다.
   */
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
    // 성공 시 브라우저가 Google로 이동하므로 실패한 경우에만 상태를 되돌린다.
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isLoading}
        onClick={handleGoogleLogin}
      >
        {isLoading ? "Google로 이동 중..." : label}
      </Button>
    </>
  );
}
