import { Router } from "express";
import { listReviews, getReview } from "./reviews.controller";

const router = Router();

// GET /reviews - list all reviews
router.get("/", listReviews);

// GET /reviews/:id - get one review by id
router.get("/:id", getReview);

export default router;