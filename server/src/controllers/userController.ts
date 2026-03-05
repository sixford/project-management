import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { userId: "asc" },
      // ✅ don’t leak fields you don’t need
      select: {
        userId: true,
        username: true,
        profilePictureUrl: true,
        teamId: true,
        cognitoId: true,
      },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving users: ${error.message}` });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { cognitoId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { cognitoId },
      select: {
        userId: true,
        username: true,
        profilePictureUrl: true,
        teamId: true,
        cognitoId: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving user: ${error.message}` });
  }
};