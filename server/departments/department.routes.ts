import { Router } from "express";
import { createDepartment } from "./departments.controller";
import { requireAuth } from "../authenticator/auth.middleware";

const router = Router();

// POST /departments - create a new department (requires login)
router.post("/", requireAuth, createDepartment);

export default router;