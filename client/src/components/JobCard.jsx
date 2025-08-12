import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiBookmark,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiZap,
  FiStar,
  FiAlertCircle,
  FiHeart,
  FiEye,
  FiWifi,
  FiCheckCircle,
  FiCopy,
  FiMail,
  FiLinkedin,
  FiTwitter,
  FiFacebook,
  FiX,
  FiMessageCircle,
} from "react-icons/fi";
import { MdShare } from "react-icons/md";
import { Languages, Globe, Volume2, VolumeX, Banknote } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

const JobCard = ({
  job,
  viewMode = "grid",
  showQuickApply = false,
  showAIScore = false,
  highlightSelectedAI = false,
  selectedAIRecommendationId = null,
}) => {
  console.log("JobCard description:", job.description);
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { backendUrl, userData, userApplications, fetchUserApplications } =
    useContext(AppContext);
  const [isSaved, setIsSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [manualStop, setManualStop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const manualStopRef = useRef(false);
  const shareMenuRef = useRef(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Check if already applied
  const isAlreadyApplied = userApplications?.some(
    (app) => app.jobId?._id === job._id
  );

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target)
      ) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if job is saved on component mount
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!userData) return;

      try {
        const token = await getToken();
        const response = await axios.get(
          `${backendUrl}/api/users/check-saved/${job._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setIsSaved(response.data.isSaved);
        }
      } catch (error) {
        console.error("Error checking if job is saved:", error);
      }
    };

    checkIfSaved();
  }, [job._id, userData, backendUrl, getToken]);

  // Handle save/unsave job
  const handleSaveJob = async () => {
    if (!user) {
      toast.error("Please login to save jobs.");
      return;
    }

    // Check if userData is loaded, if not, try to fetch it
    if (!userData) {
      try {
        const { fetchUserData } = useContext(AppContext);
        await fetchUserData();
        // Wait a moment for the state to update
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    if (!userData) {
      toast.error(
        "Please complete your profile before saving jobs. If the issue persists, please refresh the page."
      );
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      const endpoint = isSaved ? "unsave-job" : "save-job";

      const response = await axios.post(
        `${backendUrl}/api/users/${endpoint}`,
        { jobId: job._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setIsSaved(!isSaved);
        toast.success(
          isSaved ? "Job removed from saved jobs" : "Job saved successfully"
        );
      } else {
        toast.error(response.data.message || "Failed to save job");
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
      toast.error("Error saving job. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get the appropriate title and description based on language preference
  const getDisplayTitle = () => {
    if (preferredLanguage === "krio" && job.titleKrio) {
      return job.titleKrio;
    }
    if (preferredLanguage === "en" && job.titleEnglish) {
      return job.titleEnglish;
    }
    return job.title || "Job Title";
  };

  const getDisplayDescription = () => {
    if (preferredLanguage === "krio" && job.descriptionKrio) {
      return job.descriptionKrio;
    }
    if (preferredLanguage === "en" && job.descriptionEnglish) {
      return job.descriptionEnglish;
    }
    return job.description || "No description provided";
  };

  // Helper function to get recruiter information
  const getRecruiterInfo = () => {
    if (job.recruiterId) {
      const recruiter = job.recruiterId;
      return {
        name:
          recruiter.fullName ||
          recruiter.contactPersonName ||
          recruiter.displayName ||
          "Recruiter",
        image: recruiter.logo,
        initials: recruiter.initials,
        type: recruiter.recruiterType,
      };
    }
    // Fallback to company info if no recruiter (for backward compatibility)
    if (job.companyId) {
      return {
        name: job.companyId.name || "Company",
        image: job.companyId.image,
        initials: job.companyId.name
          ? job.companyId.name
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")
              .toUpperCase()
          : "C",
        type: "Company",
      };
    }
    // Default fallback
    return {
      name: "Recruiter",
      image: null,
      initials: "R",
      type: "Recruiter",
    };
  };

  // Check if job has translations
  const hasTranslations =
    job.titleKrio ||
    job.titleEnglish ||
    job.descriptionKrio ||
    job.descriptionEnglish;

  // Function to remove HTML tags from description
  const stripHtmlTags = (html) => {
    if (!html) return "No description provided";
    return html.replace(/<[^>]*>?/gm, "");
  };

  // Function to calculate time passed since posting
  const getTimePassed = (dateString) => {
    if (!dateString) return "Recently posted";

    const postedDate = new Date(dateString);
    const currentDate = new Date();
    const timeDiff = currentDate - postedDate;

    // Calculate time differences
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    return "Just now";
  };

  // Salary formatting function with Sierra Leone context
  const formatSalary = (salary) => {
    if (!salary) return "Salary available";
    if (typeof salary === "string") return salary;
    if (typeof salary === "number") {
      return `Le ${salary.toLocaleString()}`;
    }
    if (typeof salary === "object") {
      if (salary.min && salary.max) {
        return `Le ${salary.min.toLocaleString()} - Le ${salary.max.toLocaleString()}`;
      }
      if (salary.amount) {
        return `Le ${salary.amount.toLocaleString()}`;
      }
    }
    return "Salary available";
  };

  // Check if job is urgent
  const isUrgent =
    job.urgent ||
    job.priority === "high" ||
    job.title?.toLowerCase().includes("urgent");

  // Simplified location display for the card
  const displayTown = job.location?.town || "Location";

  // AI Match Score functions (match JobListing palette)
  const getMatchColor = (percentage) => {
    if (percentage >= 90) return "text-green-700 bg-green-50 border-green-200";
    if (percentage >= 80) return "text-blue-700 bg-blue-50 border-blue-200";
    if (percentage >= 70) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (percentage >= 60) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-gray-500 bg-gray-50 border-gray-200";
  };

  const getMatchLabel = (percentage) => {
    if (percentage >= 90) return "Perfect Match";
    if (percentage >= 80) return "Excellent Match";
    if (percentage >= 70) return "Good Match";
    if (percentage >= 60) return "Fair Match";
    return "Poor Match";
  };

  // Audio narration function
  const handleAudioNarration = () => {
    // Always cancel any ongoing speech before starting
    window.speechSynthesis.cancel();
    if (isPlayingAudio) {
      manualStopRef.current = true;
      setManualStop(true);
      setIsPlayingAudio(false);
      toast.info("Audio narration stopped.");
      return;
    }
    manualStopRef.current = false;
    setManualStop(false);

    // Create the narration text
    const title = getDisplayTitle();
    const description = stripHtmlTags(getDisplayDescription());
    const recruiter = getRecruiterInfo().name;
    const location = displayTown;
    const salary = formatSalary(job.salary);
    const level = job.level || "Level not specified";
    const category = job.category || "Category not specified";
    const timePosted = getTimePassed(job.date);

    if (preferredLanguage === "krio") {
      // Format salary with "leones" after the amount for proper Krio speech
      const salaryForSpeech =
        salary.replace(/Le\s*/g, "").replace(/,/g, "") + " leones";
      const narrationText = `Dis nah woke way ${recruiter} post. This woke dae look for person way nah ${title}. Di woke dae nah ${location}. Di salary nah ${salaryForSpeech} for month. Dis nah ${level} position pa ${category} woke. Di description for this woke nah: ${description}. Dem post dis job ${timePosted}.`;

      // Create speech synthesis with proper pronunciation
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.lang = "en-US";
      utterance.rate = 0.6; // Even slower for better Krio pronunciation
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set up event handlers
      utterance.onstart = () => {
        setIsPlayingAudio(true);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
        manualStopRef.current = false;
        setManualStop(false);
      };

      utterance.onerror = (event) => {
        // Only show error if it's not a manual stop
        if (!manualStopRef.current) {
          setIsPlayingAudio(false);
          toast.error("Audio narration failed. Please try again.");
        } else {
          setIsPlayingAudio(false);
        }
        manualStopRef.current = false;
        setManualStop(false);
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    } else {
      // Format salary with "leones" after the amount for proper English speech
      const salaryForSpeech =
        salary.replace(/Le\s*/g, "").replace(/,/g, "") + " leones";
      const narrationText = `This is a job posted by ${recruiter}. The job title is ${title}. The job is located in ${location}. The salary is ${salaryForSpeech} per month. This is a ${level} position in ${category}. The job description is: ${description}. This job was posted ${timePosted}.`;

      // Create speech synthesis
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set up event handlers
      utterance.onstart = () => {
        setIsPlayingAudio(true);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
        manualStopRef.current = false;
        setManualStop(false);
      };

      utterance.onerror = (event) => {
        // Only show error if it's not a manual stop
        if (!manualStopRef.current) {
          setIsPlayingAudio(false);
          toast.error("Audio narration failed. Please try again.");
        } else {
          setIsPlayingAudio(false);
        }
        manualStopRef.current = false;
        setManualStop(false);
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleQuickApply = async () => {
    if (!user) {
      toast.error("Please login to apply for jobs.");
      return;
    }

    // Check if userData is loaded, if not, try to fetch it
    if (!userData) {
      try {
        // Import fetchUserData from AppContext
        const { fetchUserData } = useContext(AppContext);
        await fetchUserData();
        // Wait a moment for the state to update
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    // Check again after attempting to fetch userData
    if (!userData) {
      toast.error(
        "Please complete your profile before applying. If the issue persists, please refresh the page."
      );
      return;
    }

    if (!userData.resume) {
      setShowResumeModal(true);
      return;
    }

    if (isAlreadyApplied) {
      toast.info("You have already applied for this job.");
      return;
    }

    // Always apply directly when "Apply Now" button is clicked
    setIsApplying(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${backendUrl}/api/users/apply`,
        { jobId: job._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Successfully applied to ${job.title}!`);

        // Send notification email (optional)
        try {
          await axios.post(`${backendUrl}/api/application/apply`, {
            applicantEmail: userData.email,
            jobPosterEmail: job.recruiterId?.email || job.companyId?.email,
            jobTitle: job.title,
          });
        } catch (emailErr) {
          console.error("Failed to send notification email:", emailErr);
        }

        // Refresh user applications
        try {
          await fetchUserApplications();
        } catch (error) {
          console.error("Failed to refresh applications:", error);
          // Don't show error to user since application was successful
        }
      } else {
        toast.error(response.data.message || "Failed to apply for the job.");
      }
    } catch (error) {
      console.error("Error applying for job:", error);

      let errorMessage = "Error applying for the job. Please try again.";

      if (error.response) {
        // Server responded with error status
        errorMessage =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        errorMessage = "Network error - please check your connection";
      }

      toast.error(errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  // Share functionality
  const getJobUrl = () => {
    return `${window.location.origin}/apply-job/${job._id}`;
  };

  const getJobTitle = () => {
    return `${job.title} by ${getRecruiterInfo().name}`;
  };

  const getJobDescription = () => {
    const description = stripHtmlTags(job.description || "");
    return `${description.substring(0, 100)}${
      description.length > 100 ? "..." : ""
    }`;
  };

  const handleCopyLink = async () => {
    setIsCopying(true);
    try {
      const jobUrl = getJobUrl();

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(jobUrl);
        toast.success("Job link copied to clipboard!");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = jobUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand("copy");
          toast.success("Job link copied to clipboard!");
        } catch (err) {
          console.error("Fallback: Oops, unable to copy", err);
          toast.error("Failed to copy link. Please try again.");
        }

        document.body.removeChild(textArea);
      }

      setShowShareMenu(false);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link. Please try again.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this job: ${getJobTitle()}`);
    const body = encodeURIComponent(
      `Hi,\n\nI found this job that might interest you:\n\n${getJobTitle()}\n\n${getJobDescription()}\n\nView the job: ${getJobUrl()}\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowShareMenu(false);
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(getJobUrl());
    const title = encodeURIComponent(getJobTitle());
    const summary = encodeURIComponent(getJobDescription());
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`
    );
    setShowShareMenu(false);
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `Check out this job: ${getJobTitle()} ${getJobUrl()}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
    setShowShareMenu(false);
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(getJobUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out this job: ${getJobTitle()} ${getJobUrl()}`
    );
    window.open(`https://wa.me/?text=${text}`);
    setShowShareMenu(false);
  };

  const isSelectedAI =
    !!highlightSelectedAI && !!selectedAIRecommendationId && selectedAIRecommendationId === job._id;

  // Compute a safe percentage for display
  const safeMatchPercentage =
    typeof job.matchPercentage === "number"
      ? Math.round(job.matchPercentage)
      : typeof job.matchScore === "number"
      ? Math.round(job.matchScore)
      : null;

  return (
    <>
      <motion.div
        id={`job-card-${job._id}`}
        className={`relative ${viewMode === "list" ? "w-full" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        data-job-id={job._id}
        aria-selected={isSelectedAI ? "true" : "false"}
      >
        <div
          className={`bg-white border rounded-lg overflow-hidden transition-all duration-300 ${
            isSelectedAI
              ? "ring-2 ring-gray-300 border-gray-500 bg-gray-50 shadow-md"
              : isHovered
              ? "border-[#374151] z-10"
              : "border-gray-200 shadow-sm"
          } ${viewMode === "list" ? "flex" : ""}`}
        >
          {/* AI Match Score Badge */}
          {showAIScore && safeMatchPercentage !== null && safeMatchPercentage >= 60 && (
            <div className="absolute top-2 right-2 z-20">
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getMatchColor(
                  safeMatchPercentage
                )}`}
              >
                <div className="flex items-center gap-1">
                  <FiStar className="h-3 w-3" />
                  {safeMatchPercentage}%
                </div>
                <div className="text-xs opacity-75">
                  {getMatchLabel(safeMatchPercentage)}
                </div>
              </div>
            </div>
          )}

          {/* Urgent job indicator */}
          {isUrgent && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold py-1 px-3 text-center z-10">
              <FiAlertCircle className="inline w-3 h-3 mr-1" />
              URGENT - Apply Now!
            </div>
          )}

          {/* Header with company info */}
          <div
            className={`p-6 pb-4 pr-6 ${viewMode === "list" ? "flex-1" : ""}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <motion.div className="w-14 h-14 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                  {getRecruiterInfo().image ? (
                    <img
                      className="w-full h-full object-cover"
                      src={getRecruiterInfo().image}
                      alt={getRecruiterInfo().name}
                      onError={(e) => {
                        console.log(
                          "Image failed to load:",
                          getRecruiterInfo().image
                        );
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                      onLoad={(e) => {
                        console.log(
                          "Image loaded successfully:",
                          getRecruiterInfo().image
                        );
                        e.target.nextSibling.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gray-700 text-white text-lg font-bold flex items-center justify-center ${
                      getRecruiterInfo().image ? "hidden" : ""
                    }`}
                  >
                    {getRecruiterInfo().initials
                      ? getRecruiterInfo().initials
                      : getRecruiterInfo().name?.charAt(0)
                      ? getRecruiterInfo().name.charAt(0)
                      : ""}
                  </div>
                </motion.div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    {getDisplayTitle()}
                  </h4>
                  <p className="text-gray-500 text-sm">
                    {getRecruiterInfo().name}
                  </p>

                  {/* Language Toggle */}
                  {hasTranslations && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreferredLanguage("en");
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            preferredLanguage === "en"
                              ? "bg-white text-gray-700 shadow-sm"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreferredLanguage("krio");
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            preferredLanguage === "krio"
                              ? "bg-white text-gray-700 shadow-sm"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          KRIO
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudioNarration();
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isPlayingAudio
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={
                          isPlayingAudio
                            ? "Stop audio narration"
                            : "Listen to job details"
                        }
                      >
                        {isPlayingAudio ? (
                          <VolumeX size={16} />
                        ) : (
                          <Volume2 size={16} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveJob();
                  }}
                  disabled={isSaving}
                  className={`p-2 rounded-full transition-colors ${
                    isSaved
                      ? "text-blue-500"
                      : "text-gray-400 hover:text-gray-600"
                  } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  aria-label={
                    isSaved ? "Remove from saved jobs" : "Save this job"
                  }
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <FiBookmark
                      className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
                      fill={isSaved ? "#3b82f6" : "none"}
                    />
                  )}
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareMenu(!showShareMenu);
                    }}
                    className={`p-2 rounded-full transition-colors border border-gray-200 shadow-sm ${
                      showShareMenu
                        ? "text-blue-500 bg-blue-50 border-blue-200"
                        : "text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50"
                    }`}
                    aria-label="Share this job"
                    style={{ marginLeft: "-2px" }}
                  >
                    <MdShare className="w-3 h-3" />
                  </button>

                  {/* Share menu dropdown */}
                  {showShareMenu && (
                    <motion.div
                      ref={shareMenuRef}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyLink}
                          disabled={isCopying}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isCopying
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                          title="Copy link"
                        >
                          {isCopying ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                          ) : (
                            <FiCopy className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={handleEmailShare}
                          className="p-2 rounded-lg transition-all duration-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                          title="Email job"
                        >
                          <FiMail className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleLinkedInShare}
                          className="p-2 rounded-lg transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Share on LinkedIn"
                        >
                          <FiLinkedin className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleTwitterShare}
                          className="p-2 rounded-lg transition-all duration-200 bg-blue-50 text-blue-400 hover:bg-blue-100"
                          title="Share on Twitter"
                        >
                          <FiTwitter className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleFacebookShare}
                          className="p-2 rounded-lg transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Share on Facebook"
                        >
                          <FiFacebook className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleWhatsAppShare}
                          className="p-2 rounded-lg transition-all duration-200 bg-green-50 text-green-600 hover:bg-green-100"
                          title="Share on WhatsApp"
                        >
                          <FiMessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShareMenu(false);
                          }}
                          className="p-2 rounded-lg transition-all duration-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                          title="Close"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Job details */}
          <div className={`px-6 pb-4 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                {displayTown}
              </span>
              {job.workType && (
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  {job.workType}
                </span>
              )}
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <Banknote className="w-4 h-4 text-gray-400" />
                {job.salaryType === "Unpaid" || !job.salary || job.salary === 0
                  ? "Unpaid"
                  : formatSalary(job.salary)}
              </span>
            </div>

            {/* Description with original formatting (HTML preserved) */}
            <div className="mb-4 max-h-60 overflow-y-auto p-1 bg-white rounded border border-gray-100">
              <div
                className="text-gray-600 text-sm break-words whitespace-pre-line"
                style={{ wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ __html: getDisplayDescription() }}
              />
            </div>

            {/* Skills/tags */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {job.skills
                    .slice(0, viewMode === "list" ? 6 : 4)
                    .map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  {job.skills.length > (viewMode === "list" ? 6 : 4) && (
                    <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-xs">
                      +{job.skills.length - (viewMode === "list" ? 6 : 4)} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with action buttons */}
          <div
            className={`px-6 py-4 border-t border-gray-100 bg-gray-50 ${
              viewMode === "list" ? "flex-shrink-0" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Posted {getTimePassed(job.date)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigate(`/apply-job/${job._id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </button>
                <button
                  onClick={handleQuickApply}
                  disabled={isApplying || isAlreadyApplied}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isAlreadyApplied
                      ? "bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed"
                      : isApplying
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : showQuickApply
                      ? "bg-gray-700 hover:bg-gray-800 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md"
                  }`}
                >
                  {isApplying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Applying...
                    </>
                  ) : isAlreadyApplied ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      Applied
                    </>
                  ) : showQuickApply ? (
                    <>
                      <FiZap className="w-4 h-4" />
                      Quick Apply
                    </>
                  ) : (
                    <>
                      <FiZap className="w-4 h-4" />
                      Apply Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <FiAlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Resume Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to upload your resume before you can apply for jobs.
              <br />
              Please go to <span className="font-semibold">My Jobs</span> to
              upload your resume.
            </p>
            <button
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors mb-2 w-full"
              onClick={() => {
                setShowResumeModal(false);
                navigate("/applications");
                window.scrollTo(0, 0);
              }}
            >
              Go to My Jobs
            </button>
            <button
              className="text-gray-500 hover:text-gray-700 text-sm mt-2"
              onClick={() => setShowResumeModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

JobCard.defaultProps = {
  job: {
    title: "",
    companyId: {
      name: "",
      image: "",
    },
    location: "",
    level: "",
    salary: null,
    workType: "",
    description: "",
    skills: [],
    date: null,
    _id: "",
    urgent: false,
    priority: "",
  },
  viewMode: "grid",
  showQuickApply: false,
  showAIScore: false,
};

export default JobCard;
