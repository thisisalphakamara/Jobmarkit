import Job from "../models/Job.js";
import Company from "../models/Company.js";
import Recruiter from "../models/Recruiter.js";
import JobApplication from "../models/JobApplication.js";
import translationService from "../services/translationService.js";

export const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?._id;
    const recruiterId = req.recruiter?._id;

    if (!companyId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Build query based on authentication type
    const query = { _id: id };
    if (companyId) {
      query.companyId = companyId;
    } else if (recruiterId) {
      query.recruiterId = recruiterId;
    }

    const job = await Job.findOne(query);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you don't have permission to view it",
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching job",
      error: error.message,
    });
  }
};

export const editJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, salary, level, category } = req.body;
    const companyId = req.company?._id;
    const recruiterId = req.recruiter?._id;

    if (!companyId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Build query based on authentication type
    const query = { _id: id };
    if (companyId) {
      query.companyId = companyId;
    } else if (recruiterId) {
      query.recruiterId = recruiterId;
    }

    // Find the job and verify ownership
    const job = await Job.findOne(query);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you don't have permission to edit it",
      });
    }

    // Update job fields
    job.title = title;
    job.description = description;
    job.location = location;
    job.salary = salary;
    job.level = level;
    job.category = category;

    await job.save();

    res.json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({
      success: false,
      message: "Error updating job",
      error: error.message,
    });
  }
};

export const getCompanyData = async (req, res) => {
  try {
    // Handle both company and recruiter data
    const companyId = req.company?._id || req.recruiter?._id;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Try to find company first, then recruiter
    let company = await Company.findById(companyId);
    if (!company) {
      company = await Recruiter.findById(companyId);
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company/Recruiter not found",
      });
    }

    res.json({
      success: true,
      company,
    });
  } catch (error) {
    console.error("Error fetching company data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching company data",
      error: error.message,
    });
  }
};

export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company?._id;
    const recruiterId = req.recruiter?._id;

    if (!companyId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    let query = {};
    if (companyId) {
      query.companyId = companyId;
    } else if (recruiterId) {
      // First, find all jobs posted by this recruiter
      const recruiterJobs = await Job.find({ recruiterId }).select("_id");
      const jobIds = recruiterJobs.map((job) => job._id);

      // Then, find all applications for those jobs
      query = { jobId: { $in: jobIds } };
    }

    const applications = await JobApplication.find(query)
      .populate({
        path: "userId",
        model: "User",
        select: "_id firstName lastName email resume image profileImage",
      })
      .populate({
        path: "jobId",
        model: "Job",
        select: "title",
      });

    // Filter out applications with missing userId or jobId after population
    const filteredApplications = applications.filter(
      (app) => app.userId && app.jobId
    );

    // Add full name to each application's user data
    const modifiedApplications = filteredApplications.map((app) => ({
      ...app.toObject(),
      userId: {
        ...app.userId.toObject(),
        name: `${app.userId.firstName} ${app.userId.lastName}`,
        image: app.userId.image || app.userId.profileImage,
      },
    }));

    res.json({
      success: true,
      applications: modifiedApplications,
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching applicants",
      error: error.message,
    });
  }
};

export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company?._id;
    const recruiterId = req.recruiter?._id;

    if (!companyId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Build query based on authentication type
    const query = {};
    if (companyId) {
      query.companyId = companyId;
    } else if (recruiterId) {
      query.recruiterId = recruiterId;
    }

    const jobs = await Job.find(query).populate([
      {
        path: "companyId",
        select: "name image description email",
      },
      {
        path: "recruiterId",
        select: "fullName contactPersonName email",
      },
    ]);

    // Get number of applicants for each job
    const jobsWithApplicants = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await JobApplication.find({ jobId: job._id });
        return {
          ...job.toObject(),
          applicants: applicants.length,
        };
      })
    );

    res.json({
      success: true,
      jobsData: jobsWithApplicants,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

export const ChangeJobApplicationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const jobApplication = await JobApplication.findById(id);
    if (!jobApplication) {
      return res
        .status(404)
        .json({ success: false, message: "Job application not found" });
    }
    jobApplication.status = status;
    await jobApplication.save();
    res
      .status(200)
      .json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changeVisiblity = async (req, res) => {
  try {
    const { id } = req.body;
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    job.visible = !job.visible;
    await job.save();
    res.json({
      success: true,
      message: "Job visibility updated successfully",
    });
  } catch (error) {
    console.error("Error updating job visibility:", error);
    res.status(500).json({
      success: false,
      message: "Error updating job visibility",
      error: error.message,
    });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.company?._id;
    const recruiterId = req.recruiter?._id;

    if (!companyId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Build query based on authentication type
    const query = { _id: id };
    if (companyId) {
      query.companyId = companyId;
    } else if (recruiterId) {
      query.recruiterId = recruiterId;
    }

    const job = await Job.findOne(query);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you don't have permission to delete it",
      });
    }
    await job.deleteOne();
    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting job",
      error: error.message,
    });
  }
};

export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      salary,
      level,
      mainCategory,
      category,
      workType,
      workSetup,
      originalLanguage,
    } = req.body;

    // Handle both company and recruiter authentication
    const companyId = req.company?._id;
    const recruiterId = req.recruiter?._id;

    if (!companyId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Create job with basic data
    const jobData = {
      title,
      description,
      location,
      salary,
      level,
      mainCategory,
      category,
      workType,
      workSetup,
      date: Date.now(),
      originalLanguage: originalLanguage || "en",
    };

    // Set the appropriate ID based on authentication type
    if (companyId) {
      jobData.companyId = companyId;
    } else if (recruiterId) {
      jobData.recruiterId = recruiterId;
    }

    const job = new Job(jobData);

    // Perform translation
    try {
      const translationResult = await translationService.translateJob({
        title,
        description,
        originalLanguage: originalLanguage || "en",
      });

      // Update job with translation data
      Object.assign(job, translationResult);
    } catch (translationError) {
      console.error("Translation error:", translationError);
      // Continue with job posting even if translation fails
    }

    await job.save();

    res.json({
      success: true,
      message: "Job posted successfully with translation",
      job,
    });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({
      success: false,
      message: "Error posting job",
      error: error.message,
    });
  }
};

export const registerCompany = async (req, res) => {
  try {
    const { name, email, password, description, website } = req.body;
    const image = req.files?.image?.[0]?.path;
    const businessLicenseFile = req.files?.businessLicenseFile?.[0]?.path;

    const company = new Company({
      name,
      email,
      password,
      description,
      website,
      image,
      businessLicenseFile,
    });

    await company.save();

    res.json({
      success: true,
      message: "Company registered successfully",
      company,
    });
  } catch (error) {
    console.error("Error registering company:", error);
    res.status(500).json({
      success: false,
      message: "Error registering company",
      error: error.message,
    });
  }
};

export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }
    const token = company.generateToken();
    res.json({
      success: true,
      message: "Login successful",
      token,
      company,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};
