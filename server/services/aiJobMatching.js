import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

class AIJobMatching {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseUrl = "https://api.openai.com/v1";
  }

  // Enhanced resume analysis using OpenAI
  async analyzeResumeWithAI(resumeText, userData = {}) {
    try {
      if (!this.openaiApiKey) {
        console.error(
          "OpenAI API key is missing. Please check your .env file."
        );
        throw new Error(
          "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file"
        );
      }

      if (this.openaiApiKey === "your_openai_api_key_here") {
        console.error(
          "OpenAI API key is not set properly. Please replace the placeholder with your actual API key."
        );
        throw new Error(
          "OpenAI API key is not set. Please update your .env file with your actual API key"
        );
      }

      const prompt = `
Analyze this resume and extract detailed information in JSON format:

RESUME TEXT:
${resumeText}

USER DATA:
${JSON.stringify(userData, null, 2)}

Please provide a comprehensive analysis in the following JSON structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"],
    "languages": ["array of languages"],
    "certifications": ["array of certifications"]
  },
  "experience": {
    "totalYears": number,
    "level": "entry level|junior|mid-level|senior|executive",
    "positions": [
      {
        "title": "string",
        "company": "string",
        "duration": "string",
        "responsibilities": ["array of responsibilities"]
      }
    ]
  },
  "education": {
    "degrees": ["array of degrees"],
    "institutions": ["array of institutions"],
    "graduationYears": ["array of years"]
  },
  "summary": "brief professional summary",
  "strengths": ["array of key strengths"],
  "careerGoals": ["array of career objectives"]
}

Focus on Sierra Leone context and local job market relevance. Be specific and detailed in the analysis.
`;

      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert resume analyzer specializing in the Sierra Leone job market. Provide detailed, accurate analysis in JSON format only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const analysis = JSON.parse(response.data.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error("OpenAI resume analysis error:", error);
      if (error.response) {
        console.error("OpenAI API response error:", error.response.data);
        throw new Error(
          `OpenAI API error: ${
            error.response.data.error?.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        console.error("Network error:", error.message);
        throw new Error(
          "Network error: Unable to connect to OpenAI API. Please check your internet connection."
        );
      } else {
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
  }

  // Enhanced job matching using OpenAI
  async matchJobWithAI(job, resumeAnalysis) {
    try {
      if (!this.openaiApiKey) {
        console.error(
          "OpenAI API key is missing. Please check your .env file."
        );
        throw new Error(
          "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file"
        );
      }

      if (this.openaiApiKey === "your_openai_api_key_here") {
        console.error(
          "OpenAI API key is not set properly. Please replace the placeholder with your actual API key."
        );
        throw new Error(
          "OpenAI API key is not set. Please update your .env file with your actual API key"
        );
      }

      const prompt = `
Analyze the match between this job and the candidate's resume. Provide a detailed scoring and analysis.

JOB DETAILS:
Title: ${job.title}
Description: ${job.description}
Category: ${job.category}
Level: ${job.level}
Location: ${job.location?.town}, ${job.location?.district}, ${
        job.location?.province
      }
Salary: ${job.salary}
Work Type: ${job.workType}
Work Setup: ${job.workSetup}

CANDIDATE RESUME ANALYSIS:
${JSON.stringify(resumeAnalysis, null, 2)}

Please provide a comprehensive match analysis in JSON format:
{
  "overallScore": number (0-100),
  "skillMatch": {
    "score": number (0-100),
    "matchingSkills": ["array of matching skills"],
    "missingSkills": ["array of missing skills"],
    "skillGap": "description of skill gaps"
  },
  "experienceMatch": {
    "score": number (0-100),
    "levelMatch": "description of experience level match",
    "yearsOfExperience": number
  },
  "locationMatch": {
    "score": number (0-100),
    "locationCompatibility": "description"
  },
  "educationMatch": {
    "score": number (0-100),
    "educationRelevance": "description"
  },
  "culturalFit": {
    "score": number (0-100),
    "fitDescription": "description of cultural fit"
  },
  "recommendations": {
    "strengths": ["array of candidate strengths for this role"],
    "improvements": ["array of areas for improvement"],
    "suggestions": ["array of specific suggestions"]
  },
  "matchLabel": "Perfect Match|Excellent Match|Good Match|Fair Match|Poor Match",
  "confidence": number (0-100),
  "detailedAnalysis": "comprehensive analysis of the match"
}

Consider Sierra Leone context, local market conditions, and cultural factors in your analysis.
`;

      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert job matching specialist for Sierra Leone. Provide detailed, accurate match analysis in JSON format only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const matchAnalysis = JSON.parse(
        response.data.choices[0].message.content
      );
      return matchAnalysis;
    } catch (error) {
      console.error("OpenAI job matching error:", error);
      if (error.response) {
        console.error("OpenAI API response error:", error.response.data);
        throw new Error(
          `OpenAI API error: ${
            error.response.data.error?.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        console.error("Network error:", error.message);
        throw new Error(
          "Network error: Unable to connect to OpenAI API. Please check your internet connection."
        );
      } else {
        throw new Error(`AI job matching failed: ${error.message}`);
      }
    }
  }

  // Get AI-powered job recommendations
  async getAIRecommendations(jobs, resumeAnalysis) {
    try {
      const recommendations = [];

      for (const job of jobs) {
        try {
          const matchAnalysis = await this.matchJobWithAI(job, resumeAnalysis);

          recommendations.push({
            ...job.toObject(),
            matchScore: matchAnalysis.overallScore,
            matchPercentage: matchAnalysis.overallScore,
            skillMatches: matchAnalysis.skillMatch.matchingSkills,
            missingSkills: matchAnalysis.skillMatch.missingSkills,
            matchLabel: matchAnalysis.matchLabel,
            confidence: matchAnalysis.confidence,
            detailedAnalysis: matchAnalysis.detailedAnalysis,
            recommendations: matchAnalysis.recommendations,
            skillGap: matchAnalysis.skillMatch.skillGap,
            experienceMatch: matchAnalysis.experienceMatch,
            locationMatch: matchAnalysis.locationMatch,
            culturalFit: matchAnalysis.culturalFit,
          });
        } catch (error) {
          console.error(`Error matching job ${job._id}:`, error);
          // Add job with basic scoring as fallback
          recommendations.push({
            ...job.toObject(),
            matchScore: 50,
            matchPercentage: 50,
            skillMatches: [],
            missingSkills: [],
            matchLabel: "Fair Match",
            confidence: 50,
            detailedAnalysis: "AI analysis unavailable",
            recommendations: {
              strengths: [],
              improvements: [],
              suggestions: [],
            },
          });
        }
      }

      // Sort by match score (highest first)
      return recommendations.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      throw error;
    }
  }

  // Generate skill gap analysis
  async generateSkillGapAnalysis(recommendations, resumeAnalysis) {
    try {
      const allMissingSkills = new Set();
      const skillFrequency = {};

      recommendations.forEach((job) => {
        job.missingSkills.forEach((skill) => {
          allMissingSkills.add(skill);
          skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
        });
      });

      const mostMissingSkills = Object.entries(skillFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([skill]) => skill);

      return {
        mostMissing: mostMissingSkills,
        totalJobs: recommendations.length,
        averageScore: Math.round(
          recommendations.reduce((sum, job) => sum + job.matchScore, 0) /
            recommendations.length
        ),
        topMatches: recommendations.slice(0, 3),
        resumeAnalysis: resumeAnalysis,
        skillFrequency: skillFrequency,
        improvementAreas: mostMissingSkills.slice(0, 5),
      };
    } catch (error) {
      console.error("Error generating skill gap analysis:", error);
      throw error;
    }
  }

  // Extract text from resume URL
  async extractResumeText(resumeUrl) {
    try {
      const response = await axios.get(resumeUrl);
      const html = response.data;

      // Basic HTML to text conversion
      const text = html
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/<style[^>]*>.*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return text;
    } catch (error) {
      console.error("Error extracting resume text:", error);
      throw new Error("Failed to extract resume text");
    }
  }
}

export default AIJobMatching;
