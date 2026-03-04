// server/src/controllers/projectController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getOrCreateAuthedUser(req: Request) {
  const sub = req.auth?.sub;
  if (!sub) throw new Error("Missing req.auth.sub (did you forget verifyCognito middleware?)");

  const payload = req.auth?.payload ?? {};

  // Try to derive something stable for username/email
  const email: string | undefined = payload.email;
  const usernameFromToken: string | undefined =
    payload["cognito:username"] ?? payload.username ?? (email ? email.split("@")[0] : undefined);

  const username = usernameFromToken ?? `user_${sub.slice(0, 8)}`;

  // Upsert so first login creates the user record
  const user = await prisma.user.upsert({
    where: { cognitoId: sub },
    update: {},
    create: {
      cognitoId: sub,
      username,
      // NOTE: your schema doesn't include email currently; if you add it later, store it here.
    },
  });

  return user;
}

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const projects = await prisma.project.findMany({
      where: { ownerUserId: user.userId },
      orderBy: { id: "asc" },
    });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving projects: ${error.message}` });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const { name, description, startDate, endDate } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Project name is required" });
      return;
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ownerUserId: user.userId,
      },
    });

    res.status(201).json(newProject);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating a project: ${error.message}` });
  }
};