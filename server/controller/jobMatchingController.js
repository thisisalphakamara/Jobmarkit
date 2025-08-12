import { matchJobsForUser } from '../services/advancedJobMatching.js';
import User from '../models/User.js';

/**
 * @desc    Get job matches for the authenticated user
 * @route   GET /api/jobs/matches
 * @access  Private
 */
export const getJobMatches = async (req, res) => {
  try {
    // Get user ID from auth middleware (assuming it's set by Clerk)
    const userId = req.auth?.userId || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.'
      });
    }

    // Get limit from query params or use default
    const limit = parseInt(req.query.limit) || 10;
    
    // Get job matches using the AI matching service
    const matchedJobs = await matchJobsForUser(userId, limit);
    
    // Filter out jobs with 0% match
    const relevantMatches = matchedJobs.filter(job => job.matchScore > 0);
    
    res.json({
      success: true,
      count: relevantMatches.length,
      matches: relevantMatches
    });
    
  } catch (error) {
    console.error('Error in getJobMatches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while finding job matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getJobMatches
};
