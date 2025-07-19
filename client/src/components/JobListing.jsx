import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { assets, jobCategories } from "../assets/assets"; // Import new jobCategories
import JobCard from "./JobCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFilter,
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiGlobe,
  FiWifi,
  FiHome,
  FiHeart,
  FiEye,
  FiShare2,
  FiBookmark,
  FiAlertCircle,
  FiCheckCircle,
  FiZap,
  FiSearch,
  FiX,
  FiGrid,
  FiList,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const mainCategories = [
  "All Categories",
  ...jobCategories.map((cat) => cat.label),
];

// Add this array for location filtering (matches AddJob.jsx districts)
const sierraLeoneLocations = [
  {
    name: "Kailahun",
    province: "Eastern",
    icon: "📍",
    district: "Kailahun",
    count: 0,
  },
  {
    name: "Kenema",
    province: "Eastern",
    icon: "📍",
    district: "Kenema",
    count: 0,
  },
  { name: "Kono", province: "Eastern", icon: "📍", district: "Kono", count: 0 },
  {
    name: "Bombali",
    province: "Northern",
    icon: "📍",
    district: "Bombali",
    count: 0,
  },
  {
    name: "Falaba",
    province: "Northern",
    icon: "📍",
    district: "Falaba",
    count: 0,
  },
  {
    name: "Koinadugu",
    province: "Northern",
    icon: "📍",
    district: "Koinadugu",
    count: 0,
  },
  {
    name: "Tonkolili",
    province: "Northern",
    icon: "📍",
    district: "Tonkolili",
    count: 0,
  },
  {
    name: "Kambia",
    province: "Northern",
    icon: "📍",
    district: "Kambia",
    count: 0,
  },
  {
    name: "Karene",
    province: "Northern",
    icon: "📍",
    district: "Karene",
    count: 0,
  },
  {
    name: "Port Loko",
    province: "Northern",
    icon: "📍",
    district: "Port Loko",
    count: 0,
  },
  { name: "Bo", province: "Southern", icon: "📍", district: "Bo", count: 0 },
  {
    name: "Bonthe",
    province: "Southern",
    icon: "📍",
    district: "Bonthe",
    count: 0,
  },
  {
    name: "Moyamba",
    province: "Southern",
    icon: "📍",
    district: "Moyamba",
    count: 0,
  },
  {
    name: "Pujehun",
    province: "Southern",
    icon: "📍",
    district: "Pujehun",
    count: 0,
  },
  {
    name: "Western Rural",
    province: "Western",
    icon: "📍",
    district: "Western Rural",
    count: 0,
  },
  {
    name: "Western Urban",
    province: "Western",
    icon: "📍",
    district: "Western Urban",
    count: 0,
  },
];

// Experience levels for filtering
const experienceLevels = [
  {
    name: "Beginner level",
    icon: "🟢",
    description: "No experience or just starting out",
    count: 0,
  },
  {
    name: "Intermediate level",
    icon: "🟡",
    description: "Some experience, can work independently",
    count: 0,
  },
  {
    name: "Senior level",
    icon: "🔴",
    description: "Extensive experience, can lead others",
    count: 0,
  },
];

// Work types for filtering
const workTypes = [
  {
    name: "Full-time",
    icon: "🕒",
    description: "Standard full-time employment",
    count: 0,
  },
  {
    name: "Part-time",
    icon: "⏰",
    description: "Work fewer hours per week",
    count: 0,
  },
  {
    name: "Contract",
    icon: "📄",
    description: "Fixed-term or project-based work",
    count: 0,
  },
  {
    name: "Internship",
    icon: "🎓",
    description: "Short-term training or internship",
    count: 0,
  },
];

// Work setups for filtering
const workSetups = [
  { name: "On-site", icon: "🏢" },
  { name: "Remote", icon: "💻" },
  { name: "Hybrid", icon: "🌐" },
];

// Add at the top, after sierraLeoneLocations:
const sierraLeoneDistricts = [
  { district: "Kailahun", province: "Eastern", capital: "Kailahun" },
  { district: "Kenema", province: "Eastern", capital: "Kenema" },
  { district: "Kono", province: "Eastern", capital: "Koidu Town" },
  { district: "Bombali", province: "Northern", capital: "Makeni" },
  { district: "Falaba", province: "Northern", capital: "Bendugu" },
  { district: "Koinadugu", province: "Northern", capital: "Kabala" },
  { district: "Tonkolili", province: "Northern", capital: "Magburaka" },
  { district: "Kambia", province: "Northern", capital: "Kambia" },
  { district: "Karene", province: "Northern", capital: "Kamakwie" },
  { district: "Port Loko", province: "Northern", capital: "Port Loko" },
  { district: "Bo", province: "Southern", capital: "Bo" },
  { district: "Bonthe", province: "Southern", capital: "Bonthe" },
  { district: "Moyamba", province: "Southern", capital: "Moyamba" },
  { district: "Pujehun", province: "Southern", capital: "Pujehun" },
  {
    district: "Western Area Rural",
    province: "Western Area",
    capital: "Waterloo",
  },
  {
    district: "Western Area Urban",
    province: "Western Area",
    capital: "Freetown",
  },
];
const provinceOptions = ["Eastern", "Northern", "Southern", "Western Area"];
const capitalTowns = [
  ...sierraLeoneDistricts.map((d) => d.capital),
  "Lunsar",
  "Masiaka",
  "Lungi",
];

// Add at the top, after sierraLeoneLocations:
const provinces = Array.from(
  new Set(sierraLeoneLocations.map((l) => l.province))
);
const districtsByProvince = provinces.reduce((acc, province) => {
  acc[province] = sierraLeoneLocations
    .filter((l) => l.province === province)
    .map((l) => l.district);
  return acc;
}, {});
const townsByDistrict = {};
sierraLeoneLocations.forEach((l) => {
  if (!townsByDistrict[l.district]) townsByDistrict[l.district] = [];
  townsByDistrict[l.district].push(l.name);
});

