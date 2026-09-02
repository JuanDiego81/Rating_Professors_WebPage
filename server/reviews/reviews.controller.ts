import { Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest } from "../authenticator/auth.middleware";
import { Request } from "express";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /reviews
// Returns every review, including its professor, course, tags, and votes.
export async function listReviews(req: Request, res: Response) {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        professor: true,
        course: true,
        tags: true,
        votes: true,
      },
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// GET /reviews/:id
// Returns one review with its professor, course, tags, and votes.
export async function getReview(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        professor: true,
        course: true,
        tags: true,
        votes: true,
      },
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
}

// POST /reviews
// Creates a new review. Protected by requireAuth middleware - only logged-in users can hit this.
// Note: we use req.userId (set by the auth middleware after verifying the token),
// NOT a userId sent in the request body. Never trust the client to say who they are.
export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId as string;

    const {
      professorId,
      courseId,
      qualityRating,
      difficultyRating,
      wouldTakeAgain,
      gradeReceived,
      comment,
      tagIds, // expects an array of existing Tag ids, e.g. ["tagId1", "tagId2"]
    } = req.body;

    if (!professorId || !courseId || !qualityRating || !difficultyRating || !comment) {
      return res.status(400).json({
        error: "professorId, courseId, qualityRating, difficultyRating, and comment are required",
      });
    }

    const professor = await prisma.professor.findUnique({ where: { id: professorId } });
    if (!professor) {
      return res.status(404).json({ error: "Professor not found" });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (tagIds && tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({ where: { id: { in: tagIds } } });
      if (existingTags.length !== tagIds.length) {
        return res.status(404).json({ error: "One or more tags not found" });
      }
    }

    const review = await prisma.review.create({
      data: {
        professorId,
        courseId,
        userId,
        qualityRating,
        difficultyRating,
        wouldTakeAgain: wouldTakeAgain ?? null,
        gradeReceived: gradeReceived ?? null,
        comment,
        tags: tagIds
          ? {
              connect: tagIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        professor: true,
        course: true,
        tags: true,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create review" });
  }
}