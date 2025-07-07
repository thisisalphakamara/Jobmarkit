import express from "express";
import {
  translateJob,
  retranslateAllJobs,
} from "../controllers/translateController.js";

const router = express.Router();

// Translate job posting
router.post("/job", translateJob);

// Re-translate all existing jobs
router.post("/retranslate-all", retranslateAllJobs);

export default router;
