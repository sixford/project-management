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

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.query;

  try {
    if (!projectId) {
      res.status(400).json({ message: "projectId query param is required" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: Number(projectId) },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
      orderBy: { id: "desc" },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};

export const getMyTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { authorUserId: user.userId },
          { assignedUserId: user.userId },
          {
            project: {
              ownerUserId: user.userId,
            },
          },
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
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving my tasks: ${error.message}` });
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
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        points: typeof points === "number" ? points : points ? Number(points) : null,
        projectId: Number(projectId),
        authorUserId: user.userId,
        assignedUserId: assignedUserId ? Number(assignedUserId) : null,
      },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
        project: true,
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
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
        project: true,
      },
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
        OR: [
          { authorUserId: Number(userId) },
          { assignedUserId: Number(userId) },
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
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};