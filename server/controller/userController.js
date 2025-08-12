import e from "express";
import User from "../models/User.js";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";
import { v2 } from "cloudinary";
import { users } from "@clerk/clerk-sdk-node";

// Import resume parser with dynamic import
let ResumeParser;
try {
  // Use dynamic import for ES modules
  const module = await import('../services/resumeParser.js');
  ResumeParser = module.default;
  
  // Simple test to verify the import
  console.log('ResumeParser loaded:', typeof ResumeParser === 'function' ? 'Success' : 'Failed');
} catch (error) {
  console.error('Error loading ResumeParser:', error);
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

    // Note: If there's no resume or invalid URL, we will still return
    // a majority of available jobs instead of erroring out (per request).

    console.log("Starting AI recommendations for user:", userId);
    console.log("Resume URL:", user.resume);

    // IMPROVED: Get all available jobs with better population
    const jobs = await Job.find({ visible: true })
      .populate("companyId", "name email image")
      .populate("recruiterId", "fullName contactPersonName displayName");

    console.log(`Found ${jobs.length} active jobs to analyze`);

    // Helper: build a majority-of-jobs fallback list
    const buildMajorityFallback = () => {
      const majorityCount = Math.max(6, Math.ceil(jobs.length * 0.6));
      // Sort by createdAt desc if available
      const sorted = [...jobs].sort((a, b) => {
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      });
      const picked = sorted.slice(0, majorityCount).map((job) => ({
        ...(typeof job.toObject === 'function' ? job.toObject() : job),
        matchScore: 50,
        matchPercentage: 50,
        matchQuality: 'Basic Match',
        skillMatches: [],
        missingSkills: [],
      }));
      return picked;
    };

    if (jobs.length === 0) {
      return res.json({
        success: false,
        message: "No active jobs available at the moment.",
      });
    }

    let resumeAnalysis;
    let scoredJobs;

    // IMPROVED: Try Advanced job matching first (no OpenAI dependency)
    if (AdvancedJobMatching) {
      try {
        console.log("Using Advanced Job Matching service");
        const resumeParser = new ResumeParser();

        // IMPROVED: Use the enhanced resume parser for better text extraction
        let resumeText = "";
        try {
          console.log("Using enhanced resume parser for:", user.resume);

          // Use the improved resume parser
          const parsedResume = await resumeParser.parseResumeFromUrl(
            user.resume
          );

          console.log("Resume parsing result:", {
            hasSkills: !!parsedResume.skills,
            skillsCount: parsedResume.skills?.detected?.length || 0,
            hasExperience: !!parsedResume.experience,
            confidence: parsedResume.confidence,
          });

          // If parsing was successful, use the extracted text
          if (
            parsedResume &&
            parsedResume.confidence &&
            parsedResume.confidence > 30
          ) {
            // Reconstruct text from parsed data for better analysis
            resumeText = reconstructTextFromParsedResume(parsedResume);
            console.log(
              `Resume parsed successfully with confidence: ${parsedResume.confidence}%`
            );
            console.log(
              `Reconstructed text length: ${resumeText.length} characters`
            );
          } else {
            // Fallback to direct text extraction
            console.log("Fallback to direct text extraction");
            resumeText = await extractResumeTextDirectly(user.resume);
          }

          // IMPROVED: Validate extracted text quality
          if (resumeText.length < 100) {
            throw new Error(
              "Resume content too short - likely an image or invalid file"
            );
          }

          // IMPROVED: Check if text contains meaningful content
          const meaningfulWords = resumeText
            .split(/\s+/)
            .filter((word) => word.length > 2).length;
          if (meaningfulWords < 20) {
            throw new Error("Resume content lacks meaningful text");
          }

          console.log(
            `Successfully extracted ${resumeText.length} characters with ${meaningfulWords} meaningful words`
          );
        } catch (error) {
          console.error("Resume extraction error:", error.message);
          return res.json({
            success: false,
            message: `Unable to read your resume: ${error.message}. Please ensure it's a valid text-based document (PDF, DOC, TXT) and try again. If the problem persists, try re-uploading your resume.`,
          });
        }

        // IMPROVED: Use the matchJobsForUser function directly
        console.log("Starting job matching with user profile");
        
        // Get job matches for the user
        const matchedJobs = await AdvancedJobMatching.matchJobsForUser(userId, 10);
        
        // Format the results to match the expected structure
        scoredJobs = matchedJobs.map(job => ({
          ...job,
          matchPercentage: job.matchScore, // Use matchScore as percentage
          skillMatches: [], // This would need to be populated if available
          missingSkills: [], // This would need to be populated if available
          resumeAnalysis: {
            skills: {
              detected: job.skills || []
            },
            experienceLevel: job.experienceLevel || 'Not specified',
            confidence: {
              overall: job.matchScore / 100 // Convert to 0-1 range
            }
          }
        }));
        
        console.log("Job matching completed successfully");
        console.log(
          `Found ${scoredJobs.length} matching jobs out of ${jobs.length} total jobs`
        );
        
        // Set a simple resume analysis
        resumeAnalysis = {
          skills: {
            detected: user.skills || []
          },
          experienceLevel: 'Not specified',
          confidence: {
            overall: 0.8
          }
        };
      } catch (advancedError) {
        console.error("Advanced job matching failed:", advancedError);
        console.error("Error stack:", advancedError.stack);
        // Fallback: return majority of available jobs instead of an error
        const recommendations = buildMajorityFallback();
        return res.json({
          success: true,
          message: `Showing ${recommendations.length} jobs due to AI matching issue.`,
          recommendations,
          resumeAnalysis: {
            skills: { detected: [] },
            experienceLevel: 'Not specified',
            confidence: { overall: 0 }
          },
          totalJobsAnalyzed: jobs.length,
        });
      }
    } else {
      console.log("Advanced Job Matching not available, using fallback");
      // IMPROVED: Fallback to basic matching with Sierra Leone context
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
        "javascript",
        "python",
        "react",
        "node.js",
        "mongodb",
        "sql",
        "html",
        "css",
        "git",
        "aws",
        "docker",
        "agile",
        "scrum",
      ];

      // IMPROVED: Basic resume analysis with better defaults
      resumeAnalysis = {
        skills: {
          technical: sierraLeoneSkills.slice(0, 8), // More skills
          soft: ["leadership", "communication", "teamwork", "problem solving"],
          detected: sierraLeoneSkills.slice(0, 12),
        },
        experience: { totalYears: 3, level: "mid-level" },
        education: { degrees: ["bachelor"], institutions: ["university"] },
        languages: ["english", "krio"],
        experienceLevel: "mid-level",
        location: ["freetown", "sierra leone"],
        confidence: { overall: 60 },
      };

      // IMPROVED: Basic job matching with better scoring
      scoredJobs = jobs.map((job) => {
        const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
        const userSkills = resumeAnalysis.skills.detected.map((s) =>
          s.toLowerCase()
        );

        // IMPROVED: Calculate basic match score with better logic
        const matchingSkills = userSkills.filter((skill) =>
          jobSkills.some(
            (jobSkill) => jobSkill.includes(skill) || skill.includes(jobSkill)
          )
        );

        // IMPROVED: Better scoring algorithm
        let matchScore = 0;
        if (jobSkills.length > 0) {
          matchScore = (matchingSkills.length / jobSkills.length) * 100;
        }

        // IMPROVED: Add bonus for experience level match
        const jobLevel = job.level?.toLowerCase() || "mid-level";
        if (jobLevel === resumeAnalysis.experienceLevel) {
          matchScore += 20;
        }

        // IMPROVED: Add bonus for location match
        const jobLocation = job.location?.town?.toLowerCase() || "";
        if (
          jobLocation.includes("freetown") ||
          jobLocation.includes("sierra leone")
        ) {
          matchScore += 10;
        }

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

    // IMPROVED: Filter jobs with meaningful matches (increased threshold to 30%)
    const meaningfulMatches = scoredJobs.filter(
      (job) => job.matchPercentage >= 30
    );

    console.log(
      `Filtered to ${meaningfulMatches.length} meaningful matches (30%+ threshold)`
    );

    if (meaningfulMatches.length === 0) {
      // Fallback: show majority of available jobs
      const recommendations = buildMajorityFallback();
      return res.json({
        success: true,
        message: `Showing ${recommendations.length} jobs due to low match confidence.`,
        recommendations,
        resumeAnalysis,
        totalJobsAnalyzed: jobs.length,
      });
    }

    // IMPROVED: Sort by match score (highest first) and limit to top 6 recommendations
    const recommendations = meaningfulMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    // IMPROVED: Add match quality labels with better thresholds
    recommendations.forEach((job) => {
      if (job.matchPercentage >= 85) {
        job.matchQuality = "Perfect Match";
      } else if (job.matchPercentage >= 75) {
        job.matchQuality = "Excellent Match";
      } else if (job.matchPercentage >= 65) {
        job.matchQuality = "Very Good Match";
      } else if (job.matchPercentage >= 55) {
        job.matchQuality = "Good Match";
      } else if (job.matchPercentage >= 45) {
        job.matchQuality = "Fair Match";
      } else {
        job.matchQuality = "Basic Match";
      }
    });

    console.log("AI recommendations completed successfully");

    return res.json({
      success: true,
      message: `Found ${recommendations.length} matching jobs based on your resume!`,
      recommendations,
      resumeAnalysis,
      totalJobsAnalyzed: jobs.length,
      matchQuality: {
        perfect: recommendations.filter((j) => j.matchPercentage >= 85).length,
        excellent: recommendations.filter(
          (j) => j.matchPercentage >= 75 && j.matchPercentage < 85
        ).length,
        good: recommendations.filter(
          (j) => j.matchPercentage >= 55 && j.matchPercentage < 75
        ).length,
        fair: recommendations.filter(
          (j) => j.matchPercentage >= 30 && j.matchPercentage < 55
        ).length,
      },
    });
  } catch (error) {
    console.error("Error in getAIRecommendations:", error);
    console.error("Error stack:", error.stack);
    return res.json({
      success: false,
      message: `An error occurred while generating AI recommendations: ${error.message}. Please try again.`,
    });
  }
};

// NEW: Helper function to reconstruct text from parsed resume data
const reconstructTextFromParsedResume = (parsedResume) => {
  const sections = [];

  // Add skills
  if (parsedResume.skills && parsedResume.skills.detected) {
    sections.push(`Skills: ${parsedResume.skills.detected.join(", ")}`);
  }

  // Add experience
  if (parsedResume.experience) {
    if (parsedResume.experience.totalYears) {
      sections.push(`Experience: ${parsedResume.experience.totalYears} years`);
    }
    if (
      parsedResume.experience.years &&
      parsedResume.experience.years.length > 0
    ) {
      sections.push(
        `Experience details: ${parsedResume.experience.years.join(", ")}`
      );
    }
  }

  // Add education
  if (parsedResume.education) {
    if (
      parsedResume.education.degrees &&
      parsedResume.education.degrees.length > 0
    ) {
      sections.push(`Education: ${parsedResume.education.degrees.join(", ")}`);
    }
    if (
      parsedResume.education.institutions &&
      parsedResume.education.institutions.length > 0
    ) {
      sections.push(
        `Institutions: ${parsedResume.education.institutions.join(", ")}`
      );
    }
  }

  // Add languages
  if (parsedResume.languages && parsedResume.languages.length > 0) {
    sections.push(`Languages: ${parsedResume.languages.join(", ")}`);
  }

  // Add certifications
  if (parsedResume.certifications && parsedResume.certifications.length > 0) {
    sections.push(`Certifications: ${parsedResume.certifications.join(", ")}`);
  }

  // Add location
  if (parsedResume.location && parsedResume.location.length > 0) {
    sections.push(`Location: ${parsedResume.location.join(", ")}`);
  }

  return sections.join(". ");
};

// NEW: Helper function for direct text extraction as fallback
const extractResumeTextDirectly = async (url) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch resume: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("text/html")) {
      const html = await response.text();
      return html
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/<style[^>]*>.*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error("Error in direct text extraction:", error);
    throw error;
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

// Test endpoint for debugging resume parsing
export const testResumeParsing = async (req, res) => {
  try {
    const { resumeUrl } = req.body;

    if (!resumeUrl) {
      return res.json({
        success: false,
        message: "Resume URL is required",
      });
    }

    console.log("Testing resume parsing for URL:", resumeUrl);

    if (ResumeParser) {
      const resumeParser = new ResumeParser();
      const result = await resumeParser.parseResumeFromUrl(resumeUrl);

      return res.json({
        success: true,
        result,
        message: "Resume parsing test completed",
      });
    } else {
      return res.json({
        success: false,
        message: "Resume parser not available",
      });
    }
  } catch (error) {
    console.error("Resume parsing test error:", error);
    return res.json({
      success: false,
      message: `Resume parsing test failed: ${error.message}`,
      error: error.stack,
    });
  }
};
