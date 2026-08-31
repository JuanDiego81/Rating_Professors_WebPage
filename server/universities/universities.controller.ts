import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /universities
// Returns every university (for the homepage search/logo grid).
export async function listUniversities(req: Request, res: Response) {    // standard Express parameters; req is the incoming HTTP request, res is what you use to send back a response.
  try {
    const universities = await prisma.university.findMany();    // queries the database for every row in the university table. Returns an array of university objects. await
  // pauses until the query completes.
    res.json(universities);    // sends the array back to the client as a JSON response with a 200 status.
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch universities" });
  }
}

// GET /universities/:id
// Returns one university with its departments, each department's professors,
// and each professor's courses. This powers the "select a university -> see
// departments + courses + professors" filter panels.
export async function getUniversity(req: Request, res: Response) {
  try {
    const id = req.params.id as string;      // extracts the id from the URL (e.g. /universities/abc-123). The as string cast tells TypeScript to treat it as a string.

    const university = await prisma.university.findUnique({ where: { id },   // queries the DB for exactly one university matching that ID.
      include: {              // this is where it gets interesting. Instead of just returning the university row, Prisma also fetches related data:
        departments: {
          include: {
            professors: {
              include: {
                courses: true,   // (nested inside professors) — all courses each professor teaches
              },
            },
          },
        },
      },
    });

    if (!university) {
      return res.status(404).json({ error: "University not found" });
    }

    res.json(university);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch university" });
  }
}