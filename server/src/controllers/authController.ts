// server/src/controllers/authController.ts
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateAuthedUser(req: Request) {
  const sub = req.auth?.sub;
  if (!sub) throw new Error("Missing req.auth.sub (did you forget verifyCognito middleware?)");

  const payload = req.auth?.payload ?? {};

  const email: string | undefined = payload.email;
  const usernameFromToken: string | undefined =
    payload["cognito:username"] ?? payload.username ?? (email ? email.split("@")[0] : undefined);

  const username = usernameFromToken ?? `user_${sub.slice(0, 8)}`;

  // Upsert so first login creates user row
  const user = await prisma.user.upsert({
    where: { cognitoId: sub },
    update: {},
    create: {
      cognitoId: sub,
      username,
      // profilePictureUrl can be set later
    },
  });

  return { user, payload, sub };
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, payload, sub } = await getOrCreateAuthedUser(req);

    // Return a shape your Sidebar already expects
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
    res.status(500).json({ message: `Error retrieving current user: ${error.message}` });
  }
};