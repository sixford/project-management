import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { getAuthedUser } from "../utils/getAuthedUser";

const prisma = new PrismaClient();

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const authedUser = await getAuthedUser(req);

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerUserId: authedUser.userId },
          {
            members: {
              some: {
                userId: authedUser.userId,
              },
            },
          },
        ],
      },
      orderBy: {
        id: "desc",
      },
    });

    res.json(projects);
  } catch (error: any) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: `Error retrieving projects: ${error.message}` });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const authedUser = await getAuthedUser(req);
    const { id } = req.params;

    const numericId = Number(id);

    if (!Number.isFinite(numericId) || numericId <= 0) {
      res.status(400).json({ message: "Invalid project id" });
      return;
    }

    const project = await prisma.project.findFirst({
      where: {
        id: numericId,
        OR: [
          { ownerUserId: authedUser.userId },
          {
            members: {
              some: {
                userId: authedUser.userId,
              },
            },
          },
        ],
      },
    });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.json(project);
  } catch (error: any) {
    console.error("Get project by id error:", error);
    res.status(500).json({ message: `Error retrieving project: ${error.message}` });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const authedUser = await getAuthedUser(req);

    const { name, description, startDate, endDate } = req.body;

    if (!name) {
      res.status(400).json({ message: "Project name is required" });
      return;
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          ownerUserId: authedUser.userId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: authedUser.userId,
          role: "owner",
        },
      });

      return project;
    });

    res.status(201).json(newProject);
  } catch (error: any) {
    console.error("Create project error:", error);
    res.status(500).json({ message: `Error creating project: ${error.message}` });
  }
};