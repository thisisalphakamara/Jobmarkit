import jwt from "jsonwebtoken";
import Company from "../models/Company.js";

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
