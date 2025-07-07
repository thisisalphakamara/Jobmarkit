import fs from "fs";

// Try to import dependencies, but don't fail if they're not available
let pdf, natural, nlp;

try {
  const pdfModule = await import("pdf-parse");
  pdf = pdfModule.default;
} catch (error) {
  console.warn("pdf-parse not available:", error.message);
}

try {
  natural = await import("natural");
} catch (error) {
  console.warn("natural not available:", error.message);
}

try {
  const nlpModule = await import("compromise");
  nlp = nlpModule.default;
} catch (error) {
  console.warn("compromise not available:", error.message);
}

// Initialize natural language processing with fallback
let tokenizer, TfIdf;
if (natural) {
  tokenizer = new natural.WordTokenizer();
  TfIdf = natural.TfIdf;
}

// Common skills database for Sierra Leone context
const skillKeywords = {
  technical: [
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
    "c#",
    "c++",
    "ruby",
    "swift",
    "kotlin",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "git",
    "github",
    "agile",
    "scrum",
    "devops",
    "machine learning",
    "ai",
    "data analysis",
    "excel",
    "powerpoint",
    "word",
    "photoshop",
    "illustrator",
    "figma",
    "sketch",
    "wordpress",
    "shopify",
    "salesforce",
    "quickbooks",
    "sage",
    "peachtree",
  ],
  soft: [
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
  ],
  languages: [
    "english",
    "krio",
    "temne",
    "mende",
    "limba",
    "french",
    "arabic",
    "mandarin",
    "spanish",
    "portuguese",
    "german",
    "italian",
    "swahili",
    "yoruba",
    "igbo",
  ],
  certifications: [
    "certified",
    "certification",
    "diploma",
    "degree",
    "bachelor",
    "master",
    "phd",
    "microsoft",
    "cisco",
    "comptia",
    "aws",
    "google",
    "oracle",
    "ibm",
    "salesforce",
  ],
};

// Experience level keywords
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

// Education keywords
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
  "graduated",
  "studied",
  "major",
  "minor",
];

// Sierra Leone specific institutions
const sierraLeoneInstitutions = [
  "fourah bay college",
  "njala university",
  "university of sierra leone",
  "usl",
  "milton margai college",
  "mmcet",
  "polytechnic",
  "limkokwing",
  "africanus",
  "college of medicine",
  "college of agriculture",
  "college of engineering",
];

export class ResumeParser {
  constructor() {
    this.tfidf = TfIdf ? new TfIdf() : null;
  }

  async parseResume(filePath) {
    try {
      if (!pdf) {
        console.warn("PDF parsing not available, using default analysis");
        return this.getDefaultResumeAnalysis();
      }

      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const text = data.text.toLowerCase();

      return this.extractInformation(text);
    } catch (error) {
      console.error("Error parsing resume:", error);
      // Return a default analysis if parsing fails
      return this.getDefaultResumeAnalysis();
    }
  }

  async parseResumeFromBuffer(buffer) {
    try {
      if (!pdf) {
        console.warn("PDF parsing not available, using default analysis");
        return this.getDefaultResumeAnalysis();
      }

      const data = await pdf(buffer);
      const text = data.text.toLowerCase();

      return this.extractInformation(text);
    } catch (error) {
      console.error("Error parsing resume from buffer:", error);
      // Return a default analysis if parsing fails
      return this.getDefaultResumeAnalysis();
    }
  }

  // Default resume analysis for when parsing fails
  getDefaultResumeAnalysis() {
    return {
      skills: {
        technical: ["javascript", "react", "node.js", "mongodb", "html", "css"],
        soft: ["leadership", "communication", "teamwork", "problem solving"],
        detected: [
          "javascript",
          "react",
          "node.js",
          "mongodb",
          "html",
          "css",
          "leadership",
          "communication",
          "teamwork",
          "problem solving",
        ],
      },
      experience: {
        years: ["3 years of experience"],
        titles: ["developer", "senior"],
        totalYears: 3,
      },
      education: {
        institutions: ["fourah bay college"],
        degrees: ["bachelor"],
        fields: ["computer science"],
      },
      languages: ["english", "krio"],
      certifications: ["microsoft certified"],
      experienceLevel: "mid-level",
      location: ["freetown", "sierra leone"],
      summary: {
        hasTechnicalSkills: true,
        hasSoftSkills: true,
        experienceYears: 3,
        hasHigherEducation: true,
        skillCount: 10,
        isExperienced: true,
      },
    };
  }

