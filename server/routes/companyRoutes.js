import express from "express";
import {
  ChangeJobApplicationStatus,
  changeVisiblity,
  deleteJob,
  editJob,
  getCompanyData,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  getJob,
  loginCompany,
  postJob,
  registerCompany,
} from "../controller/companyController.js";
import upload from "../config/multer.js";
import { protectCompany } from "../middleware/authMiddleware.js";

const router = express.Router();

// For company registration
router.post(
  "/register",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "businessLicenseFile", maxCount: 1 },
  ]),
  registerCompany
);

// Company Login
router.post("/login", loginCompany);

// Get company Data
router.get("/company", protectCompany, getCompanyData);

// Post a job
router.post("/post-job", protectCompany, postJob);

// Get Applicants Data
router.get("/applicants", protectCompany, getCompanyJobApplicants);

// Get company Job List
router.get("/list-jobs", protectCompany, getCompanyPostedJobs);

// Get a single job
router.get("/job/:id", protectCompany, getJob);

// Change Applications Status
router.post("/change-status", protectCompany, ChangeJobApplicationStatus);

// Change Applications Visiblity
router.post("/change-visibility", protectCompany, changeVisiblity);

// Delete a job
router.delete("/delete-job/:id", protectCompany, deleteJob);

// Edit a job
router.put("/edit-job/:id", protectCompany, editJob);

export default router;
