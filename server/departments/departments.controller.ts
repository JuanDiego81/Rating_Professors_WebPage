import { Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest } from "../authenticator/auth.middleware";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// POST /departments
export async function createDepartment(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, universityId } = req.body;

    if (!name || !universityId) {
      return res.status(400).json({ error: "name and universityId are required" });
    }

    // Check if department already exists
    const existingDept = await prisma.department.findFirst({
      where: {
        name,
        universityId,
      },
    });

    if (existingDept) {
      return res.status(409).json({ error: "This department already exists at this university" });
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        universityId,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create department" });
  }
}