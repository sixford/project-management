import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateAuthedUser(req: Request) {
  const sub = req.auth?.sub;
  if (!sub) {
    throw new Error("Missing req.auth.sub (did you forget verifyCognito middleware?)");
  }

  const payload = req.auth?.payload ?? {};
  const email: string | undefined = payload.email;

  const usernameFromToken: string | undefined =
    payload["cognito:username"] ??
    payload.username ??
    (email ? email.split("@")[0] : undefined);

  const username = usernameFromToken ?? `user_${sub.slice(0, 8)}`;

  const user = await prisma.user.upsert({
    where: { cognitoId: sub },
    update: {},
    create: {
      cognitoId: sub,
      username,
    },
  });

  return user;
}

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const rawQuery = req.query.query;
    const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

    if (!query) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        project: {
          ownerUserId: user.userId,
        },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
        project: true,
      },
      orderBy: { id: "desc" },
      take: 20,
    });

    const projects = await prisma.project.findMany({
      where: {
        ownerUserId: user.userId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { id: "desc" },
      take: 20,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { cognitoId: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        userId: true,
        username: true,
        profilePictureUrl: true,
        cognitoId: true,
        teamId: true,
      },
      orderBy: { userId: "desc" },
      take: 20,
    });

    res.json({ tasks, projects, users });
  } catch (error: any) {
    res.status(500).json({
      message: `Error performing search: ${error.message}`,
    });
  }
};