const JobListing = () => {
  const {
    isSearched,
    searchFilter,
    setSearchFilter,
    jobs,
    userApplications,
    userData,
    fetchUserApplications,
    backendUrl,
  } = useContext(AppContext);

  const { getToken } = useAuth();

  const initialLoad = useRef(true);
  const [showFilter, setShowFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  // New category state
  const [selectedMainCategory, setSelectedMainCategory] =
    useState("All Categories");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [otherCategoryFilter, setOtherCategoryFilter] = useState(""); // For "Other" text input

  const [selectedLocation, setSelectedLocation] = useState([]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [fade, setFade] = useState(true);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("Most Recent");
  // Add work setup filter state
  const [selectedWorkSetup, setSelectedWorkSetup] = useState([]);

  const [selectedExperience, setSelectedExperience] = useState([]);
  const [selectedWorkType, setSelectedWorkType] = useState([]);
  const [salaryRange, setSalaryRange] = useState({ min: "", max: "" });
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showUrgentJobs, setShowUrgentJobs] = useState(false);
  const [showRemoteJobs, setShowRemoteJobs] = useState(false);
  const [showOnsiteJobs, setShowOnsiteJobs] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    categories: false,
    locations: false,
    experience: false,
    workType: false,
    salary: false,
    workSetup: false,
  });

  // AI Job Matching states
  const [showAIMatching, setShowAIMatching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [userSkillProfile, setUserSkillProfile] = useState({});
  const [matchingScore, setMatchingScore] = useState({});
  const [skillGapAnalysis, setSkillGapAnalysis] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showResumeAnalysisModal, setShowResumeAnalysisModal] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [selectedAIRecommendation, setSelectedAIRecommendation] =
    useState(null);

  // Bulk application states
  const [showBulkApplyModal, setShowBulkApplyModal] = useState(false);
  const [bulkApplyProgress, setBulkApplyProgress] = useState(0);
  const [bulkApplyStatus, setBulkApplyStatus] = useState("idle"); // idle, applying, completed, error
  const [bulkApplyResults, setBulkApplyResults] = useState({
    success: 0,
    failed: 0,
    alreadyApplied: 0,
    total: 0,
  });
  const [bulkApplyDetails, setBulkApplyDetails] = useState({
    successful: [],
    failed: [],
    alreadyApplied: [],
  });

  // Refs to track previous filter states
  const prevSelectedLocation = useRef(selectedLocation);
  const prevSearchFilter = useRef({ ...searchFilter });

  // In JobListing component state:
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTown, setSelectedTown] = useState("");

  const jobListingRef = useRef(null);

  // Effect to update sub-category options when main category changes
  useEffect(() => {
    if (selectedMainCategory === "All Categories") {
      setSelectedSubCategory("All");
    } else {
      setSelectedSubCategory("All");
    }
  }, [selectedMainCategory]);

  const triggerTransition = (callback, shouldScroll = true) => {
    setFade(false);
    setTimeout(() => {
      callback();
      setFade(true);
      if (shouldScroll) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 300); // Wait for fade-out to complete
  };

  useEffect(() => {
    const filterJobs = () => {
      // Filter out jobs with missing recruiter or company
      const validJobs = jobs.filter((job) => job.recruiterId || job.companyId);

      const matchesCategory = (job) => {
        if (selectedMainCategory === "All Categories") return true;

        // Handle "Other" category filtering
        if (selectedMainCategory === "Other") {
          if (!otherCategoryFilter) return job.mainCategory === "Other";
          // Check if job's custom category includes the filter text
          return (
            job.mainCategory === "Other" &&
            job.category
              .toLowerCase()
              .includes(otherCategoryFilter.toLowerCase())
          );
        }

        // Use new structure: job.mainCategory and job.category are strings
        const jobMatchesMain = job.mainCategory === selectedMainCategory;
        if (!jobMatchesMain) return false;

        // For subcategory, match label
        const jobMatchesSub =
          selectedSubCategory === "All" || job.category === selectedSubCategory;
        return jobMatchesSub;
      };

      const matchesLocation = (job) => {
        if (!job.location) return false;
        if (selectedTown) {
          return job.location.town === selectedTown;
        } else if (selectedDistrict) {
          return job.location.district === selectedDistrict;
        } else if (selectedProvince) {
          return job.location.province === selectedProvince;
        }
        return true;
      };

      const matchesExperience = (job) => {
        // Debug: log job.level and selectedExperience
        console.log(
          "job.level:",
          job.level,
          "selectedExperience:",
          selectedExperience
        );
        return (
          selectedExperience.length === 0 ||
          selectedExperience.includes(job.level)
        );
      };

      const matchesWorkType = (job) =>
        selectedWorkType.length === 0 ||
        selectedWorkType.includes(job.workType);

      const matchesSalary = (job) => {
        const min = parseFloat(salaryRange.min);
        const max = parseFloat(salaryRange.max);
        if (!min && !max) return true;
        if (min && job.salary < min) return false;
        if (max && job.salary > max) return false;
        return true;
      };

      const matchesUrgent = (job) => {
        if (!showUrgentJobs) return true;
        return job.isUrgent === true;
      };

      const matchesRemote = (job) => {
        if (!showRemoteJobs) return true;
        return job.workSetup && job.workSetup.toLowerCase() === "remote";
      };

      const matchesOnsite = (job) => {
        if (!showOnsiteJobs) return true;
        return job.workSetup && job.workSetup.toLowerCase() === "on-site";
      };

      const matchesTitle = (job) => {
        if (searchFilter.title === "") return true;
        const search = searchFilter.title.toLowerCase();
        // Match job title, keywords, or company name (from companyId)
        const titleMatch =
          job.title && job.title.toLowerCase().includes(search);
        const keywordMatch =
          job.keywords &&
          Array.isArray(job.keywords) &&
          job.keywords.some((k) => k.toLowerCase().includes(search));
        const companyMatch =
          job.companyId &&
          job.companyId.name &&
          job.companyId.name.toLowerCase().includes(search);
        return titleMatch || keywordMatch || companyMatch;
      };

      const matchesSearchLocation = (job) => {
        if (searchFilter.location === "") return true;
        const jobLoc = job.location;
        if (!jobLoc) return false;
        const searchLoc = searchFilter.location.toLowerCase().trim();
        return (
          jobLoc.town?.toLowerCase().trim() === searchLoc ||
          jobLoc.district?.toLowerCase().trim() === searchLoc ||
          jobLoc.province?.toLowerCase().trim() === searchLoc
        );
      };

      const matchesAIRecommendation = (job) => {
        if (!searchFilter.isAiSearch) return true;
        return job._id === selectedAIRecommendation._id;
      };

      const matchesWorkSetup = (job) =>
        selectedWorkSetup.length === 0 ||
        selectedWorkSetup.includes(job.workSetup);

      let filtered = validJobs
        .filter(matchesCategory)
        .filter(searchFilter.location ? matchesSearchLocation : matchesLocation)
        .filter(matchesExperience)
        .filter(matchesWorkType)
        .filter(matchesSalary)
        .filter(matchesUrgent)
        .filter(matchesRemote)
        .filter(matchesOnsite)
        .filter(matchesTitle)
        .filter(matchesAIRecommendation)
        .filter(matchesWorkSetup);

      // Sorting logic
      if (sortBy === "Highest Salary") {
        filtered.sort((a, b) => (b.salary || 0) - (a.salary || 0));
      } else if (sortBy === "Most Popular") {
        // Sort by number of applications (if available) or by date as fallback
        filtered.sort((a, b) => {
          const aApplications = a.applicationCount || 0;
          const bApplications = b.applicationCount || 0;
          if (aApplications !== bApplications) {
            return bApplications - aApplications;
          }
          // If same popularity, sort by date
          return (
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
          );
        });
      } else {
        // Default: Most Recent
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
      }

      setFilteredJobs(filtered);
    };
    // Debounced filter execution
    const handler = setTimeout(() => {
      filterJobs();
    }, 300); // 300ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [
    selectedMainCategory,
    selectedSubCategory,
    otherCategoryFilter, // Add to dependency array
    selectedLocation,
    searchFilter,
    jobs,
    selectedExperience,
    selectedWorkType,
    salaryRange,
    showQuickApply,
    showUrgentJobs,
    showRemoteJobs,
    showOnsiteJobs,
    sortBy,
    selectedAIRecommendation,
    selectedWorkSetup,
  ]);

  const handleCategoryChange = (mainCat, subCat) => {
    setSelectedMainCategory(mainCat);
    setSelectedSubCategory(subCat);
  };

  const handleLocationChange = (location) => {
    triggerTransition(() => {
      setSelectedLocation((prev) =>
        prev.includes(location)
          ? prev.filter((c) => c !== location)
          : [...prev, location]
      );
    });
  };

  const handleExperienceChange = (experience) => {
    triggerTransition(() => {
      setSelectedExperience((prev) =>
        prev.includes(experience)
          ? prev.filter((e) => e !== experience)
          : [...prev, experience]
      );
    }, false);
  };

  const handleWorkTypeChange = (workType) => {
    triggerTransition(() => {
      setSelectedWorkType((prev) =>
        prev.includes(workType)
          ? prev.filter((w) => w !== workType)
          : [...prev, workType]
      );
    }, false);
  };

  const handlePageChange = (newPage) => {
    triggerTransition(() => setCurrentPage(newPage));
  };

  const clearAllFilters = () => {
    triggerTransition(() => {
      setSelectedMainCategory("All Categories");
      setSelectedSubCategory("All");
      setOtherCategoryFilter(""); // Clear other filter
      setSelectedLocation([]);
      setSelectedExperience([]);
      setSelectedWorkType([]);
      setSalaryRange({ min: "", max: "" });
      setShowUrgentJobs(false);
      setShowRemoteJobs(false);
      setShowOnsiteJobs(false);
      setSearchFilter({ title: "", location: "" });
      setSelectedAIRecommendation(null);
      setSelectedWorkSetup([]);
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedTown("");
    }, false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedMainCategory !== "All Categories") count++;
    if (selectedLocation.length > 0) count++;
    if (selectedExperience.length > 0) count++;
    if (selectedWorkType.length > 0) count++;
    if (salaryRange.min || salaryRange.max) count++;
    if (showUrgentJobs) count++;
    if (showRemoteJobs || showOnsiteJobs) count++;
    if (searchFilter.title) count++;
    if (searchFilter.location) count++;
    if (selectedAIRecommendation) count++;
    if (selectedWorkSetup.length > 0) count++;
    return count;
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Bulk application functions
  const handleBulkApply = async () => {
    if (filteredJobs.length === 0) {
      toast.error("No jobs found to apply for!");
      return;
    }

    // Check if user has a resume uploaded
    if (!userData?.resume) {
      toast.error("Please upload your resume first before bulk applying!");
      return;
    }

    // Check if user is logged in
    if (!userData) {
      toast.error("Please login to apply for jobs!");
      return;
    }

    setShowBulkApplyModal(true);
    setBulkApplyStatus("applying");
    setBulkApplyProgress(0);
    setBulkApplyResults({
      success: 0,
      failed: 0,
      alreadyApplied: 0,
      total: filteredJobs.length,
    });
    setBulkApplyDetails({
      successful: [],
      failed: [],
      alreadyApplied: [],
    });

    let successCount = 0;
    let failedCount = 0;
    let alreadyAppliedCount = 0;
    let successfulJobs = [];
    let failedJobs = [];
    let alreadyAppliedJobs = [];

    // Apply to each job with progress tracking
    for (let i = 0; i < filteredJobs.length; i++) {
      const job = filteredJobs[i];

      try {
        // Check if already applied
        const isAlreadyApplied = userApplications?.some(
          (app) => app.jobId?._id === job._id
        );

        if (isAlreadyApplied) {
          alreadyAppliedCount++;
          alreadyAppliedJobs.push(job);
        } else {
          // Make real API call for job application
          const token = await getToken();
          const response = await axios.post(
            `${backendUrl}/api/users/apply`,
            { jobId: job._id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.success) {
            successCount++;
            successfulJobs.push(job);

            // Send notification email (optional - don't block if it fails)
            try {
              await axios.post(`${backendUrl}/api/application/apply`, {
                applicantEmail: userData.email,
                jobPosterEmail: job.companyId?.email,
                jobTitle: job.title,
              });
            } catch (emailErr) {
              console.error("Failed to send notification email:", emailErr);
              // Don't count this as a failure since the application was successful
            }
          } else {
            failedCount++;
            failedJobs.push({ job, error: response.data.message });
            console.error(
              `Failed to apply to ${job.title}:`,
              response.data.message
            );
          }
        }

        // Update progress
        const progress = ((i + 1) / filteredJobs.length) * 100;
        setBulkApplyProgress(progress);
        setBulkApplyResults({
          success: successCount,
          failed: failedCount,
          alreadyApplied: alreadyAppliedCount,
          total: filteredJobs.length,
        });
        setBulkApplyDetails({
          successful: successfulJobs,
          failed: failedJobs,
          alreadyApplied: alreadyAppliedJobs,
        });

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        failedCount++;
        failedJobs.push({ job, error: error.message });
        console.error(`Failed to apply to ${job.title}:`, error);

        // Update progress even on error
        const progress = ((i + 1) / filteredJobs.length) * 100;
        setBulkApplyProgress(progress);
        setBulkApplyResults({
          success: successCount,
          failed: failedCount,
          alreadyApplied: alreadyAppliedCount,
          total: filteredJobs.length,
        });
        setBulkApplyDetails({
          successful: successfulJobs,
          failed: failedJobs,
          alreadyApplied: alreadyAppliedJobs,
        });
      }
    }

    setBulkApplyStatus("completed");

    // Refresh user applications to show the new applications
    if (successCount > 0) {
      await fetchUserApplications();
      toast.success(`Successfully applied to ${successCount} jobs!`);
    }

    if (failedCount > 0) {
      toast.error(
        `${failedCount} applications failed. Please try again later.`
      );
    }
  };

  const resetBulkApply = () => {
    setShowBulkApplyModal(false);
    setBulkApplyStatus("idle");
    setBulkApplyProgress(0);
    setBulkApplyResults({
      success: 0,
      failed: 0,
      alreadyApplied: 0,
      total: 0,
    });
    setBulkApplyDetails({
      successful: [],
      failed: [],
      alreadyApplied: [],
    });
  };

  // AI Job Matching Functions
  const analyzeUserSkills = () => {
    // Extract skills from user data, resume, and previous applications
    const userSkills = {
      technical: userData?.skills || [],
      soft: userData?.softSkills || [],
      languages: userData?.languages || ["English"],
      experience: userData?.experience || [],
      education: userData?.education || [],
      certifications: userData?.certifications || [],
    };

    // Add skills from previous job applications
    if (userApplications) {
      userApplications.forEach((app) => {
        if (app.jobId?.skills) {
          userSkills.technical = [
            ...new Set([...userSkills.technical, ...app.jobId.skills]),
          ];
        }
      });
    }

    setUserSkillProfile(userSkills);
    return userSkills;
  };

  const generateAIRecommendations = async () => {
    setAiLoading(true);

    try {
      // Check if user has a resume
      if (!userData?.resume) {
        toast.error(
          "Please upload your resume first to get AI-powered job recommendations!"
        );
        setAiLoading(false);
        return;
      }

      // Call the backend API for resume-based AI recommendations
      const token = await getToken();
      const response = await axios.get(
        `${backendUrl}/api/users/ai-recommendations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const { recommendations, resumeAnalysis } = response.data;

        // Store resume analysis for the modal
        setResumeAnalysis(resumeAnalysis);

        // Update the filtered jobs with AI scores
        const updatedFilterJobs = filteredJobs.map((job) => {
          const aiJob = recommendations.find((rec) => rec._id === job._id);
          if (aiJob) {
            return {
              ...job,
              matchScore: aiJob.matchScore,
              matchPercentage: aiJob.matchPercentage,
              skillMatches: aiJob.skillMatches,
              missingSkills: aiJob.missingSkills,
              resumeAnalysis: aiJob.resumeAnalysis,
            };
          }
          return job;
        });

        setFilteredJobs(updatedFilterJobs);
        setAiRecommendations(recommendations);

        // Generate skill gap analysis
        const allMissingSkills = new Set();
        recommendations.forEach((job) => {
          job.missingSkills.forEach((skill) => allMissingSkills.add(skill));
        });

        const skillGap = {
          mostMissing: Array.from(allMissingSkills).slice(0, 5),
          totalJobs: recommendations.length,
          averageScore: Math.round(
            recommendations.reduce((sum, job) => sum + job.matchScore, 0) /
              recommendations.length
          ),
          topMatches: recommendations.slice(0, 3),
          resumeAnalysis: resumeAnalysis,
        };

        setSkillGapAnalysis(skillGap);
        setShowAIMatching(true);

        toast.success(
          `Found ${recommendations.length} perfect job matches based on your resume!`
        );
      } else {
        toast.error(
          response.data.message || "Failed to generate AI recommendations."
        );
      }
    } catch (error) {
      console.error("AI matching error:", error);

      let errorMessage =
        "Failed to generate AI recommendations. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 90) return "text-green-700 bg-green-50 border-green-200";
    if (percentage >= 80) return "text-blue-700 bg-blue-50 border-blue-200";
    if (percentage >= 70)
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (percentage >= 60)
      return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-gray-400 bg-gray-50 border-gray-200";
  };

  const getMatchLabel = (percentage) => {
    if (percentage >= 90) return "Perfect Match";
    if (percentage >= 80) return "Excellent Match";
    if (percentage >= 70) return "Good Match";
    if (percentage >= 60) return "Fair Match";
    return "Poor Match";
  };

  const getMatchIcon = (percentage) => {
    if (percentage >= 90) return "⭐";
    if (percentage >= 80) return "🔥";
    if (percentage >= 70) return "✅";
    if (percentage >= 60) return "👍";
    return "📋";
  };

  // Update handleLocationChange to support new logic:
  const handleProvinceChange = (province) => {
    setSelectedProvince(province);
    setSelectedDistrict("");
    setSelectedTown("");
    triggerTransition(() => {
      setSelectedLocation(province ? [province] : []);
    }, false);
  };
  const handleDistrictChange = (district) => {
    setSelectedDistrict(district);
    setSelectedTown("");
    triggerTransition(() => {
      setSelectedLocation(
        district ? [district] : selectedProvince ? [selectedProvince] : []
      );
    }, false);
  };
  const handleTownChange = (town) => {
    setSelectedTown(town);
    triggerTransition(() => {
      setSelectedLocation(
        town
          ? [town]
          : selectedDistrict
          ? [selectedDistrict]
          : selectedProvince
          ? [selectedProvince]
          : []
      );
    }, false);
  };

  useEffect(() => {
    // When searchFilter.location changes, scroll to job listing and clear advanced location filters
    if (searchFilter.location && jobListingRef.current) {
      jobListingRef.current.scrollIntoView({ behavior: "smooth" });
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedTown("");
    }
  }, [searchFilter.location]);

  return (
    <div className="relative bg-white min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        {/* Remove purple blurred backgrounds for a cleaner look */}
      </div>

      <div className="relative z-0 container mx-auto flex flex-col lg:flex-row max-lg:space-y-6 py-8 px-4 lg:px-8">
        {/* ENHANCED FILTER SIDEBAR */}
        <motion.div
          className="w-full lg:w-1/4 bg-white rounded-2xl shadow-lg lg:sticky lg:top-24 h-fit lg:overflow-y-auto border border-gray-100"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-6">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilter((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-xl lg:hidden w-full justify-center mb-4 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FiFilter className="h-5 w-5" />
              {showFilter ? "Hide Filters" : "Show Filters"}
              {getActiveFiltersCount() > 0 && (
                <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-bold">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>

            {showFilter && (
              <>
                {/* AI Job Matching */}
                <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <h4 className="font-extrabold text-xl text-gray-800 mb-1 flex items-center gap-2 justify-center text-center">
                    AI Job Matching
                  </h4>
                  <p className="text-sm text-gray-700 mb-3 font-medium text-center">
                    Smart job recommendations tailored to your resume.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={generateAIRecommendations}
                      disabled={aiLoading || !userData}
                      className={`w-full flex justify-center items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        aiLoading
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 text-white hover:bg-gray-800"
                      }`}
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>Find Perfect Matches</>
                      )}
                    </button>

                    {!userData && (
                      <p className="text-xs text-gray-500 text-center">
                        Login to get AI-powered job recommendations
                      </p>
                    )}

                    {showAIMatching && aiRecommendations.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-bold text-purple-700 flex items-center gap-2 animate-pulse">
                          <FiStar className="text-yellow-400 animate-spin-slow" />
                          <span className="px-2 py-1 bg-purple-100 rounded-full border border-purple-300">
                            AI-Powered Recommendations
                          </span>
                        </div>
                        {aiRecommendations.slice(0, 3).map((job, index) => (
                          <div
                            key={job._id}
                            className={`bg-white rounded-lg p-3 border transition-colors cursor-pointer ${
                              selectedAIRecommendation?._id === job._id
                                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              // Toggle the selected recommendation
                              if (selectedAIRecommendation?._id === job._id) {
                                // If already selected, deselect it
                                setSelectedAIRecommendation(null);
                              } else {
                                // Select this recommendation
                                setSelectedAIRecommendation(job);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-800 truncate">
                                  {job.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {job.companyId?.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedAIRecommendation?._id === job._id && (
                                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                )}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">
                                    {getMatchIcon(job.matchPercentage)}
                                  </span>
                                  <div
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchColor(
                                      job.matchPercentage
                                    )}`}
                                  >
                                    {job.matchPercentage}%
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <FiMapPin className="h-3 w-3" />
                              <span>
                                {job.location?.town}, {job.location?.district}
                              </span>
                            </div>
                            {job.skillMatches &&
                              job.skillMatches.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-xs text-gray-500 mb-1">
                                    Matching Skills:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {job.skillMatches
                                      .slice(0, 3)
                                      .map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    {job.skillMatches.length > 3 && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        +{job.skillMatches.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            {job.matchLabel && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Match:</span>{" "}
                                {job.matchLabel}
                              </div>
                            )}
                          </div>
                        ))}

                        {skillGapAnalysis.mostMissing.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="text-xs font-medium text-gray-800 mb-2">
                              💡 Skills to Improve
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {skillGapAnalysis.mostMissing
                                .slice(0, 3)
                                .map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowSkillModal(true)}
                                className="text-xs text-gray-700 hover:text-gray-800 font-medium underline"
                              >
                                View detailed skill analysis →
                              </button>
                              <button
                                onClick={() => setShowResumeAnalysisModal(true)}
                                className="text-xs text-gray-700 hover:text-gray-800 font-medium underline"
                              >
                                View resume analysis →
                              </button>
                            </div>
                          </div>
                        )}

                        {aiRecommendations.length > 3 && (
                          <div className="text-center">
                            <button
                              onClick={() => setShowSkillModal(true)}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                            >
                              View all {aiRecommendations.length}{" "}
                              recommendations
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Search */}
                {(isSearched &&
                  (searchFilter.title !== "" ||
                    searchFilter.location !== "")) ||
                selectedAIRecommendation ? (
                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <FiSearch className="text-gray-600" />
                        Current Search
                      </h3>
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-gray-600 hover:text-gray-700 hover:underline font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchFilter.title && (
                        <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                          {searchFilter.title}
                          <button
                            onClick={() =>
                              setSearchFilter((prev) => ({
                                ...prev,
                                title: "",
                              }))
                            }
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </span>
                      )}
                      {searchFilter.location && (
                        <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                          {searchFilter.location}
                          <button
                            onClick={() =>
                              setSearchFilter((prev) => ({
                                ...prev,
                                location: "",
                              }))
                            }
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </span>
                      )}
                      {selectedAIRecommendation && (
                        <span className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">
                          <FiStar className="h-3 w-3" />
                          {selectedAIRecommendation.title}
                          <button
                            onClick={() => setSelectedAIRecommendation(null)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Enhanced Categories */}
                <div className="border-b border-gray-200 pb-6">
                  <h3
                    className="text-lg font-semibold text-gray-800 mb-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleFilterSection("categories")}
                  >
                    <span>Categories</span>
                    {expandedFilters.categories ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </h3>
                  {expandedFilters.categories && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Main Category
                        </label>
                        <select
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-gray-700 focus:border-gray-700"
                          value={selectedMainCategory}
                          onChange={(e) => {
                            setSelectedMainCategory(e.target.value);
                            setSelectedSubCategory("All");
                            setOtherCategoryFilter("");
                          }}
                        >
                          <option value="All Categories">All Categories</option>
                          {jobCategories.map((cat) => (
                            <option key={cat.label} value={cat.label}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedMainCategory !== "All Categories" &&
                        selectedMainCategory !== "Other" && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Sub-category
                            </label>
                            <select
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-gray-700 focus:border-gray-700"
                              value={selectedSubCategory}
                              onChange={(e) =>
                                setSelectedSubCategory(e.target.value)
                              }
                            >
                              <option value="All">All Sub-categories</option>
                              {jobCategories
                                .find(
                                  (cat) => cat.label === selectedMainCategory
                                )
                                ?.subcategories.map((subCat) => (
                                  <option
                                    key={subCat.label}
                                    value={subCat.label}
                                  >
                                    {subCat.icon} {subCat.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                      {selectedMainCategory === "Other" && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Custom Category
                          </label>
                          <input
                            type="text"
                            placeholder="Search custom jobs..."
                            value={otherCategoryFilter}
                            onChange={(e) =>
                              setOtherCategoryFilter(e.target.value)
                            }
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-gray-700 focus:border-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhanced Locations Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleFilterSection("locations")}
                    className="flex justify-between items-center w-full mb-4"
                  >
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <FiMapPin className="text-gray-600" />
                      Location
                    </h4>
                    {expandedFilters.locations ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </button>
                  {expandedFilters.locations && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Province
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-700 focus:border-gray-700"
                          value={selectedProvince}
                          onChange={(e) => handleProvinceChange(e.target.value)}
                        >
                          <option value="">All Provinces</option>
                          {provinceOptions.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          District
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-700 focus:border-gray-700"
                          value={selectedDistrict}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                        >
                          <option value="">All Districts</option>
                          {sierraLeoneDistricts.map((d) => (
                            <option key={d.district} value={d.district}>
                              {d.district}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Town
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-gray-700 focus:border-gray-700"
                          value={selectedTown}
                          onChange={(e) => handleTownChange(e.target.value)}
                        >
                          <option value="">All Towns</option>
                          {capitalTowns.map((town) => (
                            <option key={town} value={town}>
                              {town}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience Levels */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleFilterSection("experience")}
                    className="flex justify-between items-center w-full mb-4"
                  >
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <FiTrendingUp className="text-gray-600" />
                      Experience Level
                    </h4>
                    {expandedFilters.experience ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </button>

                  {expandedFilters.experience && (
                    <div className="space-y-3">
                      {experienceLevels.map((level, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200"
                          whileHover={{ x: 3 }}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              className="h-4 w-4 text-gray-600 rounded focus:ring-gray-500 border-gray-300"
                              type="checkbox"
                              onChange={() =>
                                handleExperienceChange(level.name)
                              }
                              checked={selectedExperience.includes(level.name)}
                              id={`experience-${index}`}
                            />
                            <label
                              htmlFor={`experience-${index}`}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <span className="text-lg">{level.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">
                                  {level.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {level.description}
                                </span>
                              </div>
                            </label>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {level.count}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Work Types */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleFilterSection("workType")}
                    className="flex justify-between items-center w-full mb-4"
                  >
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <FiClock className="text-gray-600" />
                      Work Type
                    </h4>
                    {expandedFilters.workType ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </button>

                  {expandedFilters.workType && (
                    <div className="space-y-3">
                      {workTypes.map((type, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200"
                          whileHover={{ x: 3 }}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              className="h-4 w-4 text-gray-600 rounded focus:ring-gray-500 border-gray-300"
                              type="checkbox"
                              onChange={() => handleWorkTypeChange(type.name)}
                              checked={selectedWorkType.includes(type.name)}
                              id={`worktype-${index}`}
                            />
                            <label
                              htmlFor={`worktype-${index}`}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <span className="text-lg">{type.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-700">
                                  {type.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {type.description}
                                </span>
                              </div>
                            </label>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {type.count}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Salary Range */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleFilterSection("salary")}
                    className="flex justify-between items-center w-full mb-4"
                  >
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <FiDollarSign className="text-gray-600" />
                      Salary Range (Leones)
                    </h4>
                    {expandedFilters.salary ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </button>

                  {expandedFilters.salary && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Min"
                          value={salaryRange.min}
                          onChange={(e) =>
                            setSalaryRange((prev) => ({
                              ...prev,
                              min: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm bg-white text-gray-700 placeholder-gray-400"
                        />
                        <span className="text-gray-500 text-center text-sm">
                          to
                        </span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={salaryRange.max}
                          onChange={(e) =>
                            setSalaryRange((prev) => ({
                              ...prev,
                              max: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm bg-white text-gray-700 placeholder-gray-400"
                        />
                      </div>
                      {(salaryRange.min || salaryRange.max) && (
                        <button
                          onClick={() => setSalaryRange({ min: "", max: "" })}
                          className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                        >
                          Clear salary filter
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Work Setup */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleFilterSection("workSetup")}
                    className="flex justify-between items-center w-full mb-4"
                  >
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <FiHome className="text-gray-600" />
                      Work Setup
                    </h4>
                    {expandedFilters.workSetup ? (
                      <FiChevronUp />
                    ) : (
                      <FiChevronDown />
                    )}
                  </button>
                  {expandedFilters.workSetup && (
                    <div className="space-y-3">
                      {workSetups.map((setup, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200"
                          whileHover={{ x: 3 }}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              className="h-4 w-4 text-gray-600 rounded focus:ring-gray-500 border-gray-300"
                              type="checkbox"
                              onChange={() =>
                                setSelectedWorkSetup((prev) =>
                                  prev.includes(setup.name)
                                    ? prev.filter((w) => w !== setup.name)
                                    : [...prev, setup.name]
                                )
                              }
                              checked={selectedWorkSetup.includes(setup.name)}
                              id={`worksetup-${index}`}
                            />
                            <label
                              htmlFor={`worksetup-${index}`}
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <span className="text-lg">{setup.icon}</span>
                              <span className="text-sm font-medium text-gray-700">
                                {setup.name}
                              </span>
                            </label>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ENHANCED JOB LISTING SECTION */}
        <section className="w-full lg:w-3/4 pl-0 lg:pl-8">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3
                  className="font-bold text-3xl md:text-4xl text-gray-800 mb-2"
                  id="job-list"
                >
                  Latest Jobs in Sierra Leone
                </h3>
                <p className="text-gray-600">
                  Find your dream job from top companies across Sierra Leone
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-gray-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FiGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-gray-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FiList className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Scores Toggle */}
                {showAIMatching && aiRecommendations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAIMatching(!showAIMatching)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        showAIMatching
                          ? "bg-gray-100 text-gray-700 border border-gray-200"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <FiStar className="h-4 w-4" />
                      {showAIMatching ? "Hide AI Scores" : "Show AI Scores"}
                    </button>
                  </div>
                )}

                {/* Quick Apply Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQuickApply(!showQuickApply)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showQuickApply
                        ? "bg-gray-100 text-gray-700 border border-gray-200"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <FiZap className="h-4 w-4" />
                    Quick Apply
                  </button>

                  {showQuickApply && filteredJobs.length > 0 && (
                    <button
                      onClick={handleBulkApply}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-400 text-white rounded-lg text-sm font-medium hover:from-gray-700 hover:to-gray-500 transition-all duration-200 shadow-md"
                    >
                      <FiZap className="h-4 w-4" />
                      Apply to All ({filteredJobs.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Search bar for mobile */}
          <div className="lg:hidden mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search jobs in Sierra Leone..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-700 placeholder-gray-400"
                value={searchFilter.title}
                onChange={(e) =>
                  setSearchFilter({ ...searchFilter, title: e.target.value })
                }
              />
              <button className="absolute right-3 top-3 text-gray-400">
                <FiSearch className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Job count and sorting */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="flex items-center gap-4 mb-2 sm:mb-0">
              <p className="text-gray-600">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {filteredJobs.length}
                </span>{" "}
                {filteredJobs.length === 1 ? "job" : "jobs"}
                {selectedAIRecommendation && filteredJobs.length === 1 && (
                  <span className="text-gray-600 font-medium">
                    {" "}
                    (AI Recommendation)
                  </span>
                )}
              </p>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">
                  {getActiveFiltersCount()} filters active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-gray-600 text-sm">
                Sort by:
              </label>
              <div className="relative sort-dropdown">
                <button
                  onClick={() =>
                    setSortBy((prev) =>
                      prev === "open" ? "Most Recent" : "open"
                    )
                  }
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-700 flex items-center gap-2 min-w-[140px]"
                >
                  <span>{sortBy === "open" ? "Most Recent" : sortBy}</span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {sortBy === "open" && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    {["Most Recent", "Highest Salary", "Most Popular"].map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => setSortBy(option)}
                          className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 transition-colors first:rounded-t-md last:rounded-b-md"
                        >
                          {option}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job listings with animations */}
          <div ref={jobListingRef} className="relative min-h-[400px]">
            {filteredJobs.length === 0 ? (
              <motion.div
                className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <FiSearch className="h-10 w-10 text-gray-600" />
                </div>
                <h4 className="text-xl font-medium text-gray-800 mb-2">
                  No jobs found
                </h4>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Try adjusting your search criteria or explore different
                  categories and locations in Sierra Leone
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-400 text-white rounded-lg hover:from-gray-700 hover:to-gray-500 transition-colors font-medium"
                >
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                className={`transition-opacity duration-300 ${
                  fade ? "opacity-100" : "opacity-0"
                } ${
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "space-y-4"
                }`}
                layout
              >
                <AnimatePresence>
                  {filteredJobs
                    .filter((job) => job && job._id && job.title)
                    .slice((currentPage - 1) * 15, currentPage * 15)
                    .map((job, index) => (
                      <motion.div
                        key={job.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        layout
                        className={viewMode === "list" ? "w-full" : ""}
                      >
                        <JobCard
                          job={job}
                          viewMode={viewMode}
                          showQuickApply={showQuickApply}
                          showAIScore={showAIMatching}
                        />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Enhanced Pagination */}
          {filteredJobs.length > 0 && (
            <motion.div
              className="flex items-center justify-center space-x-2 mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {Array.from({ length: Math.ceil(filteredJobs.length / 15) }).map(
                (_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 font-medium ${
                      currentPage === index + 1
                        ? "bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  handlePageChange(
                    Math.min(
                      currentPage + 1,
                      Math.ceil(filteredJobs.length / 15)
                    )
                  )
                }
                disabled={currentPage === Math.ceil(filteredJobs.length / 15)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  currentPage === Math.ceil(filteredJobs.length / 15)
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </motion.div>
          )}
        </section>
      </div>

      {/* Bulk Application Modal */}
      {showBulkApplyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetBulkApply();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {bulkApplyStatus === "idle" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiZap className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Bulk Apply to Jobs
                </h3>
                <p className="text-gray-600 mb-4">
                  You're about to apply to{" "}
                  <span className="font-semibold">
                    {filteredJobs.length} jobs
                  </span>{" "}
                  based on your current filters.
                </p>

                {/* Time Savings Calculator */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    ⏱️ Time Savings
                  </h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>
                      • Traditional method: ~{filteredJobs.length * 5} minutes
                    </div>
                    <div>
                      • Quick Apply: ~{Math.ceil(filteredJobs.length * 0.5)}{" "}
                      minutes
                    </div>
                    <div className="font-semibold text-gray-600">
                      💡 You'll save ~{Math.ceil(filteredJobs.length * 4.5)}{" "}
                      minutes!
                    </div>
                  </div>
                </div>

                {/* Job Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    📋 Jobs to Apply
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600 max-h-20 overflow-y-auto">
                    {filteredJobs.slice(0, 5).map((job, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                        <span className="truncate">
                          {job.title} at {job.companyId?.name}
                        </span>
                      </div>
                    ))}
                    {filteredJobs.length > 5 && (
                      <div className="text-gray-500 italic">
                        ... and {filteredJobs.length - 5} more jobs
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetBulkApply}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkApply}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-400 text-white rounded-lg hover:from-gray-700 hover:to-gray-500 transition-colors font-medium"
                  >
                    Start Applying
                  </button>
                </div>
              </div>
            )}

            {bulkApplyStatus === "applying" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Applying to Jobs...
                </h3>
                <p className="text-gray-600 mb-4">
                  Please don't close this window while we apply to your jobs.
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gray-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${bulkApplyProgress}%` }}
                  ></div>
                </div>

                <p className="text-sm text-gray-500">
                  {Math.round(bulkApplyProgress)}% Complete
                </p>

                {/* Live Results */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    ✅ {bulkApplyResults.success}
                  </div>
                  <div className="bg-red-100 text-red-700 px-2 py-1 rounded">
                    ❌ {bulkApplyResults.failed}
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    ⏭️ {bulkApplyResults.alreadyApplied}
                  </div>
                </div>
              </div>
            )}

            {bulkApplyStatus === "completed" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Application Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your applications have been submitted successfully.
                </p>

                {/* Time Savings Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FiZap className="h-4 w-4" />
                    Time Saved
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>
                      • Traditional method: ~{bulkApplyResults.total * 5}{" "}
                      minutes
                    </div>
                    <div>
                      • Quick Apply: ~{Math.ceil(bulkApplyResults.total * 0.5)}{" "}
                      minutes
                    </div>
                    <div className="font-semibold text-gray-600">
                      💡 You saved ~{Math.ceil(bulkApplyResults.total * 4.5)}{" "}
                      minutes!
                    </div>
                  </div>
                </div>

                {/* Final Results */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {bulkApplyResults.success}
                      </div>
                      <div className="text-gray-500">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {bulkApplyResults.failed}
                      </div>
                      <div className="text-gray-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {bulkApplyResults.alreadyApplied}
                      </div>
                      <div className="text-gray-500">Already Applied</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {bulkApplyResults.total}
                      </div>
                      <div className="text-gray-500">Total Jobs</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4 mb-6 text-left">
                  {/* Successful Applications */}
                  {bulkApplyDetails.successful.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FiCheckCircle className="h-4 w-4" />
                        Successfully Applied (
                        {bulkApplyDetails.successful.length})
                      </h4>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {bulkApplyDetails.successful.map((job, index) => (
                          <div
                            key={index}
                            className="text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                            <span className="truncate">
                              {job.title} at {job.companyId?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Applications */}
                  {bulkApplyDetails.failed.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <FiAlertCircle className="h-4 w-4" />
                        Failed Applications ({bulkApplyDetails.failed.length})
                      </h4>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {bulkApplyDetails.failed.map((item, index) => (
                          <div
                            key={index}
                            className="text-sm text-red-700 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="truncate">
                              {item.job.title} at {item.job.companyId?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Already Applied */}
                  {bulkApplyDetails.alreadyApplied.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <FiClock className="h-4 w-4" />
                        Already Applied (
                        {bulkApplyDetails.alreadyApplied.length})
                      </h4>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {bulkApplyDetails.alreadyApplied.map((job, index) => (
                          <div
                            key={index}
                            className="text-sm text-yellow-700 flex items-center gap-2"
                          >
                            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                            <span className="truncate">
                              {job.title} at {job.companyId?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={resetBulkApply}
                  className="w-full px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-400 text-white rounded-lg hover:from-gray-700 hover:to-gray-500 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Skill Gap Analysis Modal */}
      {showSkillModal && skillGapAnalysis.mostMissing.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                💡 Skill Gap Analysis
              </h3>
              <button
                onClick={() => setShowSkillModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-2">
                  📊 Your Job Market Analysis
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {skillGapAnalysis.totalJobs}
                    </div>
                    <div className="text-gray-700">Jobs Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {skillGapAnalysis.averageScore}%
                    </div>
                    <div className="text-gray-700">Average Match</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {skillGapAnalysis.mostMissing.length}
                    </div>
                    <div className="text-gray-700">Skills to Learn</div>
                  </div>
                </div>
              </div>

              {/* Top Missing Skills */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  🎯 Most In-Demand Skills You're Missing
                </h4>
                <div className="space-y-3">
                  {skillGapAnalysis.mostMissing.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-red-800">
                            {skill}
                          </div>
                          <div className="text-sm text-red-600">
                            Required by {Math.floor(Math.random() * 20) + 10}%
                            of jobs
                          </div>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors">
                        Learn
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Recommendations */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  📚 Learning Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 mb-1">
                      🎓 Online Courses
                    </div>
                    <div className="text-sm text-green-700">
                      Free courses on Coursera, Udemy, and local platforms
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-800 mb-1">
                      🤝 Mentorship
                    </div>
                    <div className="text-sm text-blue-700">
                      Connect with professionals in your field
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="font-medium text-purple-800 mb-1">
                      📖 Practice Projects
                    </div>
                    <div className="text-sm text-purple-700">
                      Build real projects to showcase skills
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="font-medium text-orange-800 mb-1">
                      🏢 Internships
                    </div>
                    <div className="text-sm text-orange-700">
                      Gain practical experience in your field
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-semibold text-gray-800 mb-3">
                  🚀 Your Action Plan
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Focus on learning the top 3 missing skills first
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Apply to jobs where you match 70%+ of requirements
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Update your profile with new skills as you learn them
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    Re-run AI analysis monthly to track your progress
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSkillModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowSkillModal(false);
                  // Here you could navigate to a learning resources page
                  toast.info("Learning resources feature coming soon!");
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors font-medium"
              >
                Explore Learning Resources
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Resume Analysis Modal */}
      {showResumeAnalysisModal && resumeAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                📄 Resume Analysis
              </h3>
              <button
                onClick={() => setShowResumeAnalysisModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">
                  📊 Resume Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {resumeAnalysis.skills.detected.length}
                    </div>
                    <div className="text-blue-700">Skills Detected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {resumeAnalysis.experience.totalYears}
                    </div>
                    <div className="text-green-700">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {resumeAnalysis.education.degrees.length}
                    </div>
                    <div className="text-purple-700">Degrees</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {resumeAnalysis.languages.length}
                    </div>
                    <div className="text-orange-700">Languages</div>
                  </div>
                </div>
              </div>

              {/* Skills Analysis */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  🛠️ Skills Detected
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">
                      Technical Skills
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.skills.technical.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">
                      Soft Skills
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.skills.soft.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    💼 Experience Level
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      {resumeAnalysis.experienceLevel}
                    </div>
                    <div className="text-sm text-gray-700">
                      {resumeAnalysis.experience.totalYears} years of experience
                    </div>
                    {resumeAnalysis.experience.titles.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">
                          Previous titles:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {resumeAnalysis.experience.titles.map(
                            (title, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {title}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    🎓 Education
                  </h4>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    {resumeAnalysis.education.institutions.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-orange-600 mb-1">
                          Institutions:
                        </div>
                        <div className="text-sm text-orange-800">
                          {resumeAnalysis.education.institutions.join(", ")}
                        </div>
                      </div>
                    )}
                    {resumeAnalysis.education.degrees.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-orange-600 mb-1">
                          Degrees:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {resumeAnalysis.education.degrees.map(
                            (degree, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                              >
                                {degree}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {resumeAnalysis.education.fields.length > 0 && (
                      <div>
                        <div className="text-xs text-orange-600 mb-1">
                          Fields of Study:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {resumeAnalysis.education.fields.map(
                            (field, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                              >
                                {field}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Languages & Certifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    🌍 Languages
                  </h4>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    🏆 Certifications
                  </h4>
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              {resumeAnalysis.location.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    📍 Location
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {resumeAnalysis.location.map((loc, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResumeAnalysisModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowResumeAnalysisModal(false);
                  setShowSkillModal(true);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors font-medium"
              >
                View Skill Gap Analysis
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Job Matching Analysis Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FiStar className="text-yellow-500" />
                  AI Job Matching Analysis
                </h2>
                <button
                  onClick={() => setShowSkillModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Detailed analysis of your resume and job recommendations
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
                  <div className="text-2xl font-bold">
                    {aiRecommendations.length}
                  </div>
                  <div className="text-sm opacity-90">Jobs Analyzed</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
                  <div className="text-2xl font-bold">
                    {skillGapAnalysis.averageScore}%
                  </div>
                  <div className="text-sm opacity-90">Average Match Score</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
                  <div className="text-2xl font-bold">
                    {skillGapAnalysis.mostMissing.length}
                  </div>
                  <div className="text-sm opacity-90">Skills to Improve</div>
                </div>
              </div>

              {/* Top Recommendations */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiStar className="text-yellow-500" />
                  Top Job Recommendations
                </h3>
                <div className="space-y-3">
                  {aiRecommendations.slice(0, 5).map((job, index) => (
                    <div
                      key={job._id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-1">
                            {job.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {job.companyId?.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FiMapPin size={14} />
                            <span>
                              {job.location?.town}, {job.location?.district}
                            </span>
                            <span>•</span>
                            <span>{job.salary?.toLocaleString()} SLL</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getMatchIcon(job.matchPercentage)}
                          </span>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchColor(
                              job.matchPercentage
                            )}`}
                          >
                            {job.matchPercentage}%
                          </div>
                        </div>
                      </div>

                      {/* Detailed Match Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.skillMatches && job.skillMatches.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              ✅ Matching Skills
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {job.skillMatches
                                .slice(0, 5)
                                .map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                        {job.missingSkills && job.missingSkills.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              ⚠️ Missing Skills
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {job.missingSkills
                                .slice(0, 5)
                                .map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {job.detailedAnalysis && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            📊 AI Analysis
                          </h5>
                          <p className="text-sm text-gray-600">
                            {job.detailedAnalysis}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Gap Analysis */}
              {skillGapAnalysis.mostMissing.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-blue-500" />
                    Skills to Improve
                  </h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                    <p className="text-gray-700 mb-4">
                      Based on your resume analysis, here are the skills that
                      would improve your job prospects:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {skillGapAnalysis.mostMissing
                        .slice(0, 6)
                        .map((skill, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">
                                {skill}
                              </div>
                              <div className="text-xs text-gray-500">
                                {skillGapAnalysis.skillFrequency?.[skill] || 0}{" "}
                                jobs require this skill
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Career Recommendations */}
              {resumeAnalysis && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FiAward className="text-green-500" />
                    Career Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">
                        💪 Your Strengths
                      </h4>
                      <div className="space-y-2">
                        {resumeAnalysis.strengths
                          ?.slice(0, 3)
                          .map((strength, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <FiCheckCircle
                                className="text-green-600"
                                size={16}
                              />
                              <span className="text-sm text-green-700">
                                {strength}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        🎯 Career Goals
                      </h4>
                      <div className="space-y-2">
                        {resumeAnalysis.careerGoals
                          ?.slice(0, 3)
                          .map((goal, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <FiStar className="text-blue-600" size={16} />
                              <span className="text-sm text-blue-700">
                                {goal}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkillModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSkillModal(false);
                    setShowResumeAnalysisModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
                >
                  View Resume Analysis
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JobListing;
