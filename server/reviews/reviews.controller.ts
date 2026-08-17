import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

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