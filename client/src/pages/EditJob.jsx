import Quill from "quill";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { motion } from "framer-motion";
import { JobCategories, JobLocations } from "../assets/assets";

const EditJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { backendUrl, companyToken, updateJobs } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);

  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    location: "Freetown",
    category: "Software Development & IT",
    level: "Junior Level",
    salary: 0,
  });

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Validate the form
  useEffect(() => {
    if (jobData.title.trim() && jobData.salary > 0) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [jobData.title, jobData.salary]);

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/company/job/${id}`,
          {
            headers: { token: companyToken },
          }
        );

        if (data.success) {
          setJobData(data.job);
          // Initialize Quill after data is loaded
          if (quillRef.current) {
            quillRef.current.root.innerHTML = data.job.description;
          }
        } else {
          toast.error(data.message);
          navigate("/dashboard/manage-jobs");
        }
      } catch (error) {
        toast.error("Error fetching job data");
        navigate("/dashboard/manage-jobs");
      } finally {
        setIsLoading(false);
      }
    };

    if (companyToken) {
      fetchJobData();
    }
  }, [companyToken, id]);

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            ["blockquote", "code-block"],
            [{ header: 1 }, { header: 2 }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ script: "sub" }, { script: "super" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }],
            [{ size: ["small", false, "large", "huge"] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ["clean"],
            ["link", "image"],
          ],
        },
        placeholder: "Create a detailed job description...",
      });

      // Set initial content if jobData.description exists
      if (jobData.description) {
        quillRef.current.root.innerHTML = jobData.description;
      }
    }
  }, [jobData.description]);

  const handleChange = (e) => {
    setJobData({ ...jobData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const description = quillRef.current.root.innerHTML;

      // First update the job
      const updateResponse = await axios.put(
        `${backendUrl}/api/company/edit-job/${id}`,
        { ...jobData, description },
        {
          headers: { token: companyToken },
        }
      );

      if (!updateResponse.data.success) {
        throw new Error(updateResponse.data.message || "Failed to update job");
      }

      // Then fetch the updated jobs list
      const jobsResponse = await axios.get(
        `${backendUrl}/api/company/list-jobs`,
        {
          headers: { token: companyToken },
        }
      );

      if (!jobsResponse.data.success) {
        throw new Error("Failed to fetch updated jobs list");
      }

      // Update the jobs list in context
      updateJobs(jobsResponse.data.jobsData.reverse());
      toast.success("Job updated successfully!");
      navigate("/dashboard/manage-jobs");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error updating job");
      // Even if there's an error, try to navigate back
      navigate("/dashboard/manage-jobs");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading />;

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Edit Job Position</h2>
        <p className="text-gray-500 mt-1">Update your job listing details</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Basic Info</span>
          <span className="text-sm font-medium text-gray-700">Job Details</span>
          <span className="text-sm font-medium text-gray-700">
            Preview & Update
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gray-500 to-black transition-all duration-300 ease-in-out"
            style={{ width: `${(formStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        {/* Step 1: Basic Info */}
        <motion.div
          className={`${formStep === 1 ? "block" : "hidden"}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-semibold mr-3">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Job Basics
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="title"
                    value={jobData.title}
                    onChange={handleChange}
                    placeholder="e.g. Senior React Developer"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all duration-200"
                  />
                  {jobData.title && (
                    <span className="absolute right-3 top-3 text-green-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary (Annual) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                    Le
                  </span>
                  <input
                    type="number"
                    name="salary"
                    min={0}
                    placeholder="e.g. 75000"
                    value={jobData.salary || ""}
                    onChange={handleChange}
                    required
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all duration-200"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the monthly salary in Leones
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              disabled={!jobData.title || jobData.salary <= 0}
              className={`px-6 py-3 bg-white text-black border-2 border-black font-medium rounded-lg shadow-md hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 ${
                !jobData.title || jobData.salary <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              Continue to Job Details
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block ml-2"
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
          </div>
        </motion.div>

        {/* Step 2: Job Details */}
        <motion.div
          className={`${formStep === 2 ? "block" : "hidden"}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-semibold mr-3">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Job Details
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <div
                  ref={editorRef}
                  className="w-full border border-gray-300 rounded-lg min-h-48"
                ></div>
                <p className="mt-1 text-xs text-gray-500">
                  Be specific about responsibilities, requirements, benefits,
                  and company culture
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Category
                  </label>
                  <select
                    name="category"
                    value={jobData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    {JobCategories.map((cat, index) => (
                      <option key={index} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Location
                  </label>
                  <select
                    name="location"
                    value={jobData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    {JobLocations.map((loc, index) => (
                      <option key={index} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    name="level"
                    value={jobData.level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    <option value="Beginner level">Beginner level</option>
                    <option value="Intermediate level">
                      Intermediate level
                    </option>
                    <option value="Senior level">Senior level</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Basic Info
            </button>
            <button
              type="button"
              onClick={() => setFormStep(3)}
              className="px-6 py-3 bg-white text-black border-2 border-black font-medium rounded-lg shadow-md hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200"
            >
              Preview & Update
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block ml-2"
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
          </div>
        </motion.div>

        {/* Step 3: Preview & Update */}
        <motion.div
          className={`${formStep === 3 ? "block" : "hidden"}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-semibold mr-3">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Preview & Update
              </h3>
            </div>

            <div className="space-y-6">
              <div className="p-6 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {jobData.title || "Job Title"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {jobData.location}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {jobData.category}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {jobData.level}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    Le {jobData.salary.toLocaleString()}
                  </span>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Job Description
                </h4>
                <div className="prose max-w-none">
                  {quillRef.current && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: quillRef.current.root.innerHTML,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 inline-block mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Edit Details
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-black text-white font-medium rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Job"}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default EditJob;
