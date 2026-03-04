"use client";

type Tokens = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
};

function cleanToken(value: string | null): string | null {
  if (!value) return null;
  const v = value.trim();

  // Strip wrapping quotes if stored via JSON.stringify(token)
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }

  return v;
}

export const tokenStore = {
  setTokens(tokens: Tokens) {
    if (typeof window === "undefined") return;
    if (tokens.access_token) localStorage.setItem("access_token", tokens.access_token);
    if (tokens.id_token) localStorage.setItem("id_token", tokens.id_token);
    if (tokens.refresh_token) localStorage.setItem("refresh_token", tokens.refresh_token);
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("id_token");
    localStorage.removeItem("refresh_token");
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return cleanToken(localStorage.getItem("access_token"));
  },

  getIdToken(): string | null {
    if (typeof window === "undefined") return null;
    return cleanToken(localStorage.getItem("id_token"));
  },

  getBearerToken(): string | null {
    return this.getAccessToken() || this.getIdToken();
  },
};

//
// ✅ ADD THIS FUNCTION
//
export type JwtPayload = Record<string, any> & { exp?: number; sub?: string };

export function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * ENV
 * IMPORTANT:
 * Next.js only exposes NEXT_PUBLIC_* variables in the browser.
 */
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
const LOGOUT_URI = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

function must(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getCognitoDomain(): string {
  return must(COGNITO_DOMAIN, "NEXT_PUBLIC_COGNITO_DOMAIN");
}

export function getRedirectUri(): string {
  return must(REDIRECT_URI, "NEXT_PUBLIC_COGNITO_REDIRECT_URI");
}

export function getLogoutUri(): string {
  return must(LOGOUT_URI, "NEXT_PUBLIC_COGNITO_LOGOUT_URI");
}

export function buildLoginUrl(): string {
  const domain = getCognitoDomain();
  const clientId = must(COGNITO_CLIENT_ID, "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID");
  const redirectUri = getRedirectUri();

  const url = new URL(`${domain.replace(/\/$/, "")}/login`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("redirect_uri", redirectUri);

  // Force Cognito to show login screen
  url.searchParams.set("prompt", "login");

  return url.toString();
}

export function buildSignupUrl(): string {
  const domain = getCognitoDomain();
  const clientId = must(COGNITO_CLIENT_ID, "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID");
  const redirectUri = getRedirectUri();

  const url = new URL(`${domain.replace(/\/$/, "")}/signup`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("redirect_uri", redirectUri);

  return url.toString();
}

export function buildLogoutUrl(): string {
  const domain = getCognitoDomain();
  const clientId = must(COGNITO_CLIENT_ID, "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID");
  const logoutUri = getLogoutUri();

  const url = new URL(`${domain.replace(/\/$/, "")}/logout`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("logout_uri", logoutUri);

  return url.toString();
}