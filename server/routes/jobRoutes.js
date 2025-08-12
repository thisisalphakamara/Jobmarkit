import express from "express";
import { getJobById, getJobs } from "../controller/jobController.js";
import { getJobMatches } from "../controller/jobMatchingController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes to get all jobs data
router.get("/", getJobs);

// Route to get job matches for the authenticated user
router.get("/matches", protectUser, getJobMatches);

// Route to get a single job by ID
router.get("/:id", getJobById);

export default router;
