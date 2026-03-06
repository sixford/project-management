import { Request, Response } from "express";
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

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.query;
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId: Number(projectId) },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const {
      title,
      description,
      status,
      priority,
      tags,
      startDate,
      dueDate,
      points,
      projectId,
      assignedUserId,
    } = req.body;

    if (!title || !projectId) {
      res.status(400).json({ message: "Missing required fields: title, projectId" });
      return;
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || null,
        priority: priority || null,
        tags: tags || null,

        // ✅ only set dates if provided
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,

        points: typeof points === "number" ? points : points ? Number(points) : null,

        projectId: Number(projectId),

        // ✅ AUTHOR comes from token (no more typing ids)
        authorUserId: user.userId,

        // ✅ assignee optional
        assignedUserId: assignedUserId ? Number(assignedUserId) : null,
      },
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating a task: ${error.message}` });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const { status } = req.body;
  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: { status },
    });
    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ authorUserId: Number(userId) }, { assignedUserId: Number(userId) }],
      },
      include: { author: true, assignee: true },
    });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};