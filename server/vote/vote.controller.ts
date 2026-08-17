import { Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { AuthenticatedRequest } from "../authenticator/auth.middleware";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// POST /reviews/:id/vote
// Creates a vote on a review, or updates the user's existing vote if they already voted.
// Protected by requireAuth - a vote is always tied to req.userId, never a value sent by the client.
export async function voteOnReview(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId as string;
    const reviewId = req.params.id as string;
    const { value } = req.body;

    // value must be exactly 1 (upvote) or -1 (downvote) - reject anything else
    if (value !== 1 && value !== -1) {
      return res.status(400).json({ error: "value must be 1 (upvote) or -1 (downvote)" });
    }

    // Confirm the review actually exists before letting someone vote on it
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // upsert = "update if it exists, otherwise create it"
    // userId_reviewId is the compound key Prisma auto-generates from
    // @@unique([userId, reviewId]) in the Vote model.
    const vote = await prisma.vote.upsert({   // upser means update or insert
      where: {
        userId_reviewId: {
          userId,
          reviewId,
        },
      },
      update: {   // if it watches the where clause
        value,
      },
      create: {  // if it does not match the where cluase
        userId,
        reviewId,
        value,
      },
    });

    res.status(200).json(vote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to vote on review" });
  }
}