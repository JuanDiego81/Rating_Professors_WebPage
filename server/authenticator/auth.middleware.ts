import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// This is for functions like create review, to make sure that a use is logged in
// Extends Express's Request type so TypeScript knows req.userId can exist
// after this middleware runs.
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Attach this middleware to any route that should require a logged-in user.
// Example: router.post("/", requireAuth, createReview);
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Expecting a header like: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    // The token's signature can still be valid after its user was deleted
    // (e.g. a dev database reset) - check the user still exists so we fail
    // with a clear 401 here instead of a foreign-key error downstream.
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: "Session expired, please log in again" });
    }

    req.userId = decoded.userId;
    next(); // token is valid and its user still exists, let the request continue
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}