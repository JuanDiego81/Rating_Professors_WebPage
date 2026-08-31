import { Request, Response } from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /tags
// Returns every predefined tag, so the frontend can show them as selectable checkboxes.
export async function listTags(req: Request, res: Response) {
  try {
    const tags = await prisma.tag.findMany();
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
}
