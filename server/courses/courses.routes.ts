import { Router } from "express";
import { listCourses, getCourse } from "./courses.controller";

const router = Router();

// GET /courses - list all courses
router.get("/", listCourses);

// GET /courses/:id - get one course with professors and reviews
router.get("/:id", getCourse);

export default router;