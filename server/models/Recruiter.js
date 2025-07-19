import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const recruiterSchema = new mongoose.Schema(
  {
    // Basic recruiter information
    recruiterType: {
      type: String,
      enum: ["Company", "NGO", "Individual", "Government"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    logo: {
      type: String, // URL to uploaded logo
    },
    businessLicenseFile: {
      type: String, // URL to uploaded business license file
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [
      {
        documentType: String,
        documentUrl: String,
        uploadedAt: Date,
        verifiedAt: Date,
        verifiedBy: String,
      },
    ],

    // Company/NGO specific fields
    organizationName: {
      type: String,
      required: function () {
        return ["Company", "NGO"].includes(this.recruiterType);
      },
    },
    contactPersonName: {
      type: String,
      required: function () {
        return ["NGO", "Government"].includes(this.recruiterType);
      },
    },
    businessRegistrationNumber: {
      type: String,
      required: function () {
        return ["NGO"].includes(this.recruiterType);
      },
    },
    officeAddress: {
      type: String,
      required: function () {
        return ["Company", "NGO"].includes(this.recruiterType);
      },
    },
    website: {
      type: String,
    },
    industry: {
      type: String,
    },
    organizationSize: {
      type: String,
    },
    foundedYear: {
      type: Number,
    },

    // Individual specific fields
    fullName: {
      type: String,
      required: function () {
        return this.recruiterType === "Individual";
      },
    },

    // Government specific fields
    ministryDepartmentAgency: {
      type: String,
      required: function () {
        return this.recruiterType === "Government";
      },
    },
    designation: {
      type: String,
      required: function () {
        return this.recruiterType === "Government";
      },
    },
    authorizationLetterNumber: {
      type: String,
      required: function () {
        return this.recruiterType === "Government";
      },
    },

    // Verification and status
    verificationStatus: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Rejected"],
      default: "Pending",
    },
    verificationNotes: {
      type: String,
    },
    verifiedBy: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for initials (used when no logo is uploaded)
recruiterSchema.virtual("initials").get(function () {
  if (this.recruiterType === "Individual" && this.fullName) {
    return this.fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase();
  } else if (
    ["Company", "NGO"].includes(this.recruiterType) &&
    this.organizationName
  ) {
    return this.organizationName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  } else if (
    this.recruiterType === "Government" &&
    this.ministryDepartmentAgency
  ) {
    return this.ministryDepartmentAgency
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }
  return "R"; // Default
});

// Virtual for display name
recruiterSchema.virtual("displayName").get(function () {
  if (this.recruiterType === "Individual") {
    return this.fullName;
  } else if (["Company", "NGO"].includes(this.recruiterType)) {
    return this.organizationName;
  } else if (this.recruiterType === "Government") {
    return this.ministryDepartmentAgency;
  }
  return "Unknown";
});

// Hash password before saving
recruiterSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
recruiterSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate JWT token method
recruiterSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      recruiterType: this.recruiterType,
      isVerified: this.isVerified,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Method to check if account is locked
recruiterSchema.methods.isLocked = function () {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

// Method to increment login attempts
recruiterSchema.methods.incrementLoginAttempts = function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    // Lock account for 30 minutes
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  return this.save();
};

// Method to reset login attempts
recruiterSchema.methods.resetLoginAttempts = function () {
  this.loginAttempts = 0;
  this.lockedUntil = null;
  this.lastLoginAt = new Date();
  return this.save();
};

// Index for better query performance
recruiterSchema.index({ email: 1 });
recruiterSchema.index({ recruiterType: 1 });
recruiterSchema.index({ verificationStatus: 1 });
recruiterSchema.index({ isActive: 1 });

const Recruiter = mongoose.model("Recruiter", recruiterSchema);
export default Recruiter;
