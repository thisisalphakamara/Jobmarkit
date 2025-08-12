import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import natural from 'natural';

const { WordTokenizer, PorterStemmer } = natural.default || natural;
const tokenizer = new WordTokenizer();

class ResumeParser {
  constructor() {
    this.skills = [];
    this.experience = [];
    this.education = [];
    this.contact = {};
    this.defaultResumeAnalysis = {
      skills: {
        technical: [],
        soft: [],
        detected: []
      },
      experience: { totalYears: 0 },
      education: { degrees: [] },
      languages: [],
      experienceLevel: '',
      location: []
    };
  }

  /**
   * Parse a resume file (PDF or DOCX)
   * @param {Buffer} fileBuffer - The file buffer to parse
   * @param {string} fileName - The name of the file (used to determine file type)
   * @returns {Promise<Object>} - Parsed resume data
   */
  async parseResume(fileBuffer, fileName) {
    try {
      const fileExt = path.extname(fileName).toLowerCase();
      let text = '';

      if (fileExt === '.pdf') {
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (fileExt === '.docx') {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
      }

      // Process the extracted text
      return this.processText(text);
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  /**
   * Parse a resume from a URL
   * @param {string} url - The URL of the resume to parse
   * @returns {Promise<Object>} - Parsed resume data
   */
  async parseResumeFromUrl(url) {
    try {
      // Fetch the file from the URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch resume from URL: ${response.statusText}`);
      }
      
      // Get the file content as a buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Determine file type from URL or content type
      const contentType = response.headers.get('content-type') || '';
      let fileExt = path.extname(url).toLowerCase();
      
      // If no extension in URL, try to determine from content type
      if (!fileExt) {
        if (contentType.includes('pdf')) fileExt = '.pdf';
        else if (contentType.includes('word') || contentType.includes('document')) fileExt = '.docx';
      }
      
      // Parse the resume using the existing method
      return this.parseResume(buffer, `resume${fileExt}`);
    } catch (error) {
      console.error('Error parsing resume from URL:', error);
      // Return a default analysis if parsing fails
      return this.getDefaultResumeAnalysis();
    }
  }

  /**
   * Process the extracted text to extract relevant information
   * @param {string} text - The extracted text from the resume
   * @returns {Object} - Structured resume data
   */
  processText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid resume content');
    }

    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Simple extraction logic - this can be enhanced with more sophisticated NLP
    const result = {
      skills: this.extractSection(lines, ['skills', 'technical skills', 'key skills']),
      experience: this.extractSection(lines, ['experience', 'work experience', 'employment history']),
      education: this.extractSection(lines, ['education', 'academic background']),
      contact: this.extractContactInfo(lines)
    };

    // Fallback: If no skills found, try to extract from the entire text
    if (result.skills.length === 0) {
      result.skills = this.extractSkillsFromText(text);
    }

    return result;
  }

  /**
   * Extract a section from the resume based on common section headers
   */
  extractSection(lines, possibleHeaders) {
    const section = [];
    let inSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if this line is a section header
      if (possibleHeaders.some(header => lowerLine.includes(header))) {
        inSection = true;
        continue;
      }
      
      // Check if we've hit another section
      if (inSection && line.trim() === '') {
        inSection = false;
        continue;
      }
      
      if (inSection && line.trim()) {
        section.push(line.trim());
      }
    }
    
    return section;
  }

  /**
   * Extract contact information from the resume
   */
  extractContactInfo(lines) {
    const contact = {};
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
    const phoneRegex = /(\+\d{1,3}[- ]?)?\d{10,}/;
    
    for (const line of lines) {
      // Check for email
      const emailMatch = line.match(emailRegex);
      if (emailMatch && !contact.email) {
        contact.email = emailMatch[0];
      }
      
      // Check for phone
      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch && !contact.phone) {
        contact.phone = phoneMatch[0];
      }
      
      // Check for name (first non-empty line is often the name)
      if (line.trim() && !contact.name && !emailMatch && !phoneMatch) {
        contact.name = line.trim();
      }
    }
    
    return contact;
  }

  /**
   * Extract skills from the entire text using keyword matching
   */
  extractSkillsFromText(text) {
    // Common technical skills to look for
    const commonSkills = [
      'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin',
      'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
      'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'docker', 'kubernetes',
      'git', 'rest api', 'graphql', 'typescript', 'html', 'css', 'sass', 'less'
    ];
    
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    const stemmedTokens = tokens.map(token => PorterStemmer.stem(token));
    
    return commonSkills.filter(skill => {
      const skillWords = skill.split(/[^a-z0-9]/).filter(Boolean);
      return skillWords.every(word => 
        stemmedTokens.includes(PorterStemmer.stem(word))
      );
    });
  }

  /**
   * Get a default resume analysis object
   * @returns {Object} Default resume analysis
   */
  getDefaultResumeAnalysis() {
    return JSON.parse(JSON.stringify(this.defaultResumeAnalysis));
  }

  /**
   * Calculate job match score based on resume data
   * @param {Object} job - Job object to match against
   * @param {Object} resumeData - Parsed resume data
   * @returns {Object} Match results
   */
  calculateJobMatchScore(job, resumeData) {
    try {
      // Default values
      const result = {
        score: 0,
        percentage: 0,
        skillMatches: [],
        missingSkills: []
      };

      // If no resume data, return default values
      if (!resumeData) {
        return result;
      }

      // Get job requirements (convert to lowercase for case-insensitive matching)
      const jobSkills = (job.skillsRequired || []).map(skill => skill.toLowerCase());
      const resumeSkills = [
        ...(resumeData.skills?.technical || []),
        ...(resumeData.skills?.soft || []),
        ...(resumeData.skills?.detected || [])
      ].map(skill => skill.toLowerCase());

      // Calculate skill matches
      result.skillMatches = jobSkills.filter(skill => 
        resumeSkills.some(resumeSkill => 
          resumeSkill.includes(skill) || skill.includes(resumeSkill)
        )
      );

      // Calculate missing skills
      result.missingSkills = jobSkills.filter(skill => 
        !result.skillMatches.includes(skill)
      );

      // Calculate match percentage
      if (jobSkills.length > 0) {
        result.percentage = Math.round((result.skillMatches.length / jobSkills.length) * 100);
      }

      // Set score (0-100)
      result.score = result.percentage;

      return result;
    } catch (error) {
      console.error('Error calculating job match score:', error);
      return {
        score: 0,
        percentage: 0,
        skillMatches: [],
        missingSkills: [],
        error: error.message
      };
    }
  }
}

// Export as ES module
export default ResumeParser;