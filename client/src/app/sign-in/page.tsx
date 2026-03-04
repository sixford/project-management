// client/src/app/sign-in/page.tsx
"use client";

import { buildLoginUrl, buildSignupUrl } from "@/lib/auth";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Hermondly</h1>
        <p className="mb-6 text-sm text-gray-600">Sign in to continue.</p>

        <div className="flex gap-3">
          <a className="rounded-md bg-black px-4 py-2 text-white" href={buildLoginUrl()}>
            Sign in
          </a>
          <a className="rounded-md border px-4 py-2" href={buildSignupUrl()}>
            Create account
          </a>
        </div>
      </div>
    </main>
  );
}