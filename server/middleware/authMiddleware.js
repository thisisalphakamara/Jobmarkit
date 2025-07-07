import jwt from "jsonwebtoken";
import Company from "../models/Company.js";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Middleware for protecting user routes
export const protectUser = ClerkExpressRequireAuth({});

export const protectCompany = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.json({
      success: false,
      message: "Not authorized",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.company = await Company.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    res.json({
      success: false,
      message: "Not authorized, Login Again",
    });
  }
};

// Middleware for protecting message routes (handles both user and company)
export const protectMessage = async (req, res, next) => {
  try {
    // First try company authentication
    const companyToken = req.headers.token;
    if (companyToken) {
      try {
        const decoded = jwt.verify(companyToken, process.env.JWT_SECRET);
        req.company = await Company.findById(decoded.id).select("-password");
        if (req.company) {
          return next();
        }
      } catch (error) {
        // Company token invalid, continue to user auth
      }
    }

    // Try user authentication (Clerk)
    const userToken = req.headers.authorization;
    if (userToken && userToken.startsWith("Bearer ")) {
      // For now, we'll handle user authentication in the controller
      // This is a simplified approach
      req.user = { _id: "temp_user_id" };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized - No valid authentication found",
    });
  } catch (error) {
    console.error("Message auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
