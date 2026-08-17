import { Router } from "express";
import { listReviews, getReview, createReview } from "./reviews.controller";
import { requireAuth } from "../authenticator/auth.middleware";
import { voteOnReview } from "../vote/vote.controller";

const router = Router();

// GET /reviews - list all reviews
router.get("/", listReviews);

// GET /reviews/:id - get one review by id
router.get("/:id", getReview);

// POST /reviews - create a new review (requires login)
router.post("/", requireAuth, createReview);

// POST /reviews/:id/vote - upvote or downvote a review (requires login)
router.post("/:id/vote", requireAuth, voteOnReview);

export default router;