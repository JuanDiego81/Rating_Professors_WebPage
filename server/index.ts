import express from "express";
import cors from "cors";
import "dotenv/config";

import universityRoutes from "./universities/universities.routes";
import professorRoutes from "./professors/professors.routes";
import courseRoutes from "./courses/courses.routes";
import reviewRoutes from "./reviews/reviews.routes";
import authRoutes from "./authenticator/auth.routes";

const app = express();

// Middleware
app.use(cors());          // allows your React frontend (different port) to talk to this server
app.use(express.json());  // lets Express read JSON bodies sent in POST/PUT requests

// Mount each resource's router under its base path.
// This is the piece that connects, e.g., "/" inside university.route.ts
// to the real, reachable URL "/university".
app.use("/university", universityRoutes);
app.use("/professors", professorRoutes);
app.use("/courses", courseRoutes);
app.use("/reviews", reviewRoutes);
app.use("/auth", authRoutes);

// Simple health check route, just to confirm the server is alive
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Catches any request that didn't match a route above.
// Must be the last app.use() call, since Express checks routes top to bottom.
app.use((req, res) => {
  res.status(404).json({ error: "Invalid URL" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});