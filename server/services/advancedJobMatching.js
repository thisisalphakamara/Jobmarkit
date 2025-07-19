import natural from "natural";
const { TfIdf } = natural;

class AdvancedJobMatching {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new TfIdf();

    // Sierra Leone specific job categories and skills
    this.sierraLeoneJobCategories = {
      Technology: {
        skills: [
          "javascript",
          "python",
          "java",
          "react",
          "node.js",
          "mongodb",
          "sql",
          "html",
          "css",
          "php",
          "wordpress",
          "shopify",
        ],
        keywords: [
          "software",
          "developer",
          "programmer",
          "web",
          "app",
          "digital",
          "tech",
          "computer",
          "coding",
        ],
      },
      Healthcare: {
        skills: [
          "nursing",
          "medicine",
          "pharmacy",
          "healthcare",
          "patient care",
          "medical",
          "clinical",
          "hospital",
          "doctor",
          "nurse",
        ],
        keywords: [
          "health",
          "medical",
          "hospital",
          "clinic",
          "patient",
          "care",
          "treatment",
          "medicine",
        ],
      },
      Education: {
        skills: [
          "teaching",
          "education",
          "curriculum",
          "lesson planning",
          "classroom management",
          "assessment",
          "pedagogy",
          "academic",
        ],
        keywords: [
          "teacher",
          "education",
          "school",
          "teaching",
          "learning",
          "academic",
          "curriculum",
          "student",
        ],
      },
      Agriculture: {
        skills: [
          "farming",
          "agriculture",
          "crop management",
          "livestock",
          "irrigation",
          "soil science",
          "organic farming",
          "poultry",
        ],
        keywords: [
          "farm",
          "agriculture",
          "crop",
          "livestock",
          "farming",
          "rural",
          "food",
          "production",
        ],
      },
      Business: {
        skills: [
          "management",
          "leadership",
          "strategy",
          "marketing",
          "sales",
          "finance",
          "accounting",
          "business development",
          "project management",
        ],
        keywords: [
          "business",
          "management",
          "sales",
          "marketing",
          "finance",
          "strategy",
          "leadership",
          "administration",
        ],
      },
      Construction: {
        skills: [
          "construction",
          "building",
          "carpentry",
          "electrical",
          "plumbing",
          "masonry",
          "architecture",
          "engineering",
          "project management",
        ],
        keywords: [
          "construction",
          "building",
          "carpentry",
          "electrical",
          "plumbing",
          "masonry",
          "architecture",
          "engineering",
        ],
      },
      Transportation: {
        skills: [
          "driving",
          "logistics",
          "transportation",
          "fleet management",
          "delivery",
          "shipping",
          "warehouse",
          "supply chain",
        ],
        keywords: [
          "driver",
          "transport",
          "logistics",
          "delivery",
          "shipping",
          "warehouse",
          "supply chain",
          "fleet",
        ],
      },
      Hospitality: {
        skills: [
          "customer service",
          "hospitality",
          "tourism",
          "hotel management",
          "restaurant",
          "catering",
          "event planning",
          "guest services",
        ],
        keywords: [
          "hotel",
          "restaurant",
          "tourism",
          "hospitality",
          "customer service",
          "catering",
          "event",
          "guest",
        ],
      },
      Government: {
        skills: [
          "public administration",
          "policy",
          "governance",
          "civil service",
          "regulatory",
          "compliance",
          "public service",
          "administration",
        ],
        keywords: [
          "government",
          "public",
          "administration",
          "policy",
          "civil service",
          "regulatory",
          "compliance",
        ],
      },
      Finance: {
        skills: [
          "accounting",
          "finance",
          "banking",
          "investment",
          "financial analysis",
          "budgeting",
          "auditing",
          "tax",
          "bookkeeping",
        ],
        keywords: [
          "finance",
          "accounting",
          "banking",
          "investment",
          "financial",
          "budget",
          "audit",
          "tax",
        ],
      },
    };

