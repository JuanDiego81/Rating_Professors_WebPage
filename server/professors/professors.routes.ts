import { Router } from "express";
import { listProfessors, getProfessor } from "./professors.controller";

const router = Router();

// GET /professors - list all professors
router.get("/", listProfessors);

// GET /professors/:id - get one professor by id
router.get("/:id", getProfessor);

export default router;