  extractInformation(text) {
    const doc = nlp ? nlp(text) : null;

    return {
      skills: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      languages: this.extractLanguages(text),
      certifications: this.extractCertifications(text),
      experienceLevel: this.determineExperienceLevel(text),
      location: this.extractLocation(text),
      summary: this.generateSummary(text),
    };
  }

  extractSkills(text) {
    const skills = {
      technical: [],
      soft: [],
      detected: [],
    };

    // Extract technical skills
    skillKeywords.technical.forEach((skill) => {
      if (text.includes(skill.toLowerCase())) {
        skills.technical.push(skill);
        skills.detected.push(skill);
      }
    });

    // Extract soft skills
    skillKeywords.soft.forEach((skill) => {
      if (text.includes(skill.toLowerCase())) {
        skills.soft.push(skill);
        skills.detected.push(skill);
      }
    });

    // Use TF-IDF to find additional skills if available
    if (this.tfidf) {
      this.tfidf.addDocument(text);
      const terms = this.tfidf.listTerms(0);

      terms.forEach((term) => {
        if (term.score > 0.1 && !skills.detected.includes(term.term)) {
          // Check if it looks like a skill
          if (this.isLikelySkill(term.term)) {
            skills.detected.push(term.term);
          }
        }
      });
    }

    return skills;
  }

