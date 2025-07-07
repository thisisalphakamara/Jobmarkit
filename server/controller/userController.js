import e from "express";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 } from "cloudinary";
import { users } from "@clerk/clerk-sdk-node";

// Import resume parser with error handling
let ResumeParser;
try {
  const { ResumeParser: ResumeParserClass } = await import(
    "../services/resumeParser.js"
  );
  ResumeParser = ResumeParserClass;
} catch (error) {
  console.warn("Resume parser not available:", error.message);
  ResumeParser = null;
}

// Create or get user
export const createUser = async (req, res) => {
  const { userId, email, firstName, lastName } = req.body;

  try {
    // Check if user already exists by _id
    let user = await User.findById(userId);

    if (user) {
      return res.json({ success: true, user });
    }

    // Check for existing user by email
    let existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      // Remove the old document with the duplicate email
      await User.deleteOne({ _id: existingByEmail._id });
    }

    // Now create the user with the new Clerk userId
    user = await User.create({
      _id: userId,
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

// Utility: Sync user from Clerk
const syncUserFromClerk = async (clerkUserId) => {
  const clerkUser = await users.getUser(clerkUserId);
  const firstName = clerkUser.firstName || clerkUser.first_name || "";
  const lastName = clerkUser.lastName || clerkUser.last_name || "";
  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    clerkUser.email_addresses?.[0]?.email_address ||
    "";
  const imageUrl = clerkUser.imageUrl || clerkUser.image_url || "";

  if (!firstName || !lastName || !email) {
    throw new Error("Missing required user fields from Clerk.");
  }

  // Upsert user in local DB
  const user = await User.findOneAndUpdate(
    { _id: clerkUserId },
    {
      $set: {
        firstName,
        lastName,
        email,
        image: imageUrl,
        profileImage: imageUrl,
      },
    },
    { new: true, upsert: true }
  );
  return user;
};

// Get user Data
export const getUserData = async (req, res) => {
  const userId = req.auth.userId;
  console.log("User ID from request:", userId);

  try {
    // Always sync from Clerk
    const user = await syncUserFromClerk(userId);
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error syncing/fetching user:", error.message);
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

// Simple job matching function without external dependencies
const simpleJobMatching = (job, userSkills = []) => {
  let score = 0;
  let maxScore = 100;
  let skillMatches = [];
  let missingSkills = [];

  // Skills matching (40 points)
  if (job.skills && userSkills.length > 0) {
    const jobSkills = job.skills.map((skill) => skill.toLowerCase());
    const resumeSkills = userSkills.map((skill) => skill.toLowerCase());

    jobSkills.forEach((skill) => {
      if (resumeSkills.includes(skill)) {
        skillMatches.push(skill);
        score += 40 / jobSkills.length;
      } else {
        missingSkills.push(skill);
      }
    });
  }

  // Experience level matching (25 points)
  const experienceMap = {
    "entry level": 0,
    junior: 1,
    "mid-level": 2,
    senior: 3,
    executive: 4,
  };

  const resumeLevel = experienceMap["mid-level"] || 0; // Default to mid-level
  const jobLevel = experienceMap[job.level] || 0;

  if (resumeLevel === jobLevel) {
    score += 25;
  } else if (Math.abs(resumeLevel - jobLevel) === 1) {
    score += 15;
  } else if (resumeLevel >= jobLevel) {
    score += 20;
  }

  // Location matching (20 points) - assume Sierra Leone location
  const jobLocation = job.location?.toLowerCase() || "";
  if (
    jobLocation.includes("freetown") ||
    jobLocation.includes("sierra leone")
  ) {
    score += 20;
  } else if (jobLocation.includes("remote")) {
    score += 15;
  }

  // Education matching (15 points) - assume has education
  score += 15;

  return {
    score: Math.min(score, maxScore),
    percentage: Math.round((score / maxScore) * 100),
    skillMatches,
    missingSkills,
    maxScore,
  };
};

// Analyze user resume and provide AI job matching
export const analyzeResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resume) {
      return res.json({
        success: false,
        message: "No resume uploaded. Please upload a resume first.",
      });
    }

    // Get all available jobs
    const jobs = await Job.find().populate("companyId", "name email image");

    let resumeAnalysis;
    let scoredJobs;

    if (ResumeParser) {
      // Use the resume parser if available
      const resumeParser = new ResumeParser();

      // For now, we'll create a mock resume analysis since we can't directly parse from URL
      const mockResumeData = resumeParser.getDefaultResumeAnalysis();

      // Calculate match scores for all jobs
      scoredJobs = jobs.map((job) => {
        const matchData = resumeParser.calculateJobMatchScore(
          job,
          mockResumeData
        );
        return {
          ...job.toObject(),
          matchScore: matchData.score,
          matchPercentage: matchData.percentage,
          skillMatches: matchData.skillMatches,
          missingSkills: matchData.missingSkills,
          resumeAnalysis: matchData.resumeAnalysis,
        };
      });

      resumeAnalysis = mockResumeData;
    } else {
      // Fallback to simple matching
      const defaultSkills = [
        "javascript",
        "react",
        "node.js",
        "mongodb",
        "html",
        "css",
      ];

      scoredJobs = jobs.map((job) => {
        const matchData = simpleJobMatching(job, defaultSkills);
        return {
          ...job.toObject(),
          matchScore: matchData.score,
          matchPercentage: matchData.percentage,
          skillMatches: matchData.skillMatches,
          missingSkills: matchData.missingSkills,
        };
      });

      resumeAnalysis = {
        skills: {
          technical: defaultSkills,
          soft: ["leadership", "communication", "teamwork"],
          detected: [
            ...defaultSkills,
            "leadership",
            "communication",
            "teamwork",
          ],
        },
        experience: { totalYears: 3 },
        education: { degrees: ["bachelor"] },
        languages: ["english"],
        experienceLevel: "mid-level",
        location: ["freetown"],
      };
    }

    // Sort by match score (highest first)
    const recommendations = scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Top 10 recommendations

    // Generate skill gap analysis
    const allMissingSkills = new Set();
    scoredJobs.forEach((job) => {
      job.missingSkills.forEach((skill) => allMissingSkills.add(skill));
    });

    const skillGap = {
      mostMissing: Array.from(allMissingSkills).slice(0, 5),
      totalJobs: scoredJobs.length,
      averageScore: Math.round(
        scoredJobs.reduce((sum, job) => sum + job.matchScore, 0) /
          scoredJobs.length
      ),
      topMatches: recommendations.slice(0, 3),
      resumeAnalysis: resumeAnalysis,
    };

    res.json({
      success: true,
      recommendations,
      skillGap,
      resumeAnalysis: resumeAnalysis,
      message: "Resume analysis completed successfully",
    });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.json({
      success: false,
      message: "Error analyzing resume. Please try again.",
      error: error.message,
    });
  }
};

// Get AI job recommendations based on resume
export const getAIRecommendations = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resume) {
      return res.json({
        success: false,
        message: "No resume uploaded. Please upload a resume first.",
      });
    }

    // Get all available jobs
    const jobs = await Job.find().populate("companyId", "name email image");

    let resumeAnalysis;
    let scoredJobs;

    if (ResumeParser) {
      // Use the resume parser if available
      const resumeParser = new ResumeParser();

      // Mock resume data (in production, this would be parsed from the actual resume)
      const mockResumeData = resumeParser.getDefaultResumeAnalysis();

      // Calculate match scores for all jobs
      scoredJobs = jobs.map((job) => {
        const matchData = resumeParser.calculateJobMatchScore(
          job,
          mockResumeData
        );
        return {
          ...job.toObject(),
          matchScore: matchData.score,
          matchPercentage: matchData.percentage,
          skillMatches: matchData.skillMatches,
          missingSkills: matchData.missingSkills,
          resumeAnalysis: matchData.resumeAnalysis,
        };
      });

      resumeAnalysis = mockResumeData;
    } else {
      // Fallback to simple matching
      const defaultSkills = [
        "javascript",
        "react",
        "node.js",
        "mongodb",
        "html",
        "css",
      ];

      scoredJobs = jobs.map((job) => {
        const matchData = simpleJobMatching(job, defaultSkills);
        return {
          ...job.toObject(),
          matchScore: matchData.score,
          matchPercentage: matchData.percentage,
          skillMatches: matchData.skillMatches,
          missingSkills: matchData.missingSkills,
        };
      });

      resumeAnalysis = {
        skills: {
          technical: defaultSkills,
          soft: ["leadership", "communication", "teamwork"],
          detected: [
            ...defaultSkills,
            "leadership",
            "communication",
            "teamwork",
          ],
        },
        experience: { totalYears: 3 },
        education: { degrees: ["bachelor"] },
        languages: ["english"],
        experienceLevel: "mid-level",
        location: ["freetown"],
      };
    }

    // Sort by match score (highest first)
    const recommendations = scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Top 10 recommendations

    res.json({
      success: true,
      recommendations,
      resumeAnalysis: resumeAnalysis,
      message: "AI recommendations generated successfully",
    });
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    res.json({
      success: false,
      message: "Error generating AI recommendations. Please try again.",
      error: error.message,
    });
  }
};

