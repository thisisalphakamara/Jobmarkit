import Recruiter from "../models/Recruiter.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import sendMail from "../utils/sendMail.js";
import jwt from "jsonwebtoken";

// Generate verification codes
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification codes temporarily (in production, use Redis)
const verificationCodes = new Map();

// Store password reset codes temporarily (in production, use Redis)
const passwordResetCodes = new Map();

// Register new recruiter
export const registerRecruiter = async (req, res) => {
  try {
    const {
      recruiterType,
      email,
      password,
      phone,
      // Company/NGO fields
      organizationName,
      contactPersonName,
      businessRegistrationNumber,
      officeAddress,
      website,
      industry,
      organizationSize,
      foundedYear,
      // Individual fields
      fullName,
      // Government fields
      ministryDepartmentAgency,
      designation,
      authorizationLetterNumber,
    } = req.body;

    // Check if email already exists
    const existingRecruiter = await Recruiter.findOne({ email });
    if (existingRecruiter) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Validate email domain based on recruiter type
    if (recruiterType === "Government") {
      if (!email.includes("@gov.sl")) {
        return res.status(400).json({
          success: false,
          message:
            "Government recruiters must use official government email (@gov.sl)",
        });
      }
    }

    // Create recruiter object based on type
    const recruiterData = {
      recruiterType,
      email,
      password,
      phone,
    };

    // Add type-specific fields
    if (["Company", "NGO"].includes(recruiterType)) {
      recruiterData.organizationName = organizationName;
      recruiterData.contactPersonName = contactPersonName;
      recruiterData.businessRegistrationNumber = businessRegistrationNumber;
      recruiterData.officeAddress = officeAddress;
      recruiterData.website = website;
      recruiterData.industry = industry;
      recruiterData.organizationSize = organizationSize;
      recruiterData.foundedYear = foundedYear;
    } else if (recruiterType === "Individual") {
      recruiterData.fullName = fullName;
    } else if (recruiterType === "Government") {
      recruiterData.ministryDepartmentAgency = ministryDepartmentAgency;
      recruiterData.contactPersonName = contactPersonName;
      recruiterData.designation = designation;
      recruiterData.authorizationLetterNumber = authorizationLetterNumber;
    }

    // Handle logo upload if provided
    if (req.files?.logo) {
      try {
        const result = await uploadToCloudinary(
          req.files.logo[0].path,
          "recruiter-logos"
        );
        recruiterData.logo = result.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload logo",
        });
      }
    }

    // Handle business license file upload if provided
    if (req.files?.businessLicenseFile) {
      try {
        const result = await uploadToCloudinary(
          req.files.businessLicenseFile[0].path,
          "business-licenses"
        );
        recruiterData.businessLicenseFile = result.secure_url;
      } catch (uploadError) {
        console.error("Business license upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload business license file",
        });
      }
    }

    // Generate verification code
    const emailCode = generateVerificationCode();

    // Store recruiter data and verification code temporarily
    const tempRecruiterId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    verificationCodes.set(tempRecruiterId, {
      emailCode,
      recruiterData: recruiterData, // Store the recruiter data
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    console.log("Debug - Registration completed:", {
      tempRecruiterId,
      emailCode,
      storedCodes: verificationCodes.get(tempRecruiterId),
    });

    // Send verification email
    try {
      await sendMail(
        email,
        "Email Verification - Jobmarkit Sierra Leone",
        `Your email verification code is: ${emailCode}\n\nThis code will expire in 10 minutes.`
      );
    } catch (emailError) {
      console.error("Email sending error:", emailError);
    }

    res.status(201).json({
      success: true,
      message: "Please verify your email to complete registration.",
      recruiter: {
        id: tempRecruiterId, // Return temp ID for verification
        recruiterType: recruiterData.recruiterType,
        email: recruiterData.email,
        displayName: recruiterData.displayName,
        initials: recruiterData.initials,
      },
    });
  } catch (error) {
    console.error("Recruiter registration error:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Request files:", req.files);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message, // Temporarily include for debugging
      errorName: error.name,
    });
  }
};

