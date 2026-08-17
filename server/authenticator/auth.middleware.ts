import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


// This is for functions like create review, to make sure that a use is logged in
// Extends Express's Request type so TypeScript knows req.userId can exist
// after this middleware runs.
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Attach this middleware to any route that should require a logged-in user.
// Example: router.post("/", requireAuth, createReview);
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Expecting a header like: "Authorization: Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = decoded.userId;
    next(); // token is valid, let the request continue to the actual route handler
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}