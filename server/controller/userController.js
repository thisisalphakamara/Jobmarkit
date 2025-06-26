import e from "express";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 } from "cloudinary";
import { users } from "@clerk/clerk-sdk-node";

// Create or get user
export const createUser = async (req, res) => {
  const { userId, email, firstName, lastName } = req.body;

  try {
    // Check if user already exists
    let user = await User.findById(userId);

    if (user) {
      return res.json({ success: true, user });
    }

    // If user doesn't exist, create new user
    user = await User.create({
      _id: userId, // Use Clerk's userId as MongoDB _id
      email,
      firstName,
      lastName,
    });

    res.json({ success: true, user });
  } catch (error) {
    console.log("Error creating/getting user:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get user Data
export const getUserData = async (req, res) => {
  const userId = req.auth.userId;
  console.log("User ID from request:", userId);

  try {
    // First try to find the user
    let user = await User.findById(userId);

    // If user doesn't exist, fetch from Clerk and create
    if (!user) {
      // Fetch full user profile from Clerk
      const clerkUser = await users.getUser(userId);

      const firstName = clerkUser.firstName || clerkUser.first_name || "";
      const lastName = clerkUser.lastName || clerkUser.last_name || "";
      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        clerkUser.email_addresses?.[0]?.email_address ||
        "";
      const profileImage = clerkUser.imageUrl || clerkUser.image_url || "";

      console.log("Clerk user data:", {
        firstName,
        lastName,
        email,
        profileImage,
      });

      if (!firstName || !lastName || !email) {
        return res.json({
          success: false,
          message: "Missing required user fields from Clerk.",
        });
      }

      user = await User.create({
        _id: userId,
        firstName,
        lastName,
        email,
        profileImage,
      });
    } else {
      // Update existing user's profile image if it's not set
      if (!user.profileImage) {
        const clerkUser = await users.getUser(userId);
        const profileImage = clerkUser.imageUrl || clerkUser.image_url || "";

        if (profileImage) {
          user.profileImage = profileImage;
          await user.save();
        }
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    console.log("Error fetching/creating user:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Apply For a Job
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.auth.userId;

  console.log("Applying for job with data:", { jobId, userId });

  try {
    // First verify that the user exists
    const user = await User.findById(userId);
    console.log("Found user:", user ? "Yes" : "No");

    if (!user) {
      return res.json({
        success: false,
        message: "User not found. Please complete your profile first.",
      });
    }

    // Check if already applied
    const isAlreadyApplied = await JobApplication.findOne({ userId, jobId });
    console.log("Already applied:", isAlreadyApplied ? "Yes" : "No");

    if (isAlreadyApplied) {
      return res.json({
        success: false,
        message: "You have already applied for this job",
      });
    }

    // Get job data
    const jobData = await Job.findById(jobId);
    console.log("Found job:", jobData ? "Yes" : "No");

    if (!jobData) {
      return res.json({ success: false, message: "Job not found" });
    }

    // Create the application
    const applicationData = {
      companyId: jobData.companyId,
      userId: userId,
      jobId: jobId,
      date: Date.now(),
      status: "pending",
    };

    console.log("Creating application with data:", applicationData);

    const application = await JobApplication.create(applicationData);
    console.log("Created application:", application);

    res.json({ success: true, message: "Applied Successfully" });
  } catch (error) {
    console.error("Error applying for job:", error);
    console.error("Error stack:", error.stack);
    res.json({
      success: false,
      message: "Error applying for the job. Please try again.",
      error: error.message,
    });
  }
};

// Get User applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.auth.userId;

    const applications = await JobApplication.find({ userId })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location level salary")
      .exec();

    if (!applications) {
      return res.json({
        success: false,
        message: "No applications found for this User",
      });
    }

    return res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update User Profile (resume)
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const resumeFile = req.file;

    console.log("Resume file:", resumeFile);

    const userData = await User.findById(userId);

    if (resumeFile) {
      const resumeUpload = await v2.uploader.upload(resumeFile.path);
      userData.resume = resumeUpload.secure_url;
    }
    await userData.save();

    return res.json({ success: true, message: "Resume Updated Successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