// Login recruiter
export const loginRecruiter = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find recruiter
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (recruiter.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    // Check if account is active
    if (!recruiter.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await recruiter.comparePassword(password);
    if (!isPasswordValid) {
      await recruiter.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset login attempts on successful login
    await recruiter.resetLoginAttempts();

    // Generate token
    const token = recruiter.generateToken();

    res.json({
      success: true,
      message: "Login successful",
      token,
      recruiter: {
        id: recruiter._id,
        recruiterType: recruiter.recruiterType,
        email: recruiter.email,
        displayName: recruiter.displayName,
        initials: recruiter.initials,
        logo: recruiter.logo,
        isVerified: recruiter.isVerified,
        verificationStatus: recruiter.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Recruiter login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { recruiterId, code } = req.body;

    console.log("Debug - Email verification attempt:", {
      recruiterId,
      code,
      storedCodes: verificationCodes.get(recruiterId),
      currentTime: Date.now(),
    });

    const storedCodes = verificationCodes.get(recruiterId);
    if (!storedCodes || Date.now() > storedCodes.expiresAt) {
      console.log("Debug - Verification failed:", {
        hasStoredCodes: !!storedCodes,
        isExpired: storedCodes ? Date.now() > storedCodes.expiresAt : true,
        expiresAt: storedCodes?.expiresAt,
      });
      return res.status(400).json({
        success: false,
        message: "Verification code expired or invalid",
      });
    }

    if (storedCodes.emailCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Create the actual recruiter record in database
    const recruiterData = storedCodes.recruiterData;
    const recruiter = new Recruiter(recruiterData);
    recruiter.isEmailVerified = true; // Mark as email verified
    await recruiter.save();

    // Remove the temporary data
    verificationCodes.delete(recruiterId);

    // Generate JWT token for immediate login
    const token = recruiter.generateToken();

    res.json({
      success: true,
      message: "Email verified successfully. Account created.",
      token,
      recruiter: {
        id: recruiter._id,
        recruiterType: recruiter.recruiterType,
        email: recruiter.email,
        displayName: recruiter.displayName,
        initials: recruiter.initials,
        logo: recruiter.logo,
        isEmailVerified: recruiter.isEmailVerified,
        isVerified: recruiter.isVerified,
        verificationStatus: recruiter.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};

// Resend verification code
export const resendVerificationCode = async (req, res) => {
  try {
    const { recruiterId, type } = req.body; // type: 'email' only

    const storedCodes = verificationCodes.get(recruiterId);
    if (!storedCodes) {
      return res.status(404).json({
        success: false,
        message: "Verification session not found",
      });
    }

    const code = generateVerificationCode();

    if (type === "email") {
      storedCodes.emailCode = code;
      storedCodes.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      verificationCodes.set(recruiterId, storedCodes);

      await sendMail(
        storedCodes.recruiterData.email,
        "Email Verification Code - Jobmarkit Sierra Leone",
        `Your new email verification code is: ${code}\n\nThis code will expire in 10 minutes.`
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Only email verification is supported",
      });
    }

    res.json({
      success: true,
      message: "New email verification code sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification code. Please try again.",
    });
  }
};

// Request recruiter password reset (send code to email)
export const requestRecruiterPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res
        .status(404)
        .json({ success: false, message: "Recruiter not found" });
    }
    const code = generateVerificationCode();
    passwordResetCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    await sendMail(
      email,
      "Jobmarkit Recruiter Password Reset",
      `Your password reset code is: ${code}\n\nThis code will expire in 10 minutes.`
    );
    res.json({
      success: true,
      message: "Password reset code sent to your email.",
    });
  } catch (error) {
    console.error("Recruiter password reset request error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send password reset code." });
  }
};

// Reset recruiter password (verify code and set new password)
export const resetRecruiterPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const entry = passwordResetCodes.get(email);
    if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset code." });
    }
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res
        .status(404)
        .json({ success: false, message: "Recruiter not found" });
    }
    recruiter.password = newPassword;
    await recruiter.save();
    passwordResetCodes.delete(email);
    res.json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Recruiter password reset error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password." });
  }
};

