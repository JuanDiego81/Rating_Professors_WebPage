import { Router } from "express";
import { listTags } from "./tag.controller";

const router = Router();

// GET /tags - list all tags
router.get("/", listTags);

export default router;