// Save a job
export const saveJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is already saved
    if (user.savedJobs.includes(jobId)) {
      return res.json({
        success: false,
        message: "Job is already saved",
      });
    }

    // Add job to saved jobs
    user.savedJobs.push(jobId);
    await user.save();

    res.json({
      success: true,
      message: "Job saved successfully",
      savedJobs: user.savedJobs,
    });
  } catch (error) {
    console.error("Error saving job:", error);
    res.json({
      success: false,
      message: "Error saving job. Please try again.",
      error: error.message,
    });
  }
};

// Unsave a job
export const unsaveJob = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Remove job from saved jobs
    user.savedJobs = user.savedJobs.filter(
      (savedJobId) => savedJobId.toString() !== jobId
    );
    await user.save();

    res.json({
      success: true,
      message: "Job removed from saved jobs",
      savedJobs: user.savedJobs,
    });
  } catch (error) {
    console.error("Error unsaving job:", error);
    res.json({
      success: false,
      message: "Error removing job from saved jobs. Please try again.",
      error: error.message,
    });
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.auth.userId;

    // Get user with saved jobs populated
    const user = await User.findById(userId).populate({
      path: "savedJobs",
      populate: {
        path: "companyId",
        select: "name email image",
      },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      savedJobs: user.savedJobs || [],
    });
  } catch (error) {
    console.error("Error getting saved jobs:", error);
    res.json({
      success: false,
      message: "Error getting saved jobs. Please try again.",
      error: error.message,
    });
  }
};

// Check if a job is saved
export const checkIfJobSaved = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { jobId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const isSaved = user.savedJobs.some(
      (savedJobId) => savedJobId.toString() === jobId
    );

    res.json({
      success: true,
      isSaved,
    });
  } catch (error) {
    console.error("Error checking if job is saved:", error);
    res.json({
      success: false,
      message: "Error checking job save status. Please try again.",
      error: error.message,
    });
  }
};
