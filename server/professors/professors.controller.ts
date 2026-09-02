import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest } from "../authenticator/auth.middleware";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /professors
// Returns every professor, including their department, courses, and average ratings.
export async function listProfessors(req: Request, res: Response) {
  try {
    const professors = await prisma.professor.findMany({
      include: {
        department: true,
        courses: true,
        reviews: {
          select: {
            qualityRating: true,
            difficultyRating: true,
          },
        },
      },
    });

    // Reshape each professor: replace the raw reviews array with computed averages,
    // since a list view just needs the summary numbers, not every review's full text.
    const professorsWithRatings = professors.map((professor) => {   // to iterate through professors
      const { reviews, ...rest } = professor;  // anything that is not reviews from the professor fields go to rest
      const reviewCount = reviews.length;

      const averageQuality =
        reviewCount === 0
          ? null
          : reviews.reduce((sum, r) => sum + r.qualityRating, 0) / reviewCount;

      const averageDifficulty =
        reviewCount === 0
          ? null
          : reviews.reduce((sum, r) => sum + r.difficultyRating, 0) / reviewCount;

      return {
        ...rest,
        reviewCount,
        averageQuality,
        averageDifficulty,
      };
    });

    res.json(professorsWithRatings);
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

    // Compute averages from the full reviews array we already fetched above
    const reviewCount = professor.reviews.length;

    const averageQuality =
      reviewCount === 0
        ? null
        : professor.reviews.reduce((sum, r) => sum + r.qualityRating, 0) / reviewCount;

    const averageDifficulty =
      reviewCount === 0
        ? null
        : professor.reviews.reduce((sum, r) => sum + r.difficultyRating, 0) / reviewCount;

    res.json({
      ...professor,
      reviewCount,
      averageQuality,
      averageDifficulty,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch professor" });
  }
}

// POST /professors
// Creates a new professor, linked to an existing department, and optionally
// connected to existing courses right away. Protected by requireAuth.
export async function createProfessor(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, departmentId, courseIds } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({ error: "name and departmentId are required" });
    }

    // Check the department actually exists before linking to it
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const professor = await prisma.professor.create({
      data: {
        name,
        departmentId,
        courses: courseIds
          ? {
              connect: courseIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        department: true,
        courses: true,
      },
    });

    res.status(201).json(professor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create professor" });
  }
}

// POST /professors/:id/courses
// Links an already-existing course to an already-existing professor (e.g. so it
// shows up as an option when writing a review). Protected by requireAuth.
export async function addCourseToProfessor(req: AuthenticatedRequest, res: Response) {
  try {
    const professorId = req.params.id as string;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const professor = await prisma.professor.findUnique({ where: { id: professorId } });
    if (!professor) {
      return res.status(404).json({ error: "Professor not found" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.departmentId !== professor.departmentId) {
      return res.status(400).json({ error: "Course does not belong to this professor's department" });
    }

    const updated = await prisma.professor.update({
      where: { id: professorId },
      data: {
        courses: {
          connect: { id: courseId },
        },
      },
      include: {
        department: true,
        courses: true,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add course to professor" });
  }
}