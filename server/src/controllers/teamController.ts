import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getTeams = async (_req: Request, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { id: "asc" },
    });

    const userIds = Array.from(
      new Set(
        teams.flatMap((team) =>
          [team.productOwnerUserId, team.projectManagerUserId].filter(
            (id): id is number => id !== null && id !== undefined
          )
        )
      )
    );

    const users = await prisma.user.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        username: true,
      },
    });

    const usersMap = new Map(users.map((user) => [user.userId, user.username]));

    const teamsWithUsernames = teams.map((team) => ({
      ...team,
      productOwnerUsername: team.productOwnerUserId
        ? usersMap.get(team.productOwnerUserId) ?? null
        : null,
      projectManagerUsername: team.projectManagerUserId
        ? usersMap.get(team.projectManagerUserId) ?? null
        : null,
    }));

    res.json(teamsWithUsernames);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving teams: ${error.message}` });
  }
};

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, productOwnerUserId, projectManagerUserId } = req.body;

    if (!teamName || typeof teamName !== "string") {
      res.status(400).json({ message: "teamName is required" });
      return;
    }

    const newTeam = await prisma.team.create({
      data: {
        teamName,
        // ✅ roles are optional (good design)
        productOwnerUserId: productOwnerUserId
          ? Number(productOwnerUserId)
          : null,
        projectManagerUserId: projectManagerUserId
          ? Number(projectManagerUserId)
          : null,
      },
    });

    res.status(201).json(newTeam);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating team: ${error.message}` });
  }
};