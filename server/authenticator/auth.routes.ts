import { Router } from "express";
import { signup, login } from "./auth.controller";

const router = Router();

// POST /auth/signup - create a new account
router.post("/signup", signup);

// POST /auth/login - log into an existing account
router.post("/login", login);

export default router;