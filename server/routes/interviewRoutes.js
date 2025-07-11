import express from "express";
import {
  scheduleInterview,
  getCompanyInterviews,
  updateInterviewStatus,
  cancelInterview,
} from "../controllers/interviewController.js";
import { verifyCompanyToken } from "../middleware/auth.js";

const router = express.Router();

// All routes are protected with company authentication
router.use(verifyCompanyToken);

// Schedule a new interview
router.post("/schedule-interview", scheduleInterview);

// Get all interviews for a company
router.get("/company-interviews", getCompanyInterviews);

// Update interview status
router.patch("/:interviewId/status", updateInterviewStatus);

// Cancel interview
router.post("/:interviewId/cancel", cancelInterview);

export { router as default };
