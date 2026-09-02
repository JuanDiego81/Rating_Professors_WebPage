import { Router } from "express";
import { signup, login, me } from "./auth.controller";
import { requireAuth } from "./auth.middleware";

const router = Router();

// POST /auth/signup - create a new account
router.post("/signup", signup);

// POST /auth/login - log into an existing account
router.post("/login", login);

// GET /auth/me - return the currently logged-in user (requires a valid token)
router.get("/me", requireAuth, me);

export default router;