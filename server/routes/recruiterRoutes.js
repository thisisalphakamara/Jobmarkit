import express from "express";
import multer from "multer";
import path from "path";
import {
  registerRecruiter,
  loginRecruiter,
  verifyEmail,
  resendVerificationCode,
  getRecruiterProfile,
  updateRecruiterProfile,
  getAllRecruiters,
  updateVerificationStatus,
  deleteRecruiterAccount,
  requestRecruiterPasswordReset,
  resetRecruiterPassword,
} from "../controller/recruiterController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDF files are allowed"), false);
    }
  },
});

// Public routes
router.post(
  "/register",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "businessLicenseFile", maxCount: 1 },
  ]),
  registerRecruiter
);
router.post("/login", loginRecruiter);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);
router.post("/request-password-reset", requestRecruiterPasswordReset);
router.post("/reset-password", resetRecruiterPassword);

// Protected routes (require authentication)
router.get("/profile", authMiddleware, getRecruiterProfile);
router.put(
  "/profile",
  authMiddleware,
  upload.single("logo"),
  updateRecruiterProfile
);
router.delete("/account", authMiddleware, deleteRecruiterAccount);

// Admin routes (require admin authentication)
router.get("/admin/all", authMiddleware, getAllRecruiters);
router.put(
  "/admin/verify/:recruiterId",
  authMiddleware,
  updateVerificationStatus
);

export default router;
