import { Router } from "express";
import { listUniversities, getUniversity } from "./universities.controller";

const router = Router();

// GET /universities - list all universities
router.get("/", listUniversities);

// GET /universities/:id - get one university with departments and professors
router.get("/:id", getUniversity);

export default router;