import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest } from "../authenticator/auth.middleware";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /courses
// Optionally filtered with ?departmentId=... so callers can scope the list to
// one department instead of getting every course in the system.

export async function listCourses(req: Request, res: Response) {    // standard Express parameters; req is the incoming HTTP request, res is what you use to send back a response.
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const courses = await prisma.course.findMany({
      where: departmentId ? { departmentId } : undefined,
    });    // queries the database for every row in the university table. Returns an array of university objects. await
  // pauses until the query completes.
    res.json(courses);    // sends the array back to the client as a JSON response with a 200 status.
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}


// GET /courses/:id
// Returns one course with its professors and reviews

export async function getCourse(req: Request, res: Response) {
  try {
    const id = req.params.id as string;     

    const course = await prisma.course.findUnique({ where: { id },   // queries the DB for exactly one university matching that ID.
      include: {              // this is where it gets interesting. Instead of just returning the university row, Prisma also fetches related data:
        professors: true,
        reviews: true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
}

// POST /courses
// Creates a new course scoped to a department. Protected by requireAuth - only logged-in users can add courses.
export async function createCourse(req: AuthenticatedRequest, res: Response) {
  try {
    const { code, name, departmentId } = req.body;

    if (!code || !name || !departmentId) {
      return res.status(400).json({ error: "code, name, and departmentId are required" });
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check if a course with this code already exists in this department, to avoid duplicates
    const existingCourse = await prisma.course.findFirst({
      where: { code, departmentId },
    });

    if (existingCourse) {
      return res.status(409).json({ error: "A course with this code already exists in this department" });
    }

    const course = await prisma.course.create({
      data: { code, name, departmentId },
    });

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create course" });
  }
}