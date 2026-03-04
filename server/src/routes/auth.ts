// server/src/routes/auth.ts
import { Router } from "express";
import { verifyCognito } from "../middleware/verifyCognito";
import { getMe } from "../controllers/authController";

const router = Router();

router.get("/me", verifyCognito, getMe)

function normalizeDomain(domain: string) {
  return domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

router.post("/token", async (req, res) => {
  try {
    const code = req.body?.code as string | undefined;

    if (!code) {
      return res.status(400).json({ message: "Missing code" });
    }

    const domainRaw = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    const redirectUri = process.env.COGNITO_REDIRECT_URI;

    if (!domainRaw || !clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        message: "Missing Cognito env vars",
        missing: {
          COGNITO_DOMAIN: !domainRaw,
          COGNITO_CLIENT_ID: !clientId,
          COGNITO_CLIENT_SECRET: !clientSecret,
          COGNITO_REDIRECT_URI: !redirectUri,
        },
      });
    }

    const domain = normalizeDomain(domainRaw);

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    });

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch(`https://${domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body,
    });

    const text = await tokenRes.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        message: "Cognito token exchange failed",
        status: tokenRes.status,
        cognito: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("POST /auth/token error:", err);
    return res.status(500).json({ message: "Server error exchanging token" });
  }
});

export default router;