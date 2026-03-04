// server/src/middleware/verifyCognito.ts
import type { Request, Response, NextFunction } from "express";

type AuthInfo = {
  sub: string;
  payload: Record<string, any>;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}

function getBearerToken(req: Request) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function audienceMatches(aud: unknown, expectedAud: string) {
  if (!aud) return false;
  if (typeof aud === "string") return aud === expectedAud;
  if (Array.isArray(aud)) return aud.includes(expectedAud);
  return false;
}

export async function verifyCognito(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: "Missing Authorization Bearer token" });

    const region = process.env.COGNITO_REGION;
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID; // optional but recommended

    if (!region || !userPoolId) {
      return res.status(500).json({
        message: "Missing Cognito env vars",
        missing: {
          COGNITO_REGION: !region,
          COGNITO_USER_POOL_ID: !userPoolId,
        },
      });
    }

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);

    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const JWKS = createRemoteJWKSet(jwksUrl);

    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      clockTolerance: 60,
    });

    // ✅ Correct validation depending on token type
    if (clientId) {
      const tokenUse = payload["token_use"]; // "id" | "access"
      if (tokenUse === "id") {
        const ok = audienceMatches(payload.aud, clientId);
        if (!ok) return res.status(401).json({ message: "Invalid token audience" });
      } else if (tokenUse === "access") {
        const ok = payload.client_id === clientId;
        if (!ok) return res.status(401).json({ message: "Invalid token client_id" });
      } else {
        // unknown token type
        return res.status(401).json({ message: "Invalid token type" });
      }
    }

    const sub = payload.sub;
    if (!sub) return res.status(401).json({ message: "Token missing sub claim" });

    req.auth = { sub, payload: payload as any };
    return next();
  } catch (err: any) {
    console.error("verifyCognito error:", err);
    return res.status(401).json({
      message: "Invalid or expired token",
      detail: err?.message,
    });
  }
}