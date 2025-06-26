import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import kConvert from "k-convert";
import moment from "moment";
import JobCard from "../components/JobCard";
import Footer from "../components/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import Calltoaction from "../components/Calltoaction";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiBriefcase,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
} from "react-icons/fi";

const ApplyJob = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setAlreadyApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [similarJobs, setSimilarJobs] = useState([]);

  const {
    jobs = [],
    backendUrl,
    userData,
    userApplications = [],
    fetchUserApplications,
  } = useContext(AppContext);

  // Fetch job details
  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) {
        setJobData(data.job);
        findSimilarJobs(data.job);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Failed to fetch job details. Please try again later.");
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
      if (!userData) {
        return toast.error("Please login to apply.");
      }

      if (!userData.resume) {
        return toast.error("Please upload a resume before applying.");
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
            jobPosterEmail: jobData.companyId.email, // Make sure this exists
            jobTitle: jobData.title,
          });
        } catch (emailErr) {
          // Optionally log or toast error, but don't block the user
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
    if (id) fetchJob();
  }, [id, backendUrl]);

  useEffect(() => {
    checkAlreadyApplied();
  }, [jobData, userApplications]);

  if (isLoading || !jobData) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Job Header Section */}
          <div className="bg-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex items-start space-x-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-3 rounded-lg shadow-lg border border-white/20"
                  >
                    <img
                      className="h-20 w-20 object-contain"
                      src={jobData?.companyId?.image || assets.placeholder}
                      alt="Company Logo"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {jobData?.title}
                    </h1>
                    <p className="text-xl text-white mt-1">
                      {jobData?.companyId?.name}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center text-white">
                        <FiMapPin className="mr-2" />
                        {jobData?.location}
                      </div>
                      <div className="flex items-center text-white">
                        <FiBriefcase className="mr-2" />
                        {jobData?.level}
                      </div>
                      <div className="flex items-center text-white">
                        <p className="px-1">Le</p>
                        {jobData?.salary
                          ? kConvert.convertTo(jobData.salary)
                          : "Competitive"}
                      </div>
                      <div className="flex items-center text-white">
                        <FiClock className="mr-2" />
                        Posted {moment(jobData?.date).fromNow()}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-center"
                >
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all ${
                      isAlreadyApplied
                        ? "bg-emerald-600 text-white flex items-center"
                        : "bg-white text-black  hover:shadow-xl"
                    }`}
                  >
                    {isAlreadyApplied ? (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Applied Successfully
                      </>
                    ) : (
                      "Apply Now"
                    )}
                  </button>
                  {!isAlreadyApplied && (
                    <p className="mt-2 text-white text-sm">
                      {userData?.resume
                        ? "Your resume is ready"
                        : "Upload resume to apply"}
                    </p>
                  )}
                </motion.div>
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
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Job Description
                  </h2>
                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: jobData?.description || "",
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
                    className="text-gray-600 hover:text-black hover:underline font-medium flex items-center"
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
                  className="bg-white border-4 border-black rounded-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Ready to apply?
                  </h3>
                  <button
                    onClick={applyHandler}
                    disabled={isAlreadyApplied}
                    className={`w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-md transition-all ${
                      isAlreadyApplied
                        ? "bg-gray-500 text-white flex items-center justify-center"
                        : "bg-white text-black border-2 border-black hover:text-white hover:bg-black hover:shadow-lg"
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
                    <p className="mt-3 text-sm text-black">
                      Don't forget to upload your resume first
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <Calltoaction />
        <Footer />
      </motion.div>
    </>
  );
};

export default ApplyJob;
