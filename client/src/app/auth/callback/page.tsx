// client/src/app/auth/callback/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenStore } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = searchParams.get("code");
    const errorFromCognito = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (errorFromCognito) {
      setError(`${errorFromCognito}${errorDesc ? `: ${errorDesc}` : ""}`);
      return;
    }

    if (!code) {
      setError("Missing code in callback URL");
      return;
    }

    (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");

        const res = await fetch(`${baseUrl}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Token exchange failed");
        }

        // Store raw strings (no JSON.stringify)
        tokenStore.setTokens({
          access_token: data.access_token,
          id_token: data.id_token,
          refresh_token: data.refresh_token,
        });

        window.location.assign("/home");
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      }
    })();
  }, [router, searchParams]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-lg font-semibold">Signing you in…</h1>
      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-600">
          Exchanging auth code for tokens…
        </p>
      )}
    </main>
  );
}