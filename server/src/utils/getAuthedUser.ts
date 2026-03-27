import type { Request } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAuthedUser(req: Request) {
  const sub = req.auth?.sub;

  if (!sub) {
    throw new Error("Missing authenticated Cognito sub");
  }

  const user = await prisma.user.findUnique({
    where: { cognitoId: sub },
  });

  if (!user) {
    throw new Error("Authenticated user not found in database");
  }

  return user;
}