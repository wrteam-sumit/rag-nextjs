"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      // Store in cookie for backend API to read on subsequent requests if needed
      // Note: HttpOnly cannot be set from JS; for simplicity we use a non-HttpOnly cookie here.
      document.cookie = `auth_token=${token}; path=/; max-age=${
        7 * 24 * 60 * 60
      }`;
    }
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-200">
      Signing you in...
    </div>
  );
}
