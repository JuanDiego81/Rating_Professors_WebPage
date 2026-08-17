import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /professors
// Returns every professor, including their department and the courses they teach.
export async function listProfessors(req: Request, res: Response) {
  try {
    const professors = await prisma.professor.findMany({
      include: {
        department: true,
        courses: true,
      },
    });
    res.json(professors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch professors" });
  }
}

// GET /professors/:id
// Returns one professor with department, courses, and their reviews (including tags and votes).
export async function getProfessor(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const professor = await prisma.professor.findUnique({
      where: { id },
      include: {
        department: true,
        courses: true,
        reviews: {
          include: {
            tags: true,
            votes: true,
            course: true,
          },
        },
      },
    });

    if (!professor) {
      return res.status(404).json({ error: "Professor not found" });
    }

    res.json(professor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch professor" });
  }
}