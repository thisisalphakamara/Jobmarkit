import natural from 'natural';
import User from '../models/User.js';
import Job from '../models/Job.js';
import { Types } from 'mongoose';

// Initialize tokenizers and stemmers
const { WordTokenizer } = natural;
const tokenizer = new WordTokenizer();
const { PorterStemmer } = natural;

/**
 * Preprocess text by tokenizing, removing stop words, and stemming
 */
const preprocessText = (text) => {
  if (!text) return [];
  
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at']);
  
  return tokens
    .filter(token => token.length > 2 && !stopWords.has(token)) // Remove short tokens and stop words
    .map(token => PorterStemmer.stem(token)); // Apply stemming
};

/**
 * Calculate TF-IDF score for a term in a document
 */
const calculateTfIdf = (term, document, documents) => {
  // Term Frequency (TF)
  const termCount = document.filter(t => t === term).length;
  const tf = termCount / document.length;
  
  // Inverse Document Frequency (IDF)
  const docCount = documents.filter(doc => doc.includes(term)).length;
  const idf = Math.log(documents.length / (1 + docCount)) + 1; // Add 1 to avoid division by zero
  
  return tf * idf;
};

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Match jobs to a user's profile using AI/ML techniques
 * @param {string} userId - ID of the user to match jobs for
 * @param {number} limit - Maximum number of jobs to return
 * @returns {Promise<Array>} - Array of matched jobs with similarity scores
 */
export const matchJobsForUser = async (userId, limit = 10) => {
  try {
    // Get user profile
    const user = await User.findById(userId)
      .select('skills experience education preferredJobTitles preferredJobTypes')
      .lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get all active jobs
    const jobs = await Job.find({ visible: true })
      .populate('companyId', 'name')
      .lean();
    
    if (jobs.length === 0) {
      return [];
    }

    // Prepare user profile text
    const userProfileText = [
      ...(user.skills || []),
      ...(user.experience?.map(exp => `${exp.title} ${exp.company} ${exp.description}`) || []),
      ...(user.education?.map(edu => `${edu.degree} ${edu.field} ${edu.school}`) || []),
      ...(user.preferredJobTitles || []),
      ...(user.preferredJobTypes || [])
    ].join(' ').toLowerCase();

    // Preprocess user profile and job descriptions
    const userTokens = preprocessText(userProfileText);
    const jobDocuments = jobs.map(job => ({
      ...job,
      tokens: preprocessText(`${job.title} ${job.description} ${job.requirements} ${job.skills?.join(' ')}`)
    }));

    // Get all unique terms across all documents
    const allTerms = [...new Set([
      ...userTokens,
      ...jobDocuments.flatMap(job => job.tokens)
    ])];

    // Create TF-IDF vectors
    const userVector = allTerms.map(term => 
      calculateTfIdf(term, userTokens, [userTokens, ...jobDocuments.map(j => j.tokens)])
    );

    // Calculate similarity scores for each job
    const jobsWithScores = jobDocuments.map(job => {
      const jobVector = allTerms.map(term => 
        calculateTfIdf(term, job.tokens, [userTokens, ...jobDocuments.map(j => j.tokens)])
      );
      
      const score = cosineSimilarity(userVector, jobVector);
      
      return {
        ...job,
        matchScore: parseFloat((score * 100).toFixed(2)) // Convert to percentage
      };
    });

    // Sort jobs by match score (descending) and limit results
    return jobsWithScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error in matchJobsForUser:', error);
    throw error;
  }
};

export default {
  matchJobsForUser
};