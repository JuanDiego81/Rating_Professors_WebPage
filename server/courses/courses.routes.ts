import { Router } from "express";
import { listCourses, getCourse, createCourse } from "./courses.controller";
import { requireAuth } from "../authenticator/auth.middleware";

const router = Router();

// GET /courses - list all courses
router.get("/", listCourses);

// GET /courses/:id - get one course with professors and reviews
router.get("/:id", getCourse);

// POST /courses - create a new course (requires login)
router.post("/", requireAuth, createCourse);

export default router;