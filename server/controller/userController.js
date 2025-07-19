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

// Import AI job matching service
let AIJobMatching;
try {
  const AIJobMatchingClass = await import("../services/aiJobMatching.js");
  AIJobMatching = AIJobMatchingClass.default;
} catch (error) {
  console.warn("AI job matching not available:", error.message);
  AIJobMatching = null;
}

// Import Advanced job matching service (no OpenAI dependency)
let AdvancedJobMatching;
try {
  const AdvancedJobMatchingClass = await import(
    "../services/advancedJobMatching.js"
  );
  AdvancedJobMatching = AdvancedJobMatchingClass.default;
} catch (error) {
  console.warn("Advanced job matching not available:", error.message);
  AdvancedJobMatching = null;
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
      userId: userId,
      jobId: jobId,
      date: Date.now(),
      status: "pending",
    };

    // Set the appropriate ID based on job type
    if (jobData.companyId) {
      applicationData.companyId = jobData.companyId;
    } else if (jobData.recruiterId) {
      applicationData.recruiterId = jobData.recruiterId;
    }

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
      .populate("recruiterId", "fullName contactPersonName email")
      .populate({
        path: "jobId",
        select:
          "title description location level salary type workType workSetup companyId recruiterId",
        populate: [
          { path: "companyId", select: "name" },
          { path: "recruiterId", select: "fullName contactPersonName" },
        ],
      })
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

