import jwt from "jsonwebtoken";
import Company from "../models/Company.js";
import Recruiter from "../models/Recruiter.js";

export const verifyCompanyToken = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const company = await Company.findById(decoded.id).select("-password");

    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.company = company;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// General auth middleware for recruiters
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const recruiter = await Recruiter.findById(decoded.id).select("-password");

    if (!recruiter) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Check if account is active
    if (!recruiter.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    req.recruiter = recruiter;
    next();
  } catch (error) {
    console.error("Recruiter auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Admin middleware (for admin-only routes)
export const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin (you can implement your own admin logic)
    // For now, we'll check if the user has admin role or is a government recruiter
    const recruiter = await Recruiter.findById(decoded.id).select("-password");

    if (!recruiter) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Check if recruiter is government type (admin privileges)
    if (recruiter.recruiterType !== "Government") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.admin = recruiter;
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};