// Get recruiter profile
export const getRecruiterProfile = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.recruiter.id);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    res.json({
      success: true,
      recruiter: {
        id: recruiter._id,
        recruiterType: recruiter.recruiterType,
        email: recruiter.email,
        phone: recruiter.phone,
        displayName: recruiter.displayName,
        initials: recruiter.initials,
        logo: recruiter.logo,
        isEmailVerified: recruiter.isEmailVerified,
        isPhoneVerified: recruiter.isPhoneVerified,
        isVerified: recruiter.isVerified,
        verificationStatus: recruiter.verificationStatus,
        // Type-specific fields
        ...(recruiter.recruiterType === "Individual" && {
          fullName: recruiter.fullName,
        }),
        ...(["Company", "NGO"].includes(recruiter.recruiterType) && {
          organizationName: recruiter.organizationName,
          contactPersonName: recruiter.contactPersonName,
          businessRegistrationNumber: recruiter.businessRegistrationNumber,
          officeAddress: recruiter.officeAddress,
          website: recruiter.website,
          industry: recruiter.industry,
          organizationSize: recruiter.organizationSize,
          foundedYear: recruiter.foundedYear,
        }),
        ...(recruiter.recruiterType === "Government" && {
          ministryDepartmentAgency: recruiter.ministryDepartmentAgency,
          contactPersonName: recruiter.contactPersonName,
          designation: recruiter.designation,
          authorizationLetterNumber: recruiter.authorizationLetterNumber,
        }),
      },
    });
  } catch (error) {
    console.error("Get recruiter profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile. Please try again.",
    });
  }
};

// Update recruiter profile
export const updateRecruiterProfile = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.recruiter.id);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    // Handle logo upload if provided
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file.path,
          "recruiter-logos"
        );
        recruiter.logo = result.secure_url;
      } catch (uploadError) {
        console.error("Logo upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload logo",
        });
      }
    }

    // Update allowed fields
    // Allow updating all relevant fields based on recruiterType
    const allowedFields = [
      "phone",
      "website",
      "industry",
      "organizationSize",
      "officeAddress",
      "fullName",
      "contactPersonName",
      "organizationName",
      "businessRegistrationNumber",
      "foundedYear",
      "ministryDepartmentAgency",
      "designation",
      "authorizationLetterNumber",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        recruiter[field] = req.body[field];
      }
    });

    await recruiter.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      recruiter,
    });
  } catch (error) {
    console.error("Update recruiter profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile. Please try again.",
    });
  }
};

// Admin: Get all recruiters (for verification)
export const getAllRecruiters = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    const filter = {};
    if (status) filter.verificationStatus = status;
    if (type) filter.recruiterType = type;

    const recruiters = await Recruiter.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Recruiter.countDocuments(filter);

    res.json({
      success: true,
      recruiters,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get all recruiters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recruiters. Please try again.",
    });
  }
};

// Admin: Update verification status
export const updateVerificationStatus = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const { status, notes, rejectionReason } = req.body;

    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    recruiter.verificationStatus = status;
    recruiter.verificationNotes = notes;
    recruiter.verifiedBy = req.admin.id; // Assuming admin middleware
    recruiter.verifiedAt = new Date();

    if (status === "Approved") {
      recruiter.isVerified = true;
    } else if (status === "Rejected") {
      recruiter.rejectionReason = rejectionReason;
    }

    await recruiter.save();

    // Send notification email
    try {
      const subject =
        status === "Approved"
          ? "Account Verified - Jobmarkit Sierra Leone"
          : "Account Verification Update - Jobmarkit Sierra Leone";

      const message =
        status === "Approved"
          ? "Your account has been verified. You can now post job listings."
          : `Your account verification status has been updated to: ${status}. ${
              rejectionReason ? `Reason: ${rejectionReason}` : ""
            }`;

      await sendMail(recruiter.email, subject, message);
    } catch (emailError) {
      console.error("Notification email error:", emailError);
    }

    res.json({
      success: true,
      message: "Verification status updated successfully",
    });
  } catch (error) {
    console.error("Update verification status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update verification status. Please try again.",
    });
  }
};

// Delete recruiter account
export const deleteRecruiterAccount = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.recruiter.id);
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    // Delete the recruiter
    await Recruiter.findByIdAndDelete(req.recruiter.id);

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete recruiter account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account. Please try again.",
    });
  }
};