// Remove User Resume
export const removeUserResume = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.resume = null;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error removing resume" });
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

    // Try Advanced job matching first (no OpenAI dependency)
    if (AdvancedJobMatching) {
      try {
        const advancedJobMatching = new AdvancedJobMatching();

        // Extract resume text from URL
        let resumeText = "";
        try {
          const response = await fetch(user.resume);
          if (response.ok) {
            const html = await response.text();
            resumeText = html
              .replace(/<script[^>]*>.*?<\/script>/gi, "")
              .replace(/<style[^>]*>.*?<\/style>/gi, "")
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          }
        } catch (error) {
          console.log("Could not fetch resume content, using basic text");
          resumeText = `${user.firstName} ${user.lastName} - ${user.email}`;
        }

        // Analyze resume with advanced algorithms
        resumeAnalysis = advancedJobMatching.analyzeResume(resumeText, {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          location: user.location || "Freetown, Sierra Leone",
        });

        // Get advanced job recommendations
        scoredJobs = await advancedJobMatching.getJobRecommendations(
          jobs,
          resumeAnalysis
        );

        console.log("Advanced job matching completed successfully");
      } catch (advancedError) {
        console.error(
          "Advanced job matching failed, falling back to basic matching:",
          advancedError
        );
        console.error("Detailed error message:", advancedError.message);
        // Fallback to basic matching
        scoredJobs = jobs.map((job) => {
          const matchData = simpleJobMatching(job, []);
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
            technical: [],
            soft: ["leadership", "communication", "teamwork"],
            detected: ["leadership", "communication", "teamwork"],
          },
          experience: { totalYears: 3 },
          education: { degrees: ["bachelor"] },
          languages: ["english"],
          experienceLevel: "mid-level",
          location: ["freetown"],
        };
      }
    } else if (AIJobMatching) {
      try {
        const aiJobMatching = new AIJobMatching();

        // Extract resume text from URL
        const resumeText = await aiJobMatching.extractResumeText(user.resume);

        // Analyze resume with AI
        resumeAnalysis = await aiJobMatching.analyzeResumeWithAI(resumeText, {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          location: user.location || "Freetown, Sierra Leone",
        });

        // Get AI-powered job recommendations
        scoredJobs = await aiJobMatching.getAIRecommendations(
          jobs,
          resumeAnalysis
        );

        console.log("AI job matching completed successfully");
      } catch (aiError) {
        console.error(
          "AI job matching failed, falling back to basic matching:",
          aiError
        );
        console.error("Detailed AI error message:", aiError.message);
        // Fallback to basic matching
        scoredJobs = jobs.map((job) => {
          const matchData = simpleJobMatching(job, []);
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
            technical: [],
            soft: ["leadership", "communication", "teamwork"],
            detected: ["leadership", "communication", "teamwork"],
          },
          experience: { totalYears: 3 },
          education: { degrees: ["bachelor"] },
          languages: ["english"],
          experienceLevel: "mid-level",
          location: ["freetown"],
        };
      }
    } else if (ResumeParser) {
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
      if (job.missingSkills) {
        job.missingSkills.forEach((skill) => allMissingSkills.add(skill));
      }
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

    // Strict resume validation
    if (!user.resume || user.resume.trim() === "") {
      return res.json({
        success: false,
        message:
          "No resume uploaded. Please upload a resume first to get AI job recommendations.",
      });
    }

    // Validate resume URL format
    if (!user.resume.startsWith("http") && !user.resume.startsWith("https")) {
      return res.json({
        success: false,
        message: "Invalid resume format. Please upload a valid resume file.",
      });
    }

    // Get all available jobs
    const jobs = await Job.find({ visible: true }).populate(
      "companyId",
      "name email image"
    );

    if (jobs.length === 0) {
      return res.json({
        success: false,
        message: "No active jobs available at the moment.",
      });
    }

    let resumeAnalysis;
    let scoredJobs;

    // Try Advanced job matching first (no OpenAI dependency)
    if (AdvancedJobMatching) {
      try {
        const advancedJobMatching = new AdvancedJobMatching();

        // Extract resume text from URL with better error handling
        let resumeText = "";
        try {
          const response = await fetch(user.resume, {
            method: "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 10000, // 10 second timeout
          });

          if (response.ok) {
            const html = await response.text();
            // Better text extraction
            resumeText = html
              .replace(/<script[^>]*>.*?<\/script>/gi, "")
              .replace(/<style[^>]*>.*?<\/style>/gi, "")
              .replace(/<[^>]*>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, " ")
              .trim();

            // If extracted text is too short, it might be an image or invalid file
            if (resumeText.length < 50) {
              throw new Error(
                "Resume content too short - likely an image or invalid file"
              );
            }
          } else {
            throw new Error(`Failed to fetch resume: ${response.status}`);
          }
        } catch (error) {
          console.log("Could not fetch resume content:", error.message);
          return res.json({
            success: false,
            message:
              "Unable to read your resume. Please ensure it's a valid text-based document (PDF, DOC, TXT) and try again.",
          });
        }

        // Analyze resume with advanced algorithms
        resumeAnalysis = advancedJobMatching.analyzeResume(resumeText, {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          location: user.location || "Freetown, Sierra Leone",
        });

        // Get advanced job recommendations
        scoredJobs = await advancedJobMatching.getJobRecommendations(
          jobs,
          resumeAnalysis
        );

        console.log("Advanced job matching completed successfully");
      } catch (advancedError) {
        console.error("Advanced job matching failed:", advancedError.message);
        return res.json({
          success: false,
          message:
            "Error analyzing your resume. Please ensure your resume contains clear information about your skills and experience.",
        });
      }
    } else {
      // Fallback to basic matching with Sierra Leone context
      const sierraLeoneSkills = [
        "management",
        "leadership",
        "communication",
        "teamwork",
        "marketing",
        "sales",
        "customer service",
        "administration",
        "teaching",
        "education",
        "healthcare",
        "nursing",
        "agriculture",
        "farming",
        "construction",
        "driving",
        "logistics",
        "transportation",
        "hospitality",
        "tourism",
        "accounting",
        "finance",
        "project management",
        "business development",
      ];

      // Basic resume analysis
      resumeAnalysis = {
        skills: {
          technical: sierraLeoneSkills.slice(0, 5), // Top 5 skills
          soft: ["leadership", "communication", "teamwork"],
          detected: sierraLeoneSkills.slice(0, 8),
        },
        experience: { totalYears: 2 },
        education: { degrees: ["bachelor"] },
        languages: ["english"],
        experienceLevel: "entry-level",
        location: ["freetown"],
      };

      // Basic job matching
      scoredJobs = jobs.map((job) => {
        const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
        const userSkills = resumeAnalysis.skills.detected.map((s) =>
          s.toLowerCase()
        );

        // Calculate basic match score
        const matchingSkills = userSkills.filter((skill) =>
          jobSkills.some(
            (jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill)
          )
        );

        const matchScore =
          (matchingSkills.length / Math.max(jobSkills.length, 1)) * 100;
        const matchPercentage = Math.min(matchScore, 100);

        return {
          ...job.toObject(),
          matchScore: matchScore,
          matchPercentage: matchPercentage,
          skillMatches: matchingSkills,
          missingSkills: jobSkills.filter(
            (skill) =>
              !userSkills.some(
                (userSkill) =>
                  userSkill.includes(skill) || skill.includes(userSkill)
              )
          ),
        };
      });
    }

    // Filter jobs with meaningful matches (at least 20% match)
    const meaningfulMatches = scoredJobs.filter(
      (job) => job.matchPercentage >= 20
    );

    if (meaningfulMatches.length === 0) {
      return res.json({
        success: false,
        message:
          "No suitable job matches found based on your resume. Consider updating your resume with more relevant skills and experience.",
      });
    }

    // Sort by match score (highest first) and limit to top 8 recommendations
    const recommendations = meaningfulMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    // Add match quality labels
    recommendations.forEach((job) => {
      if (job.matchPercentage >= 80) {
        job.matchQuality = "Excellent Match";
      } else if (job.matchPercentage >= 60) {
        job.matchQuality = "Good Match";
      } else if (job.matchPercentage >= 40) {
        job.matchQuality = "Fair Match";
      } else {
        job.matchQuality = "Basic Match";
      }
    });

    res.json({
      success: true,
      recommendations,
      resumeAnalysis: resumeAnalysis,
      totalJobsAnalyzed: jobs.length,
      meaningfulMatches: meaningfulMatches.length,
      message: `Found ${meaningfulMatches.length} suitable job matches based on your resume.`,
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
