// server/src/controllers/taskController.ts
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

async function assertUserOwnsProject(userId: number, projectId: number) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerUserId: userId },
    select: { id: true },
  });
  return !!project;
}

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const projectIdRaw = req.query.projectId;
    const projectId = Number(projectIdRaw);

    if (!Number.isFinite(projectId) || projectId <= 0) {
      res.status(400).json({ message: "Valid projectId query param is required" });
      return;
    }

    const owns = await assertUserOwnsProject(user.userId, projectId);
    if (!owns) {
      res.status(403).json({ message: "Forbidden: you do not own this project" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
      orderBy: { id: "asc" },
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

    const pid = Number(projectId);
    if (!title || typeof title !== "string") {
      res.status(400).json({ message: "title is required" });
      return;
    }
    if (!Number.isFinite(pid) || pid <= 0) {
      res.status(400).json({ message: "projectId is required" });
      return;
    }

    const owns = await assertUserOwnsProject(user.userId, pid);
    if (!owns) {
      res.status(403).json({ message: "Forbidden: you do not own this project" });
      return;
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        tags,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        points: typeof points === "number" ? points : points ? Number(points) : undefined,
        projectId: pid,

        // ✅ set server-side
        authorUserId: user.userId,

        // optional
        assignedUserId: assignedUserId ? Number(assignedUserId) : undefined,
      },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating a task: ${error.message}` });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    const taskId = Number(req.params.taskId);
    const { status } = req.body;

    if (!Number.isFinite(taskId) || taskId <= 0) {
      res.status(400).json({ message: "Valid taskId is required" });
      return;
    }

    // ✅ Make sure task belongs to a project owned by user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { ownerUserId: user.userId },
      },
      select: { id: true },
    });

    if (!task) {
      res.status(403).json({ message: "Forbidden: task not found or not yours" });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getOrCreateAuthedUser(req);

    // ✅ You can keep this, but lock it to "me" for now:
    // Instead of letting people request any userId, just return authed user's tasks.
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ authorUserId: user.userId }, { assignedUserId: user.userId }],
      },
      include: {
        author: true,
        assignee: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};