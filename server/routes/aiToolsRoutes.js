import express from "express";
import {
  generateResume,
  generateCoverLetter,
  generateInterviewQuestions,
} from "../controllers/aiToolsController.js";

const router = express.Router();

router.post("/resume", generateResume);
router.post("/cover-letter", generateCoverLetter);
router.post("/interview-prep", generateInterviewQuestions);

export default router;