    // Sierra Leone specific locations and their job opportunities
    this.locationJobMapping = {
      freetown: {
        opportunities: [
          "Technology",
          "Business",
          "Finance",
          "Government",
          "Healthcare",
          "Education",
          "Hospitality",
        ],
        weight: 1.0,
      },
      bo: {
        opportunities: [
          "Agriculture",
          "Business",
          "Education",
          "Healthcare",
          "Transportation",
        ],
        weight: 0.8,
      },
      kenema: {
        opportunities: [
          "Agriculture",
          "Mining",
          "Business",
          "Education",
          "Healthcare",
        ],
        weight: 0.8,
      },
      makeni: {
        opportunities: [
          "Agriculture",
          "Business",
          "Education",
          "Healthcare",
          "Transportation",
        ],
        weight: 0.8,
      },
      koidu: {
        opportunities: [
          "Mining",
          "Business",
          "Education",
          "Healthcare",
          "Transportation",
        ],
        weight: 0.7,
      },
      kabala: {
        opportunities: [
          "Agriculture",
          "Tourism",
          "Business",
          "Education",
          "Healthcare",
        ],
        weight: 0.7,
      },
    };

    // Experience level mapping
    this.experienceLevels = {
      "entry level": { minYears: 0, maxYears: 2, weight: 0.6 },
      junior: { minYears: 1, maxYears: 3, weight: 0.8 },
      "mid-level": { minYears: 3, maxYears: 7, weight: 1.0 },
      senior: { minYears: 5, maxYears: 10, weight: 1.2 },
      executive: { minYears: 8, maxYears: 20, weight: 1.5 },
    };
  }

  // Extract skills from text using advanced NLP
  extractSkills(text) {
    const words = this.tokenizer.tokenize(text.toLowerCase());
    const skills = new Set();

    // Extract technical skills
    Object.values(this.sierraLeoneJobCategories).forEach((category) => {
      category.skills.forEach((skill) => {
        if (text.toLowerCase().includes(skill.toLowerCase())) {
          skills.add(skill);
        }
      });
    });

    // Extract soft skills
    const softSkills = [
      "leadership",
      "communication",
      "teamwork",
      "problem solving",
      "critical thinking",
      "time management",
      "organization",
      "adaptability",
      "creativity",
      "initiative",
      "customer service",
      "sales",
      "marketing",
      "project management",
      "negotiation",
      "public speaking",
      "presentation",
      "mentoring",
      "training",
      "coaching",
    ];

    softSkills.forEach((skill) => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.add(skill);
      }
    });

    return Array.from(skills);
  }

  // Analyze resume and extract comprehensive information
  analyzeResume(resumeText, userData = {}) {
    const analysis = {
      skills: {
        technical: [],
        soft: [],
        detected: [],
      },
      experience: {
        totalYears: 0,
        level: "entry level",
        positions: [],
      },
      education: {
        degrees: [],
        institutions: [],
        fields: [],
      },
      location: [],
      languages: ["english"],
      certifications: [],
      summary: "",
      strengths: [],
      careerGoals: [],
    };

    const text = resumeText.toLowerCase();
    const words = this.tokenizer.tokenize(text);

    // Extract skills
    const allSkills = this.extractSkills(resumeText);
    analysis.skills.detected = allSkills;

    // Categorize skills
    allSkills.forEach((skill) => {
      if (
        this.sierraLeoneJobCategories.Technology.skills.includes(skill) ||
        this.sierraLeoneJobCategories.Business.skills.includes(skill) ||
        this.sierraLeoneJobCategories.Healthcare.skills.includes(skill)
      ) {
        analysis.skills.technical.push(skill);
      } else {
        analysis.skills.soft.push(skill);
      }
    });

    // Extract experience level
    const experienceKeywords = {
      "entry level": [
        "entry",
        "junior",
        "graduate",
        "intern",
        "trainee",
        "assistant",
        "0-1 years",
        "1 year",
      ],
      junior: ["junior", "associate", "1-3 years", "2 years", "3 years"],
      "mid-level": [
        "mid",
        "intermediate",
        "3-5 years",
        "4 years",
        "5 years",
        "senior associate",
      ],
      senior: ["senior", "lead", "5-8 years", "6 years", "7 years", "8 years"],
      executive: [
        "executive",
        "director",
        "manager",
        "head",
        "chief",
        "vp",
        "8+ years",
        "10 years",
      ],
    };

    let maxLevel = "entry level";
    Object.entries(experienceKeywords).forEach(([level, keywords]) => {
      keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          maxLevel = level;
        }
      });
    });
    analysis.experience.level = maxLevel;

    // Extract years of experience
    const yearPatterns = [
      /(\d+)\s*years?/gi,
      /(\d+)\s*yrs?/gi,
      /experience.*?(\d+)/gi,
    ];

    let totalYears = 0;
    yearPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        const years = parseInt(matches[1]);
        if (years > totalYears) totalYears = years;
      }
    });
    analysis.experience.totalYears = totalYears;

    // Extract education
    const educationKeywords = [
      "university",
      "college",
      "school",
      "institute",
      "academy",
      "bachelor",
      "master",
      "phd",
      "diploma",
      "certificate",
      "degree",
    ];

    educationKeywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        analysis.education.degrees.push(keyword);
      }
    });

    // Extract location
    Object.keys(this.locationJobMapping).forEach((location) => {
      if (text.includes(location)) {
        analysis.location.push(location);
      }
    });

    // Generate strengths based on skills and experience
    if (analysis.skills.technical.length > 0) {
      analysis.strengths.push("Strong technical skills");
    }
    if (analysis.skills.soft.length > 0) {
      analysis.strengths.push("Excellent soft skills");
    }
    if (totalYears > 3) {
      analysis.strengths.push("Significant work experience");
    }
    if (analysis.education.degrees.length > 0) {
      analysis.strengths.push("Strong educational background");
    }

    // Generate career goals based on skills
    if (
      analysis.skills.technical.includes("javascript") ||
      analysis.skills.technical.includes("python")
    ) {
      analysis.careerGoals.push("Advance in software development");
    }
    if (analysis.skills.soft.includes("leadership")) {
      analysis.careerGoals.push("Move into leadership roles");
    }
    if (analysis.location.includes("freetown")) {
      analysis.careerGoals.push("Work in the capital city");
    }

    return analysis;
  }

  // Calculate job match score using advanced algorithms
  calculateJobMatch(job, resumeAnalysis) {
    let score = 0;
    const maxScore = 100;
    const skillMatches = [];
    const missingSkills = [];

    // 1. Skills Matching (40 points)
    const jobSkills = this.extractSkills(job.description + " " + job.title);
    const resumeSkills = resumeAnalysis.skills.detected;

    jobSkills.forEach((skill) => {
      const match = resumeSkills.find(
        (resumeSkill) =>
          resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(resumeSkill.toLowerCase())
      );

      if (match) {
        skillMatches.push(skill);
        score += 40 / jobSkills.length;
      } else {
        missingSkills.push(skill);
      }
    });

    // 2. Experience Level Matching (25 points)
    const jobLevel = job.level?.toLowerCase() || "mid-level";
    const resumeLevel = resumeAnalysis.experience.level;

    const levelScore = this.calculateExperienceMatch(
      jobLevel,
      resumeLevel,
      resumeAnalysis.experience.totalYears
    );
    score += levelScore * 25;

    // 3. Location Matching (20 points)
    const locationScore = this.calculateLocationMatch(job, resumeAnalysis);
    score += locationScore * 20;

    // 4. Education Matching (10 points)
    const educationScore = this.calculateEducationMatch(job, resumeAnalysis);
    score += educationScore * 10;

    // 5. Category Matching (5 points)
    const categoryScore = this.calculateCategoryMatch(job, resumeAnalysis);
    score += categoryScore * 5;

    return {
      score: Math.min(score, maxScore),
      percentage: Math.round((score / maxScore) * 100),
      skillMatches,
      missingSkills,
      maxScore,
      detailedAnalysis: this.generateDetailedAnalysis(
        job,
        resumeAnalysis,
        skillMatches,
        missingSkills
      ),
    };
  }

  // Calculate experience level match
  calculateExperienceMatch(jobLevel, resumeLevel, resumeYears) {
    const jobLevelInfo =
      this.experienceLevels[jobLevel] || this.experienceLevels["mid-level"];
    const resumeLevelInfo =
      this.experienceLevels[resumeLevel] || this.experienceLevels["mid-level"];

    // Check if years of experience match the job level
    if (
      resumeYears >= jobLevelInfo.minYears &&
      resumeYears <= jobLevelInfo.maxYears
    ) {
      return 1.0; // Perfect match
    } else if (resumeYears >= jobLevelInfo.minYears) {
      return 0.8; // Overqualified but acceptable
    } else if (resumeYears >= jobLevelInfo.minYears - 1) {
      return 0.6; // Slightly underqualified but close
    } else {
      return 0.3; // Underqualified
    }
  }

  // Calculate location match
  calculateLocationMatch(job, resumeAnalysis) {
    const jobLocation = job.location?.town?.toLowerCase() || "";
    const resumeLocations = resumeAnalysis.location;

    // Check if user has experience in the job location
    if (resumeLocations.some((loc) => jobLocation.includes(loc))) {
      return 1.0; // Perfect location match
    }

    // Check if job location is in a major city
    const locationInfo =
      this.locationJobMapping[jobLocation] ||
      this.locationJobMapping["freetown"];
    if (locationInfo) {
      return 0.8; // Good location opportunity
    }

    return 0.5; // Neutral location match
  }

  // Calculate education match
  calculateEducationMatch(job, resumeAnalysis) {
    if (resumeAnalysis.education.degrees.length > 0) {
      return 1.0; // Has education
    }
    return 0.5; // No formal education specified
  }

  // Calculate category match
  calculateCategoryMatch(job, resumeAnalysis) {
    const jobCategory = job.category?.toLowerCase() || "";
    const resumeSkills = resumeAnalysis.skills.detected;

    // Check if user has skills relevant to the job category
    Object.entries(this.sierraLeoneJobCategories).forEach(
      ([category, info]) => {
        if (jobCategory.includes(category.toLowerCase())) {
          const relevantSkills = info.skills.filter((skill) =>
            resumeSkills.some((resumeSkill) =>
              resumeSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          return relevantSkills.length / info.skills.length;
        }
      }
    );

    return 0.5; // Neutral category match
  }

  // Generate detailed analysis
  generateDetailedAnalysis(job, resumeAnalysis, skillMatches, missingSkills) {
    const analysis = [];

    if (skillMatches.length > 0) {
      analysis.push(
        `Strong match with ${skillMatches.length} skills: ${skillMatches.join(
          ", "
        )}`
      );
    }

    if (missingSkills.length > 0) {
      analysis.push(
        `Could improve by learning: ${missingSkills.slice(0, 3).join(", ")}`
      );
    }

    if (resumeAnalysis.experience.totalYears >= 3) {
      analysis.push("Good experience level for this role");
    }

    if (
      resumeAnalysis.location.some((loc) =>
        job.location?.town?.toLowerCase().includes(loc)
      )
    ) {
      analysis.push("Location experience is a strong match");
    }

    return analysis.join(". ");
  }

  // Get AI-powered job recommendations
  async getJobRecommendations(jobs, resumeAnalysis) {
    const recommendations = [];

    for (const job of jobs) {
      try {
        const matchData = this.calculateJobMatch(job, resumeAnalysis);

        // Only include jobs with meaningful matches (at least 25% match)
        if (matchData.percentage >= 25) {
          recommendations.push({
            ...job.toObject(),
            matchScore: matchData.score,
            matchPercentage: matchData.percentage,
            skillMatches: matchData.skillMatches,
            missingSkills: matchData.missingSkills,
            matchLabel: this.getMatchLabel(matchData.percentage),
            confidence: Math.min(matchData.percentage + 10, 100),
            detailedAnalysis: matchData.detailedAnalysis,
            recommendations: this.generateRecommendations(
              job,
              resumeAnalysis,
              matchData
            ),
            skillGap: this.generateSkillGap(matchData.missingSkills),
            experienceMatch: this.getExperienceMatchDescription(
              job,
              resumeAnalysis
            ),
            locationMatch: this.getLocationMatchDescription(
              job,
              resumeAnalysis
            ),
            culturalFit: this.getCulturalFitDescription(job, resumeAnalysis),
          });
        }
      } catch (error) {
        console.error(`Error matching job ${job._id}:`, error);
        // Skip jobs that can't be analyzed properly
        continue;
      }
    }

    // Sort by match score (highest first) and limit to top 10
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  // Get match label
  getMatchLabel(percentage) {
    if (percentage >= 85) return "Perfect Match";
    if (percentage >= 70) return "Excellent Match";
    if (percentage >= 55) return "Good Match";
    if (percentage >= 40) return "Fair Match";
    if (percentage >= 25) return "Basic Match";
    return "Poor Match";
  }

  // Generate recommendations
  generateRecommendations(job, resumeAnalysis, matchData) {
    const recommendations = {
      strengths: [],
      improvements: [],
      suggestions: [],
    };

    // Strengths
    if (matchData.skillMatches.length > 0) {
      recommendations.strengths.push(
        `Strong skills in ${matchData.skillMatches.join(", ")}`
      );
    }
    if (resumeAnalysis.experience.totalYears >= 3) {
      recommendations.strengths.push("Good experience level for this role");
    }
    if (resumeAnalysis.education.degrees.length > 0) {
      recommendations.strengths.push("Strong educational background");
    }

    // Improvements
    if (matchData.missingSkills.length > 0) {
      recommendations.improvements.push(
        `Learn ${matchData.missingSkills.slice(0, 3).join(", ")}`
      );
    }
    if (resumeAnalysis.experience.totalYears < 2) {
      recommendations.improvements.push("Gain more work experience");
    }

    // Suggestions
    recommendations.suggestions.push(
      "Tailor your resume to highlight relevant experience"
    );
    recommendations.suggestions.push(
      "Prepare for common interview questions in this field"
    );
    recommendations.suggestions.push(
      "Network with professionals in this industry"
    );

    return recommendations;
  }

  // Generate skill gap analysis
  generateSkillGap(missingSkills) {
    return {
      skills: missingSkills.slice(0, 5),
      priority: "high",
      description: `Focus on learning ${missingSkills
        .slice(0, 3)
        .join(", ")} to improve your job prospects`,
    };
  }

  // Get experience match description
  getExperienceMatchDescription(job, resumeAnalysis) {
    const jobLevel = job.level?.toLowerCase() || "mid-level";
    const resumeLevel = resumeAnalysis.experience.level;
    const years = resumeAnalysis.experience.totalYears;

    if (jobLevel === resumeLevel) {
      return "Perfect experience level match";
    } else if (years >= 5 && jobLevel === "senior") {
      return "Good senior-level experience";
    } else if (years >= 3 && jobLevel === "mid-level") {
      return "Solid mid-level experience";
    } else {
      return "Consider gaining more experience in this field";
    }
  }

  // Get location match description
  getLocationMatchDescription(job, resumeAnalysis) {
    const jobLocation = job.location?.town?.toLowerCase() || "";
    const resumeLocations = resumeAnalysis.location;

    if (resumeLocations.some((loc) => jobLocation.includes(loc))) {
      return "Strong location match with local experience";
    } else if (jobLocation.includes("freetown")) {
      return "Capital city opportunity";
    } else {
      return "New location opportunity";
    }
  }

  // Get cultural fit description
  getCulturalFitDescription(job, resumeAnalysis) {
    const jobCategory = job.category?.toLowerCase() || "";
    const resumeSkills = resumeAnalysis.skills.detected;

    if (
      jobCategory.includes("technology") &&
      resumeSkills.some((s) => s.includes("javascript"))
    ) {
      return "Strong cultural fit for tech environment";
    } else if (
      jobCategory.includes("healthcare") &&
      resumeSkills.some((s) => s.includes("nursing"))
    ) {
      return "Excellent fit for healthcare environment";
    } else if (
      jobCategory.includes("education") &&
      resumeSkills.some((s) => s.includes("teaching"))
    ) {
      return "Perfect fit for educational environment";
    } else {
      return "Good potential for cultural adaptation";
    }
  }

  // Generate skill gap analysis for all recommendations
  async generateSkillGapAnalysis(recommendations, resumeAnalysis) {
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
  }
}

export default AdvancedJobMatching;
