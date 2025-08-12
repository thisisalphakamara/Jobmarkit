import express from "express";
import {
  applyForJob,
  createUser,
  getUserData,
  getUserJobApplications,
  updateUserResume,
  analyzeResume,
  getAIRecommendations,
  saveJob,
  unsaveJob,
  getSavedJobs,
  checkIfJobSaved,
  removeUserResume,
  testResumeParsing,
} from "../controller/userController.js";
import upload from "../config/multer.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/create-user", createUser);

// Protected routes
router.get("/user", protectUser, getUserData);
router.get("/applications", protectUser, getUserJobApplications);
router.post("/apply", protectUser, applyForJob);
router.post(
  "/update-resume",
  protectUser,
  upload.single("resume"),
  updateUserResume
);
router.post("/remove-resume", protectUser, removeUserResume);

// AI and Resume Analysis routes
router.get("/analyze-resume", protectUser, analyzeResume);
router.get("/ai-recommendations", protectUser, getAIRecommendations);
router.post("/test-resume-parsing", protectUser, testResumeParsing);

// Saved Jobs routes
router.post("/save-job", protectUser, saveJob);
router.post("/unsave-job", protectUser, unsaveJob);
router.get("/saved-jobs", protectUser, getSavedJobs);
router.get("/check-saved/:jobId", protectUser, checkIfJobSaved);

export default router;
