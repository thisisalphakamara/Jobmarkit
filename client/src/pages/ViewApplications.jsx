import React, { useContext, useEffect, useState, useRef } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import Loading from "../components/Loading";
import KanbanBoard from "../components/KanbanBoard";
import MessagingSystem from "../components/MessagingSystem";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  FileText,
  ChevronDown,
  User,
  MapPin,
  Briefcase,
  MoreHorizontal,
  Search,
  Calendar,
  Video,
  Map,
  Star,
  TrendingUp,
  Target,
  Grid3X3,
  List,
  Eye,
  Clock,
  Users,
  Award,
  CheckCircle,
  Move,
  MessageSquare,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const ViewApplications = () => {
  const { backendUrl, companyToken, recruiterToken, jobs } =
    useContext(AppContext);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [interviewType, setInterviewType] = useState("online");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [sortBy, setSortBy] = useState("matchScore");
  const [viewMode, setViewMode] = useState("table"); // "table" or "kanban"
  const [draggedApplicant, setDraggedApplicant] = useState(null);
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedApplicantForMessaging, setSelectedApplicantForMessaging] =
    useState(null);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState({});
  const menuRef = useRef(null);

  const location = useLocation();
  const sortUnreadTop = location.state?.sortUnreadTop;
  const highlightToday = location.state?.highlightToday;
  const showInterviewsToday = location.state?.showInterviewsToday;

  // Kanban stages configuration
  const kanbanStages = [
    {
      id: "applied",
      title: "Applied",
      icon: <FileText size={16} />,
      color: "bg-gray-100 border-gray-200 text-gray-700",
      count: 0,
      description: "New applications",
    },
    {
      id: "interview",
      title: "Interview",
      icon: <Users size={16} />,
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      count: 0,
      description: "Interview scheduled",
    },
    {
      id: "accepted",
      title: "Accepted",
      icon: <CheckCircle size={16} />,
      color: "bg-green-50 border-green-200 text-green-700",
      count: 0,
      description: "Successfully hired",
    },
    {
      id: "rejected",
      title: "Rejected",
      icon: <X size={16} />,
      color: "bg-red-50 border-red-200 text-red-700",
      count: 0,
      description: "Application rejected",
    },
  ];

  // 1. Update statusMap and getKanbanStage to only use 'pending', 'accepted', 'rejected'
  const statusMap = {
    applied: "pending",
    accepted: "accepted",
    rejected: "rejected",
  };

  const getKanbanStage = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "applied";
      case "accepted":
        return "accepted";
      case "rejected":
        return "rejected";
      default:
        return "applied";
    }
  };

  // Update kanban stage counts
  const updateKanbanCounts = (applications) => {
    const counts = {
      applied: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
    };

    console.log(
      "Updating kanban counts for applications:",
      applications.length
    );

    applications.forEach((app) => {
      const stage = getKanbanStage(app.status);
      console.log(
        `Application ${app._id}: status="${app.status}" -> stage="${stage}"`
      );
      if (counts.hasOwnProperty(stage)) {
        counts[stage]++;
      }
    });

    console.log("Final kanban counts:", counts);

    return kanbanStages.map((stage) => ({
      ...stage,
      count: counts[stage.id] || 0,
    }));
  };

  // Handle drag start
  const handleDragStart = (e, applicant) => {
    setDraggedApplicant(applicant);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = async (e, targetStage) => {
    e.preventDefault();

    if (!draggedApplicant) return;

    // Map kanban stage back to application status
    const statusMap = {
      applied: "pending",
      interview: "interview",
      accepted: "accepted",
      rejected: "rejected",
    };

    const newStatus = statusMap[targetStage];

    if (newStatus && newStatus !== draggedApplicant.status) {
      try {
        await changeJobApplicationStatus(
          draggedApplicant._id,
          newStatus,
          draggedApplicant
        );
        toast.success(
          `Moved ${
            draggedApplicant.userId?.name || "Applicant"
          } to ${targetStage}`
        );
      } catch (error) {
        toast.error("Failed to update application status");
      }
    }

    setDraggedApplicant(null);
  };

  // AI-Powered Match Score Calculation - Enhanced for Any Job Type
  const calculateMatchScore = async (applicant, job) => {
    if (!applicant || !job) return 0;

    let score = 0;
    const maxScore = 100;

    // Extract user data (only basic fields available)
    const user = applicant.userId;
    const userResumeUrl = user?.resume || "";
    const userName = user?.name || "";
    const userEmail = user?.email || "";

    // Extract job requirements
    const jobTitle = job?.title || "";
    const jobDescription = job?.description || "";
    const jobRequirements = job?.requirements || "";
    const jobLocation = job?.location || "";
    const jobLevel = job?.level || "";
    const jobCategory = job?.category || "";

    // 1. Resume Content Analysis (40 points)
    let resumeContent = "";
    if (userResumeUrl) {
      try {
        // Try to fetch resume content from URL
        const response = await fetch(userResumeUrl);
        if (response.ok) {
          const text = await response.text();
          // Extract text content (basic HTML stripping)
          resumeContent = text
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch (error) {
        console.log("Could not fetch resume content:", error);
        // Fallback: use URL as content indicator
        resumeContent = userResumeUrl;
      }
    }

    if (resumeContent && resumeContent.length > 50) {
      // Extract skills from actual resume content
      const resumeSkills = extractSkillsFromText(resumeContent, jobCategory);
      const jobSkills = extractSkillsFromText(
        jobDescription + " " + jobRequirements,
        jobCategory
      );

      if (resumeSkills.length > 0 && jobSkills.length > 0) {
        const skillMatches = resumeSkills.filter((skill) =>
          jobSkills.some(
            (jobSkill) =>
              skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
              jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        const skillScore =
          (skillMatches.length /
            Math.max(resumeSkills.length, jobSkills.length)) *
          40;
        score += skillScore;
      } else {
        // Fallback: basic keyword matching with actual content
        const resumeWords = resumeContent.toLowerCase().split(/\s+/);
        const jobWords = (jobDescription + " " + jobRequirements)
          .toLowerCase()
          .split(/\s+/);
        const commonWords = resumeWords.filter(
          (word) => jobWords.includes(word) && word.length > 3
        );
        const relevance =
          commonWords.length / Math.max(resumeWords.length, jobWords.length);
        score += Math.min(relevance * 40, 40);
      }
    } else if (userResumeUrl) {
      // Has resume URL but couldn't fetch content - give partial score
      score += 20;
    } else {
      // No resume - give basic score based on job level
      score += 15; // Basic score for applying without resume
    }

    // 2. Experience Level Matching (25 points)
    if (jobLevel) {
      const experienceMatch = matchExperienceLevel(
        resumeContent,
        jobLevel,
        jobCategory
      );
      score += experienceMatch * 25;
    }

    // 3. Location Matching (20 points)
    if (jobLocation) {
      const locationMatch = matchLocation(resumeContent, jobLocation);
      score += locationMatch * 20;
    }

    // 4. Education Relevance (10 points)
    if (resumeContent && jobRequirements) {
      const educationMatch = matchEducation(
        resumeContent,
        jobRequirements,
        jobCategory
      );
      score += educationMatch * 10;
    }

    // 5. Application Completeness (5 points)
    // Bonus points for having a resume
    if (userResumeUrl) {
      score += 5;
    }

    return Math.round(Math.min(score, maxScore));
  };

  // Enhanced Helper functions for comprehensive job matching
  const extractSkillsFromText = (text, jobCategory = "") => {
    // Comprehensive skill database for all job types
    const allSkills = {
      // Technical Skills
      technical: [
        "javascript",
        "python",
        "react",
        "node.js",
        "java",
        "sql",
        "html",
        "css",
        "mongodb",
        "express",
        "vue",
        "angular",
        "php",
        "c#",
        "c++",
        "ruby",
        "docker",
        "kubernetes",
        "aws",
        "azure",
        "git",
        "agile",
        "scrum",
        "figma",
        "sketch",
        "adobe",
        "photoshop",
        "illustrator",
        "xd",
        "wordpress",
        "shopify",
        "seo",
        "sem",
        "google ads",
        "facebook ads",
        "excel",
        "powerpoint",
        "word",
        "outlook",
        "teams",
        "slack",
        "jira",
        "confluence",
        "trello",
        "asana",
        "notion",
        "zoom",
        "data analysis",
        "statistics",
        "machine learning",
        "ai",
        "deep learning",
        "tableau",
        "power bi",
        "r",
        "matlab",
        "spss",
        "python",
        "r",
        "android",
        "ios",
        "swift",
        "kotlin",
        "flutter",
        "react native",
      ],

      // Business & Finance Skills
      business: [
        "accounting",
        "bookkeeping",
        "financial analysis",
        "budgeting",
        "forecasting",
        "audit",
        "tax preparation",
        "payroll",
        "invoicing",
        "banking",
        "investment",
        "risk management",
        "compliance",
        "regulatory",
        "kpi",
        "financial reporting",
        "cost analysis",
        "profitability",
        "cash flow",
        "quickbooks",
        "sage",
        "xero",
        "excel",
        "powerpoint",
        "word",
      ],

      // Marketing & Sales Skills
      marketing: [
        "digital marketing",
        "social media",
        "content creation",
        "email marketing",
        "seo",
        "sem",
        "ppc",
        "google ads",
        "facebook ads",
        "instagram ads",
        "linkedin ads",
        "brand management",
        "market research",
        "analytics",
        "customer acquisition",
        "lead generation",
        "sales",
        "negotiation",
        "client relationship",
        "account management",
        "cold calling",
        "presentation",
        "canva",
        "mailchimp",
        "hubspot",
        "salesforce",
        "crm",
      ],

      // Healthcare Skills
      healthcare: [
        "nursing",
        "patient care",
        "medical terminology",
        "vital signs",
        "medication administration",
        "clinical procedures",
        "health assessment",
        "medical records",
        "epic",
        "cerner",
        "phlebotomy",
        "laboratory",
        "radiology",
        "pharmacy",
        "medical coding",
        "icd-10",
        "cpt codes",
        "healthcare administration",
        "medical billing",
        "insurance",
      ],

      // Education Skills
      education: [
        "teaching",
        "curriculum development",
        "lesson planning",
        "classroom management",
        "student assessment",
        "educational technology",
        "online teaching",
        "special education",
        "early childhood",
        "adult education",
        "tutoring",
        "academic advising",
        "educational leadership",
        "school administration",
        "blackboard",
        "canvas",
        "google classroom",
        "microsoft teams",
      ],

      // Construction & Trades
      construction: [
        "carpentry",
        "electrical",
        "plumbing",
        "masonry",
        "welding",
        "painting",
        "roofing",
        "concrete",
        "steel work",
        "blueprint reading",
        "construction management",
        "project planning",
        "safety protocols",
        "heavy equipment",
        "excavation",
        "foundation",
        "framing",
        "finishing",
      ],

      // Agriculture & Farming
      agriculture: [
        "farming",
        "crop management",
        "livestock",
        "irrigation",
        "soil science",
        "pest management",
        "harvesting",
        "agricultural technology",
        "organic farming",
        "greenhouse",
        "hydroponics",
        "agricultural machinery",
        "crop rotation",
        "fertilizer",
        "seed management",
        "agricultural economics",
      ],

      // Hospitality & Tourism
      hospitality: [
        "customer service",
        "hotel management",
        "restaurant",
        "food service",
        "bartending",
        "cooking",
        "chef",
        "housekeeping",
        "front desk",
        "concierge",
        "event planning",
        "tourism",
        "travel",
        "tour guide",
        "reservation systems",
        "point of sale",
        "pos",
        "micros",
      ],

      // Transportation & Logistics
      transportation: [
        "driving",
        "truck driving",
        "delivery",
        "logistics",
        "supply chain",
        "warehouse",
        "inventory",
        "shipping",
        "receiving",
        "forklift",
        "route planning",
        "fleet management",
        "transportation",
        "freight",
        "customs",
        "import",
        "export",
        "packaging",
        "quality control",
      ],

      // Administrative & Office
      administrative: [
        "administrative",
        "office management",
        "secretarial",
        "reception",
        "data entry",
        "filing",
        "scheduling",
        "coordination",
        "organization",
        "multitasking",
        "communication",
        "customer service",
        "phone skills",
        "email management",
        "calendar management",
        "travel arrangements",
        "meeting coordination",
        "document preparation",
        "record keeping",
      ],

      // Creative & Design
      creative: [
        "graphic design",
        "web design",
        "ui/ux",
        "illustration",
        "photography",
        "video editing",
        "animation",
        "3d modeling",
        "branding",
        "typography",
        "layout design",
        "print design",
        "digital art",
        "creative direction",
        "adobe creative suite",
        "photoshop",
        "illustrator",
        "indesign",
        "after effects",
        "premiere pro",
        "figma",
        "sketch",
      ],

      // Soft Skills (Universal)
      soft: [
        "leadership",
        "communication",
        "teamwork",
        "problem solving",
        "analytical",
        "creative",
        "time management",
        "organization",
        "adaptability",
        "flexibility",
        "initiative",
        "motivation",
        "interpersonal",
        "collaboration",
        "conflict resolution",
        "mentoring",
        "training",
        "coaching",
        "decision making",
        "strategic thinking",
      ],
    };

    // Determine which skill categories to check based on job category
    let relevantSkills = [...allSkills.soft]; // Always include soft skills

    if (jobCategory) {
      const categoryLower = jobCategory.toLowerCase();
      if (
        categoryLower.includes("software") ||
        categoryLower.includes("it") ||
        categoryLower.includes("tech")
      ) {
        relevantSkills.push(...allSkills.technical);
      } else if (
        categoryLower.includes("business") ||
        categoryLower.includes("finance") ||
        categoryLower.includes("accounting")
      ) {
        relevantSkills.push(...allSkills.business);
      } else if (
        categoryLower.includes("marketing") ||
        categoryLower.includes("sales")
      ) {
        relevantSkills.push(...allSkills.marketing);
      } else if (
        categoryLower.includes("health") ||
        categoryLower.includes("medical") ||
        categoryLower.includes("nursing")
      ) {
        relevantSkills.push(...allSkills.healthcare);
      } else if (
        categoryLower.includes("education") ||
        categoryLower.includes("teaching")
      ) {
        relevantSkills.push(...allSkills.education);
      } else if (
        categoryLower.includes("construction") ||
        categoryLower.includes("trade")
      ) {
        relevantSkills.push(...allSkills.construction);
      } else if (
        categoryLower.includes("agriculture") ||
        categoryLower.includes("farming")
      ) {
        relevantSkills.push(...allSkills.agriculture);
      } else if (
        categoryLower.includes("hospitality") ||
        categoryLower.includes("tourism")
      ) {
        relevantSkills.push(...allSkills.hospitality);
      } else if (
        categoryLower.includes("transport") ||
        categoryLower.includes("logistics")
      ) {
        relevantSkills.push(...allSkills.transportation);
      } else if (
        categoryLower.includes("administrative") ||
        categoryLower.includes("office")
      ) {
        relevantSkills.push(...allSkills.administrative);
      } else if (
        categoryLower.includes("creative") ||
        categoryLower.includes("design")
      ) {
        relevantSkills.push(...allSkills.creative);
      } else {
        // For unknown categories, include all skills
        Object.values(allSkills).forEach((skills) =>
          relevantSkills.push(...skills)
        );
      }
    } else {
      // No category specified, include all skills
      Object.values(allSkills).forEach((skills) =>
        relevantSkills.push(...skills)
      );
    }

    // Remove duplicates
    relevantSkills = [...new Set(relevantSkills)];

    const textLower = text.toLowerCase();
    return relevantSkills.filter((skill) => textLower.includes(skill));
  };

  const matchExperienceLevel = (resumeText, jobLevel, jobCategory = "") => {
    const levelMap = {
      entry: 0.3,
      junior: 0.5,
      mid: 0.7,
      senior: 0.9,
      lead: 1.0,
      manager: 1.0,
      beginner: 0.3,
      intermediate: 0.7,
      advanced: 0.9,
      assistant: 0.4,
      associate: 0.6,
      director: 1.0,
      executive: 1.0,
    };

    const resumeLower = resumeText.toLowerCase();
    const jobLevelLower = jobLevel.toLowerCase();

    // Enhanced experience keywords for different job types
    const experienceKeywords = {
      entry: [
        "entry",
        "junior",
        "graduate",
        "intern",
        "trainee",
        "assistant",
        "0-1 years",
        "1 year",
        "fresh",
        "new",
      ],
      junior: [
        "junior",
        "associate",
        "1-3 years",
        "2 years",
        "3 years",
        "assistant",
      ],
      mid: [
        "mid",
        "intermediate",
        "3-5 years",
        "4 years",
        "5 years",
        "senior associate",
        "experienced",
      ],
      senior: [
        "senior",
        "lead",
        "5-8 years",
        "6 years",
        "7 years",
        "8 years",
        "expert",
      ],
      manager: [
        "manager",
        "director",
        "head",
        "chief",
        "vp",
        "8+ years",
        "10 years",
        "supervisor",
        "coordinator",
      ],
    };

    // Job-specific experience indicators
    const jobSpecificKeywords = {
      healthcare: [
        "patient care",
        "clinical",
        "medical",
        "nursing",
        "healthcare",
      ],
      education: [
        "teaching",
        "classroom",
        "curriculum",
        "student",
        "education",
      ],
      construction: ["construction", "building", "site", "project", "trade"],
      agriculture: ["farming", "crop", "livestock", "agricultural", "harvest"],
      hospitality: [
        "hotel",
        "restaurant",
        "service",
        "hospitality",
        "customer",
      ],
      transportation: [
        "driving",
        "delivery",
        "transport",
        "logistics",
        "fleet",
      ],
    };

    // Find the highest level mentioned in resume
    let resumeLevel = "entry";
    for (const [level, keywords] of Object.entries(experienceKeywords)) {
      if (keywords.some((keyword) => resumeLower.includes(keyword))) {
        resumeLevel = level;
      }
    }

    // Check for job-specific experience
    if (jobCategory && jobSpecificKeywords[jobCategory.toLowerCase()]) {
      const jobSpecificExp = jobSpecificKeywords[jobCategory.toLowerCase()];
      if (jobSpecificExp.some((keyword) => resumeLower.includes(keyword))) {
        // Boost level if job-specific experience is found
        if (resumeLevel === "entry") resumeLevel = "junior";
        else if (resumeLevel === "junior") resumeLevel = "mid";
      }
    }

    // Map resume level to score
    const resumeScore = levelMap[resumeLevel] || 0.5;
    const jobScore = levelMap[jobLevelLower] || 0.5;

    // Calculate match based on level compatibility
    if (resumeScore >= jobScore) {
      return 1.0; // Overqualified or perfect match
    } else if (resumeScore >= jobScore * 0.7) {
      return 0.8; // Close match
    } else {
      return 0.4; // Underqualified
    }
  };

  const matchLocation = (resumeText, jobLocation) => {
    const resumeLower = resumeText.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();

    // Comprehensive Sierra Leone locations
    const sierraLeoneLocations = [
      "freetown",
      "bo",
      "kenema",
      "makeni",
      "koidu",
      "kabala",
      "port loko",
      "kambia",
      "kailahun",
      "tonkolili",
      "bombali",
      "kono",
      "pujehun",
      "bonthe",
      "moyamba",
      "western area",
      "sierra leone",
      "sl",
      "west africa",
      "africa",
    ];

    // Check if resume mentions Sierra Leone locations
    const hasSierraLeoneLocation = sierraLeoneLocations.some((loc) =>
      resumeLower.includes(loc)
    );

    // Exact location match
    if (
      sierraLeoneLocations.some(
        (loc) => jobLoc.includes(loc) && resumeLower.includes(loc)
      )
    ) {
      return 1.0;
    }

    // Sierra Leone match (any location)
    if (
      hasSierraLeoneLocation &&
      sierraLeoneLocations.some((loc) => jobLoc.includes(loc))
    ) {
      return 0.9;
    }

    // Remote work consideration
    if (
      jobLoc.includes("remote") ||
      jobLoc.includes("anywhere") ||
      jobLoc.includes("work from home")
    ) {
      return 0.8;
    }

    // No location info in resume but Sierra Leone job
    if (
      !hasSierraLeoneLocation &&
      sierraLeoneLocations.some((loc) => jobLoc.includes(loc))
    ) {
      return 0.6; // Assume local candidate
    }

    return 0.3; // Low match for different locations
  };

  const matchEducation = (resumeText, jobRequirements, jobCategory = "") => {
    const resumeLower = resumeText.toLowerCase();
    const requirementsLower = jobRequirements.toLowerCase();

    // Comprehensive education keywords
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
      "fourah bay",
      "njala",
      "milton margai",
      "limkokwing",
      "africanus",
      "polytechnic",
      "technical institute",
      "vocational",
      "apprenticeship",
      "training",
    ];

    // Job-specific education requirements
    const jobSpecificEducation = {
      healthcare: ["nursing", "medical", "healthcare", "clinical", "pharmacy"],
      education: ["education", "teaching", "pedagogy", "curriculum"],
      engineering: ["engineering", "technical", "mechanical", "electrical"],
      business: ["business", "management", "administration", "finance"],
      agriculture: ["agriculture", "farming", "crop science", "animal science"],
    };

    // Check if resume mentions education
    const hasEducation = educationKeywords.some((keyword) =>
      resumeLower.includes(keyword)
    );

    // Check if job requires education
    const requiresEducation = educationKeywords.some((keyword) =>
      requirementsLower.includes(keyword)
    );

    // Check for job-specific education
    let hasJobSpecificEducation = false;
    if (jobCategory && jobSpecificEducation[jobCategory.toLowerCase()]) {
      const specificKeywords = jobSpecificEducation[jobCategory.toLowerCase()];
      hasJobSpecificEducation = specificKeywords.some((keyword) =>
        resumeLower.includes(keyword)
      );
    }

    if (hasEducation && requiresEducation) {
      return hasJobSpecificEducation ? 1.0 : 0.9; // Perfect match with job-specific bonus
    } else if (hasEducation) {
      return hasJobSpecificEducation ? 0.9 : 0.8; // Has education but not required
    } else if (requiresEducation) {
      return 0.4; // Requires education but not mentioned
    } else {
      return 0.6; // No education requirements
    }
  };

  // Get match score badge with color coding
  const getMatchScoreBadge = (score) => {
    if (!score || score === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Star size={12} className="mr-1" />
          N/A
        </span>
      );
    }

    let colorClass = "";
    let textColor = "";

    if (score >= 80) {
      colorClass = "bg-emerald-100 text-emerald-800";
      textColor = "text-emerald-700";
    } else if (score >= 60) {
      colorClass = "bg-blue-100 text-blue-800";
      textColor = "text-blue-700";
    } else if (score >= 40) {
      colorClass = "bg-amber-100 text-amber-800";
      textColor = "text-amber-700";
    } else {
      colorClass = "bg-red-100 text-red-800";
      textColor = "text-red-700";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        <Star size={12} className={`mr-1 ${textColor}`} />
        {score}%
      </span>
    );
  };

  useEffect(() => {
    const fetchCompanyJobApplications = async () => {
      if (!companyToken && !recruiterToken) return;
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/company/applicants`,
          {
            headers: { token: companyToken || recruiterToken },
          }
        );
        if (data.success) {
          // Filter out applications that are missing critical data
          const validApplications = data.applications.filter(
            (app) => app.userId && app.jobId
          );

          const applicantsWithScores = await Promise.all(
            validApplications.map(async (applicant) => ({
              ...applicant,
              matchScore: await calculateMatchScore(applicant, applicant.jobId),
            }))
          );
          setApplicants(applicantsWithScores);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to fetch applicants."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyJobApplications();
  }, [companyToken, recruiterToken, backendUrl]); // Dependency on tokens ensures it refetches if token changes

  // 2. Update changeJobApplicationStatus to update local applicants state instantly
  const changeJobApplicationStatus = async (id, status, applicant) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-status`,
        { id, status },
        { headers: { token: companyToken || recruiterToken } }
      );

      if (data.success) {
        // Update local applicants state instantly
        setApplicants((prev) =>
          prev.map((a) => (a._id === id ? { ...a, status: status } : a))
        );
        // Send email notification if applicant email is available
        let applicantEmail = "";
        let applicantName = "";
        if (applicant.userId) {
          applicantEmail = applicant.userId.email || "";
          applicantName = applicant.userId.name || "";
        }
        if (applicantEmail) {
          try {
            await axios.post(`${backendUrl}/api/application/status`, {
              applicantEmail,
              applicantName,
              jobTitle: applicant.jobId?.title || "",
              status: status.toLowerCase(),
            });
          } catch (emailErr) {
            console.log("Email notification failed:", emailErr);
          }
        }
        // Provide specific feedback based on status
        let message = "";
        switch (status.toLowerCase()) {
          case "accepted":
            message = `🎉 ${applicantName || "Candidate"} has been accepted!`;
            break;
          case "rejected":
            message = `❌ ${applicantName || "Candidate"} has been rejected.`;
            break;
          default:
            message = `Application status updated to ${status}`;
        }
        toast.success(message);
      } else {
        toast.error(data.message || "Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // No error toast here; only log the error
    }
  };

  const scheduleInterview = async () => {
    try {
      if (!companyToken && !recruiterToken) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      if (!selectedApplicant) {
        toast.error("No applicant selected");
        return;
      }

      // Debug logging for selected applicant
      console.log("Selected Applicant Full Data:", selectedApplicant);
      console.log("Selected Applicant ID:", selectedApplicant._id);
      console.log("Selected Applicant User:", selectedApplicant.userId);
      console.log("Selected Applicant Job:", selectedApplicant.jobId);

      // Validate required fields
      if (!interviewDate || !interviewTime) {
        toast.error("Please select both date and time for the interview");
        return;
      }

      if (interviewType === "online" && !meetingLink) {
        toast.error("Please provide a meeting link for online interview");
        return;
      }

      if (interviewType === "offline" && !interviewLocation) {
        toast.error("Please provide a location for in-person interview");
        return;
      }

      // Format the date and time
      const formattedDate = new Date(interviewDate).toISOString();
      const formattedTime = interviewTime;

      // Ensure we have the correct application ID
      const applicationId = selectedApplicant._id;
      if (!applicationId) {
        console.error(
          "No application ID found in selected applicant:",
          selectedApplicant
        );
        toast.error("Invalid application data");
        return;
      }

      const interviewDetails = {
        applicationId,
        type: interviewType,
        date: formattedDate,
        time: formattedTime,
        ...(interviewType === "online"
          ? { meetingLink }
          : { location: interviewLocation }),
      };

      // Debug logging
      console.log("Sending interview request with details:", interviewDetails);

      const { data } = await axios.post(
        `${backendUrl}/api/company/schedule-interview`,
        interviewDetails,
        {
          headers: {
            token: companyToken || recruiterToken,
            "Content-Type": "application/json",
          },
        }
      );

      if (data.success) {
        // Automatically move candidate to interview stage
        try {
          await changeJobApplicationStatus(
            selectedApplicant._id,
            "interview",
            selectedApplicant
          );
          toast.success(
            "Interview scheduled successfully and candidate moved to interview stage"
          );
        } catch (statusError) {
          toast.success("Interview scheduled successfully");
          console.error("Failed to update status:", statusError);
        }

        setShowSchedulingModal(false);
        resetSchedulingForm();
        fetchCompanyJobApplications();
      } else {
        console.error("Server response:", data);
        toast.error(data.message || "Failed to schedule interview");
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error details:", error.response?.data?.details);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error scheduling interview";

      toast.error(errorMessage);
    }
  };

  const resetSchedulingForm = () => {
    setSelectedApplicant(null);
    setInterviewType("online");
    setInterviewDate("");
    setInterviewTime("");
    setMeetingLink("");
    setInterviewLocation("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtered and sorted applicants
  const filteredApplicants = applicants
    .filter((applicant) => {
      if (!applicant.jobId || !applicant.userId) return false; // Filter out applicants with no job or user
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        applicant.userId?.name?.toLowerCase().includes(searchTermLower) ||
        applicant.jobId?.title?.toLowerCase().includes(searchTermLower) ||
        applicant.userId?.email?.toLowerCase().includes(searchTermLower);
      const matchesStatus =
        filterStatus === "all" ||
        applicant.status?.toLowerCase() === statusMap[filterStatus];
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "applicantName") {
        return (a.userId?.name || "").localeCompare(b.userId?.name || "");
      } else if (sortBy === "date") {
        return (
          new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
      } else {
        return b.matchScore - a.matchScore;
      }
    });

  // Group applicants by kanban stage
  const groupedApplicants = kanbanStages.reduce((acc, stage) => {
    acc[stage.id] = filteredApplicants.filter(
      (app) => getKanbanStage(app.status) === stage.id
    );
    return acc;
  }, {});

  // Update stage counts
  const stagesWithCounts = updateKanbanCounts(
    applicants.filter((item) => item.jobId && item.userId)
  );

  // Calculate filter counts
  const getFilterCounts = () => {
    const counts = {
      all: applicants.filter((item) => item.jobId && item.userId).length,
      pending: applicants.filter(
        (item) =>
          item.jobId &&
          item.userId &&
          (item.status?.toLowerCase() === "pending" ||
            item.status?.toLowerCase() === "interview")
      ).length,
      accepted: applicants.filter(
        (item) =>
          item.jobId && item.userId && item.status?.toLowerCase() === "accepted"
      ).length,
      rejected: applicants.filter(
        (item) =>
          item.jobId && item.userId && item.status?.toLowerCase() === "rejected"
      ).length,
    };
    return counts;
  };

  const filterCounts = getFilterCounts();

  const getStatusBadge = (status) => {
    if (!status) return null;

    const statusLower = status.toLowerCase();
    let colorClass = "";
    let icon = null;

    switch (statusLower) {
      case "pending":
        colorClass = "bg-purple-100 text-purple-800";
        icon = <Clock size={12} className="mr-1" />;
        break;
      case "interview":
        colorClass = "bg-purple-100 text-purple-800";
        icon = <Users size={12} className="mr-1" />;
        break;
      case "accepted":
      case "hired":
        colorClass = "bg-emerald-100 text-emerald-800";
        icon = <CheckCircle size={12} className="mr-1" />;
        break;
      case "rejected":
        colorClass = "bg-red-100 text-red-800";
        icon = <X size={12} className="mr-1" />;
        break;
      default:
        colorClass = "bg-gray-100 text-gray-800";
        icon = <Clock size={12} className="mr-1" />;
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Check for unread messages
  const checkUnreadMessages = async () => {
    if (applicants.length > 0) {
      const counts = {};
      for (const applicant of applicants) {
        try {
          const { data } = await axios.get(
            `${backendUrl}/api/simple-chat/${applicant._id}`
          );
          if (data.success) {
            const unreadCount = data.messages.filter(
              (msg) => msg.senderType === "applicant" && !msg.read
            ).length;
            counts[applicant._id] = unreadCount;
          }
        } catch (error) {
          console.error("Error checking unread messages:", error);
        }
      }
      setUnreadMessageCounts(counts);
    }
  };

  useEffect(() => {
    checkUnreadMessages();
    // Check every 30 seconds for new messages
    const interval = setInterval(checkUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [applicants, backendUrl]);

  const getJobLocation = (applicant) => {
    // Try to get location from applicant.jobId.location first
    const jobLocation = applicant.jobId?.location;
    if (jobLocation) {
      if (typeof jobLocation === "object" && jobLocation !== null) {
        if (jobLocation.town && jobLocation.district) {
          return `${jobLocation.town}, ${jobLocation.district}`;
        } else if (jobLocation.city) {
          return jobLocation.city;
        } else if (jobLocation.district) {
          return jobLocation.district;
        } else {
          return Object.values(jobLocation).filter(Boolean).join(", ");
        }
      } else if (typeof jobLocation === "string") {
        return jobLocation;
      }
    }
    // Fallback: find the job in the jobs array
    const job = jobs?.find(
      (j) => j._id === (applicant.jobId?._id || applicant.jobId)
    );
    if (job && job.location) {
      if (typeof job.location === "object" && job.location !== null) {
        if (job.location.town && job.location.district) {
          return `${job.location.town}, ${job.location.district}`;
        } else if (job.location.city) {
          return job.location.city;
        } else if (job.location.district) {
          return job.location.district;
        } else {
          return Object.values(job.location).filter(Boolean).join(", ");
        }
      } else if (typeof job.location === "string") {
        return job.location;
      }
    }
    return "No Location";
  };

  if (loading) {
    return <Loading />;
  }

  let sortedApplicants = [...filteredApplicants];
  if (sortUnreadTop) {
    sortedApplicants.sort((a, b) => {
      const unreadA = unreadMessageCounts[a._id] || 0;
      const unreadB = unreadMessageCounts[b._id] || 0;
      if (unreadA === unreadB) return 0;
      return unreadB - unreadA;
    });
  }
  if (highlightToday) {
    sortedApplicants = sortedApplicants.filter(
      (a) => new Date(a.createdAt).toDateString() === new Date().toDateString()
    );
  }
  if (showInterviewsToday) {
    sortedApplicants = sortedApplicants.filter(
      (a) =>
        a.status &&
        a.status.toLowerCase() === "interview" &&
        a.interviewDate &&
        new Date(a.interviewDate).toDateString() === new Date().toDateString()
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6 bg-white rounded-xl shadow-sm border border-gray-100 mt-4 mb-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Users size={24} className="text-gray-700" />
        Applications
      </h1>
      <div className="space-y-4">
        {loading ? (
          <Loading />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {/* Header, Filters, and Sorting */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50">
              {/* Search */}
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Status:
                </span>
                <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      filterStatus === "all"
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-600 hover:bg-white/60"
                    }`}
                  >
                    All
                  </button>
                  {kanbanStages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => setFilterStatus(stage.id)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        filterStatus === stage.id
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-600 hover:bg-white/60"
                      }`}
                    >
                      {stage.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="matchScore">Match Score</option>
                  <option value="date">Date Applied</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Content Area */}
            {viewMode === "kanban" ? (
              <KanbanBoard
                applicants={filteredApplicants}
                stages={stagesWithCounts}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onStatusChange={changeJobApplicationStatus}
                onScheduleInterview={(applicant) => {
                  setSelectedApplicant(applicant);
                  setShowSchedulingModal(true);
                }}
                onMessage={(applicant) => {
                  setSelectedApplicantForMessaging(applicant);
                  setShowMessagingModal(true);
                }}
                getMatchScoreBadge={getMatchScoreBadge}
                getKanbanStage={getKanbanStage}
                unreadMessageCounts={unreadMessageCounts}
              />
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs">
                  <thead className="bg-gray-700 text-white">
                    <tr>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        #
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>Applicant</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm max-md:hidden">
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} />
                          <span>Job Position</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm max-md:hidden">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>Location</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        <div className="flex items-center gap-1">
                          <FileText size={14} />
                          <span>Resume</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>Schedule Interview</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        Status
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <Star size={14} />
                          <span>Match Score</span>
                        </div>
                      </th>
                      <th className="py-3 px-3 text-left font-semibold text-sm">
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          <span>Message</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.length === 0 ? (
                      <tr>
                        <td colSpan="8">
                          <div className="flex flex-col items-center justify-center py-16">
                            <img
                              src={
                                assets.default_company_icon ||
                                "/empty-state.svg"
                              }
                              alt="No applications"
                              className="w-20 h-20 mb-4 opacity-30"
                            />
                            <h3 className="text-lg font-medium text-gray-700 mb-1">
                              No applications found
                            </h3>
                            {(searchTerm || filterStatus !== "all") && (
                              <button
                                onClick={() => {
                                  setSearchTerm("");
                                  setFilterStatus("all");
                                }}
                                className="mt-2 bg-purple-100 text-purple-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors border border-purple-200"
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedApplicants.map((applicant, index) => (
                        <motion.tr
                          key={applicant._id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={
                            highlightToday || showInterviewsToday
                              ? ""
                              : unreadMessageCounts[applicant._id] > 0
                              ? "bg-gray-100"
                              : ""
                          }
                        >
                          <td className="py-3 px-3 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                {applicant.userId?.image ||
                                applicant.userId?.profileImage ? (
                                  <img
                                    className="w-full h-full object-cover"
                                    src={
                                      applicant.userId?.image ||
                                      applicant.userId?.profileImage ||
                                      ""
                                    }
                                    alt={`$${
                                      applicant.userId?.name || "Applicant"
                                    }'s avatar`}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "";
                                    }}
                                  />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center text-lg font-semibold text-white bg-purple-400">
                                    {(() => {
                                      const name =
                                        applicant.userId?.name || "Applicant";
                                      const initials = name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase();
                                      return initials.slice(0, 2);
                                    })()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">
                                  {applicant.userId?.name ||
                                    "Unknown Applicant"}
                                </div>
                                <div className="text-gray-500 text-sm md:hidden">
                                  {applicant.jobId?.title || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-700 max-md:hidden">
                            {applicant.jobId?.title || (
                              <span className="text-red-500 italic">
                                Deleted Job
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-700 max-md:hidden">
                            {getJobLocation(applicant)}
                          </td>
                          <td className="py-3 px-3">
                            {applicant.userId?.resume ? (
                              <a
                                href={applicant.userId.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                              >
                                <FileText size={14} />
                                View Resume
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No Resume
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {applicant.status === "pending" && (
                              <button
                                onClick={() => {
                                  setSelectedApplicant(applicant);
                                  setShowSchedulingModal(true);
                                  setActiveDropdown(null);
                                }}
                                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                              >
                                <Calendar size={14} />
                                Schedule
                              </button>
                            )}
                            {applicant.interviewScheduled && (
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">
                                  {new Date(
                                    applicant.interviewDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className="text-gray-500">
                                  {applicant.interviewTime}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 relative">
                            {applicant.status &&
                            (applicant.status.toLowerCase().trim() ===
                              "pending" ||
                              applicant.status.toLowerCase().trim() ===
                                "interview") ? (
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActiveDropdown(
                                      activeDropdown === index ? null : index
                                    )
                                  }
                                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center gap-1 border border-gray-200"
                                >
                                  <span>
                                    {applicant.status.charAt(0).toUpperCase() +
                                      applicant.status.slice(1)}
                                  </span>
                                  <MoreHorizontal size={14} />
                                </button>
                                <AnimatePresence>
                                  {activeDropdown === index && (
                                    <motion.div
                                      ref={menuRef}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 10 }}
                                      transition={{ duration: 0.2 }}
                                      className="absolute right-0 top-full mt-1 z-10 w-48 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden"
                                    >
                                      <button
                                        onClick={() => {
                                          changeJobApplicationStatus(
                                            applicant._id,
                                            "accepted",
                                            applicant
                                          );
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                      >
                                        <Check size={16} />
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => {
                                          changeJobApplicationStatus(
                                            applicant._id,
                                            "rejected",
                                            applicant
                                          );
                                          setActiveDropdown(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                      >
                                        <X size={16} />
                                        Reject
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : (
                              getStatusBadge(applicant.status)
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {getMatchScoreBadge(applicant.matchScore)}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => {
                                setSelectedApplicantForMessaging(applicant);
                                setShowMessagingModal(true);
                              }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
                                unreadMessageCounts[applicant._id] > 0
                                  ? "bg-gray-700 text-white hover:bg-gray-800 border border-gray-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              }`}
                              title="Send message to applicant"
                            >
                              <MessageSquare size={14} />
                              Message
                              {unreadMessageCounts[applicant._id] > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                  {unreadMessageCounts[applicant._id]}
                                </span>
                              )}
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notification Banner for Unread Messages */}
        {Object.values(unreadMessageCounts).some((count) => count > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 shadow-sm"
          >
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">
                You have unread messages from applicants!
              </h3>
              <p className="text-xs text-gray-600">
                Click on the{" "}
                <span className="inline-block px-2 py-0.5 rounded bg-gray-700 text-white text-xs font-medium">
                  Message
                </span>{" "}
                button next to applicants to view and reply.
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-700">
                {Object.values(unreadMessageCounts).reduce(
                  (sum, count) => sum + count,
                  0
                )}
              </div>
              <div className="text-xs text-gray-500">New messages</div>
            </div>
          </motion.div>
        )}

        {/* Messaging Modal */}
        <AnimatePresence>
          {showMessagingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowMessagingModal(false);
                  setSelectedApplicantForMessaging(null);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[80vh] overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  console.log(
                    "Rendering MessagingSystem with selectedApplicantForMessaging:",
                    selectedApplicantForMessaging
                  );
                  return null;
                })()}
                <MessagingSystem
                  selectedApplicant={selectedApplicantForMessaging}
                  onClose={() => {
                    console.log("Closing messaging modal");
                    setShowMessagingModal(false);
                    setSelectedApplicantForMessaging(null);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Interview Scheduling Modal */}
        <AnimatePresence>
          {showSchedulingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Schedule Interview
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interview Type
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setInterviewType("online")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          interviewType === "online"
                            ? "bg-gray-200 text-gray-900 border border-gray-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Video size={16} />
                        Online
                      </button>
                      <button
                        onClick={() => setInterviewType("offline")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          interviewType === "offline"
                            ? "bg-gray-200 text-gray-900 border border-gray-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Map size={16} />
                        In-person
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={interviewDate}
                        onChange={(e) => setInterviewDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={interviewTime}
                        onChange={(e) => setInterviewTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  {interviewType === "online" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Link
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., https://meet.google.com/xyz-abc"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 123 Main St, Freetown"
                        value={interviewLocation}
                        onChange={(e) => setInterviewLocation(e.g.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowSchedulingModal(false)}
                      className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={scheduleInterview}
                      className="px-5 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ViewApplications;
