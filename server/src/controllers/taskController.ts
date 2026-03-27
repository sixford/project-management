import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { getAuthedUser } from "../utils/getAuthedUser";

const prisma = new PrismaClient();

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.query;

  try {
    const authedUser = await getAuthedUser(req);

    if (!projectId) {
      res.status(400).json({ message: "projectId query param is required" });
      return;
    }

    const numericProjectId = Number(projectId);

    if (!Number.isFinite(numericProjectId) || numericProjectId <= 0) {
      res.status(400).json({ message: "Invalid projectId" });
      return;
    }

    const project = await prisma.project.findFirst({
      where: {
        id: numericProjectId,
        ownerUserId: authedUser.userId,
      },
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: numericProjectId,
        project: {
          ownerUserId: authedUser.userId,
        },
      },
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
    const user = await getAuthedUser(req);

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
    const user = await getAuthedUser(req);

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

    const numericProjectId = Number(projectId);

    if (!Number.isFinite(numericProjectId) || numericProjectId <= 0) {
      res.status(400).json({ message: "Invalid projectId" });
      return;
    }

    const project = await prisma.project.findFirst({
      where: {
        id: numericProjectId,
        ownerUserId: user.userId,
      },
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
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
        projectId: numericProjectId,
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
    const user = await getAuthedUser(req);

    const numericTaskId = Number(taskId);

    if (!Number.isFinite(numericTaskId) || numericTaskId <= 0) {
      res.status(400).json({ message: "Invalid taskId" });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: numericTaskId,
        project: {
          ownerUserId: user.userId,
        },
      },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: numericTaskId },
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
    const authedUser = await getAuthedUser(req);
    const numericUserId = Number(userId);

    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        project: {
          ownerUserId: authedUser.userId,
        },
        OR: [
          { authorUserId: numericUserId },
          { assignedUserId: numericUserId },
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