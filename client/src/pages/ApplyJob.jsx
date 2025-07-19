import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import moment from "moment";
import kConvert from "k-convert";
import JobCard from "../components/JobCard";
import Loading from "../components/Loading";
import Footer from "../components/Footer";
import { assets } from "../assets/assets";
import { Languages, Globe, Volume2, VolumeX } from "lucide-react";

const ApplyJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const manualStopRef = useRef(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const {
    jobs = [],
    backendUrl,
    userData,
    userApplications = [],
    fetchUserApplications,
    fetchUserData,
  } = useContext(AppContext);

  // Fetch job details
  const fetchJob = async () => {
    try {
      console.log("Available jobs:", jobs.length);
      console.log("Looking for job with ID:", id);

      // First, try to find the job in the existing jobs array
      const existingJob = jobs.find((job) => job._id === id);
      console.log("Existing job found:", existingJob ? "Yes" : "No");

      if (existingJob) {
        console.log("Using existing job data");
        setJobData(existingJob);
        findSimilarJobs(existingJob);
        setIsLoading(false);
        return;
      }

      console.log("Job not found in existing jobs, fetching from API...");
      // If not found in existing jobs, fetch from API
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      console.log("API response:", data);

      if (data.success) {
        setJobData(data.job);
        findSimilarJobs(data.job);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(data.message || "Job not found");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      console.error("Error response:", error.response);
      setIsLoading(false);
      if (error.response?.status === 404) {
        toast.error(
          "Job not found. It may have been removed or is no longer available."
        );
      }
    }
  };

  // Find similar jobs
  const findSimilarJobs = (currentJob) => {
    const similar = jobs
      .filter(
        (job) =>
          job._id !== currentJob._id &&
          (job.companyId._id === currentJob.companyId._id ||
            job.category === currentJob.category)
      )
      .slice(0, 4);
    setSimilarJobs(similar);
  };

  // Handle job application
  const applyHandler = async () => {
    try {
      if (!user) {
        return toast.error("Please login to apply.");
      }

      // Check if userData is loaded, if not, try to fetch it
      if (!userData) {
        try {
          await fetchUserData();
          // Wait a moment for the state to update
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      // Check again after attempting to fetch userData
      if (!userData) {
        return toast.error(
          "Please complete your profile before applying. If the issue persists, please refresh the page."
        );
      }

      if (!userData.resume) {
        setShowResumeModal(true);
        return;
      }

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/users/apply`,
        { jobId: jobData?._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // --- Send notification emails via backend ---
        try {
          await axios.post(`${backendUrl}/api/application/apply`, {
            applicantEmail: userData.email,
            jobPosterEmail:
              jobData.recruiterId?.email || jobData.companyId?.email,
            jobTitle: jobData.title,
          });
        } catch (emailErr) {
          // Optionally log or toast error, but not block the user
          console.error("Failed to send notification email:", emailErr);
        }
        // --- End email logic ---

        toast.success("Application submitted successfully!");
        fetchUserApplications();
        setAlreadyApplied(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Application error:", error);
      toast.error("Error applying for the job. Please try again.");
    }
  };

  // Check if user already applied
  const checkAlreadyApplied = () => {
    if (jobData && userApplications && userApplications.length > 0) {
      const hasApplied = userApplications.some(
        (item) => item.jobId?._id === jobData._id
      );
      setAlreadyApplied(hasApplied);
    }
  };

  useEffect(() => {
    console.log("ApplyJob useEffect - id:", id, "backendUrl:", backendUrl);
    if (id) {
      console.log("Fetching job with ID:", id);
      fetchJob();
    }
  }, [id, backendUrl]);

  useEffect(() => {
    checkAlreadyApplied();
  }, [jobData, userApplications]);

  // Get the appropriate title and description based on language preference
  const getDisplayTitle = () => {
    if (preferredLanguage === "krio" && jobData?.titleKrio) {
      return jobData.titleKrio;
    }
    if (preferredLanguage === "en" && jobData?.titleEnglish) {
      return jobData.titleEnglish;
    }
    return jobData?.title || "Job Title";
  };

  const getDisplayDescription = () => {
    if (preferredLanguage === "krio" && jobData?.descriptionKrio) {
      return jobData.descriptionKrio;
    }
    if (preferredLanguage === "en" && jobData?.descriptionEnglish) {
      return jobData.descriptionEnglish;
    }
    return jobData?.description || "No description provided";
  };

  // Simplified location display
  const displayLocation = jobData?.location
    ? `${jobData.location.town}, ${jobData.location.district}, ${jobData.location.province}`
    : "Location not specified";

  // Check if job has translations
  const hasTranslations =
    jobData?.titleKrio ||
    jobData?.titleEnglish ||
    jobData?.descriptionKrio ||
    jobData?.descriptionEnglish;

  // Function to remove HTML tags from description
  const stripHtmlTags = (html) => {
    if (!html) return "No description provided";
    return html.replace(/<[^>]*>?/gm, "");
  };

  // Helper function to get recruiter information
  const getRecruiterInfo = () => {
    if (jobData?.recruiterId) {
      const recruiter = jobData.recruiterId;
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
    if (jobData?.companyId) {
      return {
        name: jobData.companyId.name || "Company",
        image: jobData.companyId.image,
        initials: jobData.companyId.name
          ? jobData.companyId.name
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

  // Audio narration function
  const handleAudioNarration = () => {
    // Always cancel any ongoing speech before starting
    window.speechSynthesis.cancel();
    if (isPlayingAudio) {
      manualStopRef.current = true;
      setIsPlayingAudio(false);
      // Reset manual stop flag after a short delay to prevent error messages
      setTimeout(() => (manualStopRef.current = false), 100);
      return;
    }
    manualStopRef.current = false;

    // Create the narration text
    const title = getDisplayTitle();
    const description = stripHtmlTags(getDisplayDescription());
    const recruiter = getRecruiterInfo().name;
    const salary = jobData?.salary
      ? `Le ${kConvert.convertTo(jobData.salary)}`
      : "Salary not specified";
    const level = jobData?.level || "Level not specified";
    const category = jobData?.category || "Category not specified";
    const timePosted = moment(jobData?.date).fromNow();

    let narrationText = "";

    if (preferredLanguage === "krio") {
      // Format salary with "leones" after the amount for proper Krio speech
      const salaryForSpeech =
        salary.replace(/Le\s*/g, "").replace(/,/g, "") + " leones";
      narrationText = `Dis nah work way ${recruiter} post. This work dae look for person way nah ${title}. Di work dae nah ${displayLocation}. Di salary nah ${salaryForSpeech} for month. Dis nah ${level} position pa ${category} work. Di description for this work nah: ${description}. Dem post dis job ${timePosted}.`;

      // Create speech synthesis with natural Sierra Leonean Krio pronunciation
      const utterance = new SpeechSynthesisUtterance(narrationText);
      utterance.lang = "en-GB"; // British English for better Krio pronunciation
      utterance.rate = 0.75; // Slower, more natural pace
      utterance.pitch = 1.1; // Slightly higher pitch for more human-like sound
      utterance.volume = 1;

      // Try to get a more natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.lang.includes("en-GB") ||
          voice.lang.includes("en-US") ||
          voice.name.includes("Google") ||
          voice.name.includes("Natural")
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Set up event handlers
      utterance.onstart = () => {
        console.log("Audio started");
        setIsPlayingAudio(true);
      };

      utterance.onend = () => {
        console.log("Audio ended, manualStop:", manualStopRef.current);
        if (!manualStopRef.current) {
          setIsPlayingAudio(false);
        }
      };

      utterance.onerror = (event) => {
        console.log(
          "Audio error:",
          event.error,
          "manualStop:",
          manualStopRef.current
        );
        // Only show error if it's not a manual stop
        if (!manualStopRef.current) {
          setIsPlayingAudio(false);
          toast.error("Audio narration failed. Please try again.");
        } else {
          setIsPlayingAudio(false);
          toast.info("Audio narration incomplete.");
        }
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    } else {
      // Format salary with "leones" after the amount for proper English speech
      const salaryForSpeech =
        salary.replace(/Le\s*/g, "").replace(/,/g, "") + " leones";
      narrationText = `This is a job posted by ${recruiter}. The job title is ${title}. The job is located in ${displayLocation}. The salary is ${salaryForSpeech} per month. This is a ${level} position in ${category}. The job description is: ${description}. This job was posted ${timePosted}.`;

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
        if (!manualStopRef.current) {
          setIsPlayingAudio(false);
        }
      };

      utterance.onerror = (event) => {
        // Only show error if it's not a manual stop
        if (!manualStopRef.current) {
          setIsPlayingAudio(false);
          toast.error("Audio narration failed. Please try again.");
        } else {
          setIsPlayingAudio(false);
          toast.info("Audio narration incomplete.");
        }
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    }
  };

  // Add formatSalary function from JobCard
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

  if (isLoading || !jobData) {
    return <Loading />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Job Header Section */}
          <div className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start space-x-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-3 rounded-xl shadow-md border border-gray-100"
                  >
                    {getRecruiterInfo().image ? (
                      <img
                        className="h-20 w-20 object-cover rounded-lg"
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
                      className={`h-20 w-20 bg-gray-700 text-white text-2xl font-bold flex items-center justify-center rounded-lg ${
                        getRecruiterInfo().image ? "hidden" : ""
                      }`}
                    >
                      {getRecruiterInfo().initials ||
                        getRecruiterInfo().name?.charAt(0) ||
                        "R"}
                    </div>
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                      {getDisplayTitle()}
                    </h1>
                    <p className="text-xl text-gray-600 mt-1">
                      {getRecruiterInfo().name}
                    </p>

                    {/* Language Toggle */}
                    {hasTranslations && (
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("en")}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              preferredLanguage === "en"
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("krio")}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              preferredLanguage === "krio"
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            Krio
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleAudioNarration}
                          className={`flex items-center gap-1.5 text-sm font-medium transition-colors p-2 rounded-lg ${
                            isPlayingAudio
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={
                            isPlayingAudio
                              ? "Stop audio narration"
                              : `Listen to job in ${
                                  preferredLanguage === "en"
                                    ? "English"
                                    : "Krio"
                                }`
                          }
                        >
                          {isPlayingAudio ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                          {isPlayingAudio ? "Stop" : "Listen"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center"
                >
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-lg shadow-md transition-all ${
                      isAlreadyApplied
                        ? "bg-gray-600 text-white flex items-center cursor-not-allowed"
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Applied
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                  {!isAlreadyApplied && (
                    <p className="mt-2 text-gray-500 text-sm">
                      {userData?.resume
                        ? "Your resume is ready"
                        : "Upload resume to apply"}
                    </p>
                  )}
                </motion.div>
              </div>

              <div className="mt-8 mb-8 bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Full Job Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold">Job Title:</span>{" "}
                    {jobData?.title}
                  </div>
                  <div>
                    <span className="font-semibold">Posted by:</span>{" "}
                    {getRecruiterInfo().name}
                  </div>
                  <div>
                    <span className="font-semibold">Main Category:</span>{" "}
                    {jobData?.mainCategory}
                  </div>
                  <div>
                    <span className="font-semibold">Category:</span>{" "}
                    {jobData?.category}
                  </div>
                  <div>
                    <span className="font-semibold">Experience Level:</span>{" "}
                    {jobData?.level}
                  </div>
                  <div>
                    <span className="font-semibold">Work Type:</span>{" "}
                    {jobData?.workType}
                  </div>
                  <div>
                    <span className="font-semibold">Work Setup:</span>{" "}
                    {jobData?.workSetup}
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="font-semibold">Salary:</span>
                    {jobData?.salary &&
                    typeof jobData.salary === "object" &&
                    jobData.salary.min &&
                    jobData.salary.max ? (
                      <>
                        <div className="flex flex-col items-center mr-2">
                          <span className="text-xs text-gray-500">Min</span>
                          <span className="font-mono bg-gray-100 px-3 py-1 rounded">
                            {formatSalary(jobData.salary.min)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500">Max</span>
                          <span className="font-mono bg-gray-100 px-3 py-1 rounded">
                            {formatSalary(jobData.salary.max)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="font-mono bg-gray-100 px-3 py-1 rounded">
                        {jobData?.salary
                          ? formatSalary(jobData.salary)
                          : "Competitive"}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">Province:</span>{" "}
                    {jobData?.location?.province}
                  </div>
                  <div>
                    <span className="font-semibold">District:</span>{" "}
                    {jobData?.location?.district}
                  </div>
                  <div>
                    <span className="font-semibold">Town:</span>{" "}
                    {jobData?.location?.town}
                  </div>
                  <div>
                    <span className="font-semibold">Posted:</span>{" "}
                    {jobData?.date ? moment(jobData.date).format("LL") : "N/A"}
                  </div>
                  {/* Add more fields as needed */}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Job Details */}
              <div className="lg:w-2/3">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-md p-8 mb-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Job Description
                    </h2>

                    {/* Language Toggle for Description */}
                    {hasTranslations && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("en")}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              preferredLanguage === "en"
                                ? "bg-gray-700 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("krio")}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              preferredLanguage === "krio"
                                ? "bg-gray-700 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            Krio
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className="prose max-w-none text-gray-700 overflow-x-auto max-h-[500px] md:max-h-[600px] lg:max-h-[700px] rounded border border-gray-100"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: getDisplayDescription(),
                    }}
                  ></div>
                </motion.div>

                {/* Requirements */}
                {jobData?.requirements && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-8 mb-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Requirements
                    </h2>
                    <div
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: jobData.requirements }}
                    ></div>
                  </motion.div>
                )}

                {/* Benefits */}
                {jobData?.benefits && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl shadow-md p-8"
                  >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Benefits
                    </h2>
                    <div
                      className="prose max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: jobData.benefits }}
                    ></div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-1/3 space-y-6">
                {/* Company Info */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    About {jobData?.companyId?.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {jobData?.companyId?.description ||
                      "Leading company in their industry."}
                  </p>
                  <a
                    href={`/company/${jobData?.companyId?._id}`}
                    className="text-green-600 hover:text-green-700 hover:underline font-medium flex items-center"
                  >
                    View company profile <FiExternalLink className="ml-1" />
                  </a>
                </motion.div>

                {/* Similar Jobs */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Similar Jobs
                  </h3>
                  <div className="space-y-4">
                    {similarJobs.length > 0 ? (
                      similarJobs.map((job) => (
                        <JobCard key={job._id} job={job} compact />
                      ))
                    ) : (
                      <p className="text-gray-500">No similar jobs found</p>
                    )}
                  </div>
                </motion.div>

                {/* Quick Apply */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Ready to apply?
                  </h3>
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-all ${
                      isAlreadyApplied
                        ? "bg-gray-200 text-gray-500 flex items-center justify-center cursor-not-allowed"
                        : "bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Application Submitted
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                  {!userData?.resume && !isAlreadyApplied && (
                    <p className="mt-3 text-sm text-gray-600">
                      Don't forget to upload your resume first
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
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

export default ApplyJob;
