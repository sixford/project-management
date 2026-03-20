// server/src/controllers/authController.ts
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateAuthedUser(req: Request) {
  const sub = req.auth?.sub;
  if (!sub) {
    throw new Error("Missing req.auth.sub (did you forget verifyCognito middleware?)");
  }

  const payload = req.auth?.payload ?? {};

  const email: string | undefined =
    typeof payload.email === "string" ? payload.email : undefined;

  const usernameFromToken: string | undefined =
    typeof payload["cognito:username"] === "string"
      ? payload["cognito:username"]
      : typeof payload.username === "string"
      ? payload.username
      : email
      ? email.split("@")[0]
      : undefined;

  const username = usernameFromToken ?? `user_${sub.slice(0, 8)}`;

  // 1) First try exact Cognito match
  let user = await prisma.user.findUnique({
    where: { cognitoId: sub },
  });

  if (user) {
    return { user, payload, sub };
  }

  // 2) No cognitoId match — try existing username
  const existingByUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingByUsername) {
    // Re-link existing DB user to the new Cognito sub
    user = await prisma.user.update({
      where: { userId: existingByUsername.userId },
      data: {
        cognitoId: sub,
      },
    });

    return { user, payload, sub };
  }

  // 3) Otherwise create fresh user
  user = await prisma.user.create({
    data: {
      cognitoId: sub,
      username,
    },
  });

  return { user, payload, sub };
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, payload, sub } = await getOrCreateAuthedUser(req);

    res.json({
      userSub: sub,
      user: {
        username: payload["cognito:username"] ?? payload.username ?? user.username,
        email: payload.email ?? null,
      },
      userDetails: {
        userId: user.userId,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl ?? null,
        cognitoId: user.cognitoId,
        teamId: user.teamId ?? null,
      },
    });
  } catch (error: any) {
    console.error("GET /auth/me error:", error);
    res.status(500).json({
      message: `Error retrieving current user: ${error.message}`,
    });
  }
};