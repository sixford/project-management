"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { decodeJwtPayload, tokenStore } from "@/lib/auth";

/**
 * Public routes: everything else requires a token
 * Use prefixes so nested routes still count as public.
 */
const PUBLIC_ROUTE_PREFIXES = ["/sign-in", "/auth/callback", "/"]; // keep "/" public if you want

function getToken() {
  // Prefer access token, fallback to id token
  return tokenStore.getAccessToken() || tokenStore.getIdToken();
}

/**
 * Client-side expiry check (convenience only).
 * Real protection must happen on the server via JWT verification.
 *
 * ✅ IMPORTANT CHANGE:
 * If we can't decode the token, treat it as expired.
 * Otherwise you can get stuck in a broken state with stale/garbled tokens.
 */
function isJwtExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);

    // If decode failed / missing payload => expired
    if (!payload) return true;

    const exp = payload.exp;

    // If no exp claim, treat as expired (safer default for Cognito flows)
    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return now >= exp;
  } catch {
    // ✅ if we can't decode it, don't trust it
    return true;
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = useMemo(() => {
    if (!pathname) return false;
    return PUBLIC_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  }, [pathname]);

  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = getToken();

    // ✅ If no token -> clear any leftovers and redirect if needed
    if (!token) {
      tokenStore.clear();
      setAuthed(false);
      setReady(true);

      if (!isPublicRoute) router.replace("/sign-in");
      return;
    }

    // ✅ If token expired OR can't be decoded -> clear + redirect
    if (isJwtExpired(token)) {
      tokenStore.clear();
      setAuthed(false);
      setReady(true);

      if (!isPublicRoute) router.replace("/sign-in");
      return;
    }

    // ✅ Token looks valid
    setAuthed(true);
    setReady(true);
  }, [isPublicRoute, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border bg-white px-6 py-4 text-sm text-gray-700 shadow-sm">
          Checking session…
        </div>
      </main>
    );
  }

  // Public routes render regardless
  if (isPublicRoute) return <>{children}</>;

  // Protected routes require auth
  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border bg-white px-6 py-4 text-sm text-gray-700 shadow-sm">
          Redirecting to sign in…
        </div>
      </main>
    );
  }

  return <>{children}</>;
}