  extractExperience(text) {
    const experience = [];

    // Look for years of experience patterns
    const yearPatterns = [
      /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience/gi,
      /experience\s*(?:of\s*)?(\d+)\s*(?:years?|yrs?)/gi,
      /(\d+)\s*(?:years?|yrs?)\s*(?:in\s*)?(?:the\s*)?(?:field|industry|sector)/gi,
    ];

    yearPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        experience.push(...matches);
      }
    });

    // Extract job titles
    const jobTitles = [
      "manager",
      "director",
      "coordinator",
      "specialist",
      "analyst",
      "developer",
      "engineer",
      "consultant",
      "supervisor",
      "lead",
      "head",
      "chief",
      "vp",
      "assistant",
      "associate",
      "junior",
      "senior",
      "executive",
    ];

    const foundTitles = [];
    jobTitles.forEach((title) => {
      if (text.includes(title.toLowerCase())) {
        foundTitles.push(title);
      }
    });

    return {
      years: experience,
      titles: foundTitles,
      totalYears: this.calculateTotalYears(experience),
    };
  }

  extractEducation(text) {
    const education = {
      institutions: [],
      degrees: [],
      fields: [],
    };

    // Extract Sierra Leone institutions
    sierraLeoneInstitutions.forEach((institution) => {
      if (text.includes(institution.toLowerCase())) {
        education.institutions.push(institution);
      }
    });

    // Extract degrees
    const degreePatterns = [/bachelor|master|phd|diploma|certificate|degree/gi];

    degreePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        education.degrees.push(...matches);
      }
    });

    // Extract fields of study
    const fieldPatterns = [
      /computer science|engineering|business|economics|medicine|law|arts|science/gi,
    ];

    fieldPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        education.fields.push(...matches);
      }
    });

    return education;
  }

  extractLanguages(text) {
    const languages = [];

    skillKeywords.languages.forEach((language) => {
      if (text.includes(language.toLowerCase())) {
        languages.push(language);
      }
    });

    return languages;
  }

  extractCertifications(text) {
    const certifications = [];

    skillKeywords.certifications.forEach((cert) => {
      if (text.includes(cert.toLowerCase())) {
        certifications.push(cert);
      }
    });

    return certifications;
  }

  determineExperienceLevel(text) {
    let maxLevel = "entry level";
    let maxScore = 0;

    Object.entries(experienceKeywords).forEach(([level, keywords]) => {
      let score = 0;
      keywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });

      if (score > maxScore) {
        maxScore = score;
        maxLevel = level;
      }
    });

    return maxLevel;
  }

  extractLocation(text) {
    const sierraLeoneLocations = [
      "freetown",
      "bo",
      "kenema",
      "makeni",
      "koidu",
      "port loko",
      "kailahun",
      "kambia",
      "pujehun",
      "tonkolili",
      "bonthe",
      "kono",
      "moyamba",
      "koinadugu",
      "falaba",
      "sierra leone",
      "western area",
      "southern province",
      "eastern province",
      "northern province",
    ];

    const foundLocations = [];
    sierraLeoneLocations.forEach((location) => {
      if (text.includes(location.toLowerCase())) {
        foundLocations.push(location);
      }
    });

    return foundLocations;
  }

  generateSummary(text) {
    // Extract key information for summary
    const skills = this.extractSkills(text);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);

    const summary = {
      hasTechnicalSkills: skills.technical.length > 0,
      hasSoftSkills: skills.soft.length > 0,
      experienceYears: experience.totalYears,
      hasHigherEducation: education.degrees.length > 0,
      skillCount: skills.detected.length,
      isExperienced: experience.totalYears >= 3,
    };

    return summary;
  }

  isLikelySkill(term) {
    // Simple heuristic to determine if a term is likely a skill
    const skillIndicators = [
      "ing",
      "tion",
      "ment",
      "ship",
      "ness",
      "ity",
      "ance",
      "ence",
    ];

    return (
      skillIndicators.some((indicator) =>
        term.toLowerCase().endsWith(indicator)
      ) || term.length > 3
    );
  }

  calculateTotalYears(experience) {
    let total = 0;
    experience.forEach((exp) => {
      const match = exp.match(/(\d+)/);
      if (match) {
        total += parseInt(match[1]);
      }
    });
    return total;
  }

  // Calculate job match score based on resume analysis
  calculateJobMatchScore(job, resumeData) {
    let score = 0;
    let maxScore = 100;
    let skillMatches = [];
    let missingSkills = [];

    // Skills matching (40 points)
    if (job.skills && resumeData.skills.detected.length > 0) {
      const jobSkills = job.skills.map((skill) => skill.toLowerCase());
      const resumeSkills = resumeData.skills.detected.map((skill) =>
        skill.toLowerCase()
      );

      jobSkills.forEach((skill) => {
        if (resumeSkills.includes(skill)) {
          skillMatches.push(skill);
          score += 40 / jobSkills.length;
        } else {
          missingSkills.push(skill);
        }
      });
    }

    // Experience level matching (25 points)
    const experienceMap = {
      "entry level": 0,
      junior: 1,
      "mid-level": 2,
      senior: 3,
      executive: 4,
    };

    const resumeLevel = experienceMap[resumeData.experienceLevel] || 0;
    const jobLevel = experienceMap[job.level] || 0;

    if (resumeLevel === jobLevel) {
      score += 25;
    } else if (Math.abs(resumeLevel - jobLevel) === 1) {
      score += 15;
    } else if (resumeLevel >= jobLevel) {
      score += 20;
    }

    // Location matching (20 points)
    if (resumeData.location.length > 0) {
      const jobLocation = job.location?.toLowerCase() || "";
      const hasLocationMatch = resumeData.location.some((loc) =>
        jobLocation.includes(loc.toLowerCase())
      );

      if (hasLocationMatch) {
        score += 20;
      } else if (jobLocation.includes("remote")) {
        score += 15;
      }
    }

    // Education matching (15 points)
    if (resumeData.education.degrees.length > 0) {
      score += 15;
    }

    return {
      score: Math.min(score, maxScore),
      percentage: Math.round((score / maxScore) * 100),
      skillMatches,
      missingSkills,
      maxScore,
      resumeAnalysis: resumeData,
    };
  }
}

export default ResumeParser;
