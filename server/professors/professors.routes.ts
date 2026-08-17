import { Router } from "express";
import { listProfessors, getProfessor, createProfessor } from "./professors.controller";
import { requireAuth } from "../authenticator/auth.middleware";

const router = Router();

// GET /professors - list all professors
router.get("/", listProfessors);

// GET /professors/:id - get one professor by id
router.get("/:id", getProfessor);

// POST /professors - create a new professor (requires login)
router.post("/", requireAuth, createProfessor);

export default router;