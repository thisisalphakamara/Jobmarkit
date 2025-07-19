import Quill from "quill";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { motion } from "framer-motion";
import { jobCategories } from "../assets/assets";
import { Languages, Globe } from "lucide-react";

const mainCategories = jobCategories.map((cat) => cat.label);

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

// Capital towns for dropdown (add Lunsar, Masiaka, Lungi for Port Loko)
const capitalTowns = [
  ...sierraLeoneDistricts.map((d) => d.capital),
  "Lunsar",
  "Masiaka",
  "Lungi",
];

// Helper to get district/province by capital (used in AddJob)
const getDistrictProvinceByCapital = (capital) => {
  if (["Lunsar", "Masiaka", "Lungi"].includes(capital)) {
    return { district: "Port Loko", province: "Northern" };
  }
  const found = sierraLeoneDistricts.find((d) => d.capital === capital);
  return found
    ? { district: found.district, province: found.province }
    : { district: "", province: "" };
};

const EditJob = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { backendUrl, companyToken, recruiterToken, updateJobs } =
    useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);

  // New state structure to match AddJob
  const [title, setTitle] = useState("");
  const [province, setProvince] = useState("Western Area");
  const [district, setDistrict] = useState("Western Area Urban");
  const [town, setTown] = useState("");
  const [mainCategory, setMainCategory] = useState(mainCategories[0]);
  const [subCategory, setSubCategory] = useState(() => {
    const firstCat = jobCategories.find(
      (cat) => cat.label === mainCategories[0]
    );
    return firstCat &&
      firstCat.subcategories &&
      firstCat.subcategories.length > 0
      ? firstCat.subcategories[0].label
      : "";
  });
  const [otherCategory, setOtherCategory] = useState("");
  const [level, setLevel] = useState("Junior Level");
  const [salary, setSalary] = useState(0);
  const [workType, setWorkType] = useState("Full-time");
  const [workSetup, setWorkSetup] = useState("On-site");
  const [townMode, setTownMode] = useState("dropdown");
  const [manualTown, setManualTown] = useState("");

  // Add translation state
  const [originalLanguage, setOriginalLanguage] = useState("en");
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const provinceOptions = [
    "Eastern",
    "Northern",
    "North West",
    "Southern",
    "Western Area",
  ];

  // Validate the form
  useEffect(() => {
    if (title.trim() && salary > 0) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [title, salary]);

  // Fetch job data
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/company/job/${id}`,
          {
            headers: { token: companyToken || recruiterToken },
          }
        );
        if (data.success) {
          const job = data.job;
          setTitle(job.title || "");
          setSalary(job.salary || 0);
          setLevel(job.level || "Junior Level");
          setWorkType(job.workType || "Full-time");
          setWorkSetup(job.workSetup || "On-site");
          // Location
          if (job.location && typeof job.location === "object") {
            setProvince(job.location.province || "Western Area");
            setDistrict(job.location.district || "Western Area Urban");
            setTown(job.location.town || "");
          } else {
            setProvince("Western Area");
            setDistrict("Western Area Urban");
            setTown("");
          }
          // Category
          setMainCategory(job.mainCategory || mainCategories[0]);
          setSubCategory(job.category || "");
          setOtherCategory("");
          // Quill description
          if (quillRef.current) {
            quillRef.current.root.innerHTML = job.description || "";
          }
          // Set original language if available
          if (job.language) {
            setOriginalLanguage(job.language);
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
    if (companyToken || recruiterToken) {
      fetchJobData();
    }
  }, [companyToken, recruiterToken, id]);

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
      if (title) {
        quillRef.current.root.innerHTML = title;
      }
    }
  }, [title]);

  // Add effect to update subCategory when mainCategory changes (like AddJob)
  useEffect(() => {
    const selectedMainCategoryObj = jobCategories.find(
      (cat) => cat.label === mainCategory
    );
    if (
      mainCategory !== "Other" &&
      selectedMainCategoryObj?.subcategories?.length > 0
    ) {
      setSubCategory(selectedMainCategoryObj.subcategories[0].label);
    } else {
      setSubCategory("");
    }
    setOtherCategory("");
  }, [mainCategory]);

  // Translation effect (copy from AddJob)
  useEffect(() => {
    if (
      title.trim() ||
      (quillRef.current && quillRef.current.root.innerHTML.trim())
    ) {
      handleAutoTranslate();
    }
  }, [title, originalLanguage]);

  const handleAutoTranslate = async () => {
    if (!title.trim()) return;
    setIsTranslating(true);
    try {
      const description = quillRef.current
        ? quillRef.current.root.innerHTML
        : "";
      const { data } = await axios.post(`${backendUrl}/api/translate/job`, {
        title,
        description,
        originalLanguage,
      });
      if (data.success) {
        if (originalLanguage === "en") {
          setTranslatedTitle(data.translations.titleKrio || "");
          setTranslatedDescription(data.translations.descriptionKrio || "");
        } else {
          setTranslatedTitle(data.translations.titleEnglish || "");
          setTranslatedDescription(data.translations.descriptionEnglish || "");
        }
      }
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handlers for new fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "province") setProvince(value);
    else if (name === "district") setDistrict(value);
    else if (name === "town") setTown(value);
    else if (name === "mainCategory") setMainCategory(value);
    else if (name === "subCategory") setSubCategory(value);
    else if (name === "otherCategory") setOtherCategory(value);
    else if (name === "level") setLevel(value);
    else if (name === "salary") setSalary(Number(value));
    else if (name === "workType") setWorkType(value);
    else if (name === "workSetup") setWorkSetup(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || salary <= 0) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const description = quillRef.current.root.innerHTML;
      const finalCategory =
        mainCategory === "Other" ? otherCategory : subCategory;
      const updateResponse = await axios.put(
        `${backendUrl}/api/company/edit-job/${id}`,
        {
          title,
          description,
          location: {
            province,
            district,
            town: townMode === "manual" ? manualTown : town,
          },
          mainCategory,
          category: finalCategory,
          level,
          salary,
          workType,
          workSetup,
          language: originalLanguage, // Add language to update
        },
        {
          headers: { token: companyToken || recruiterToken },
        }
      );
      if (!updateResponse.data.success) {
        throw new Error(updateResponse.data.message || "Failed to update job");
      }
      // Then fetch the updated jobs list
      const jobsResponse = await axios.get(
        `${backendUrl}/api/company/list-jobs`,
        {
          headers: { token: companyToken || recruiterToken },
        }
      );
      if (!jobsResponse.data.success) {
        throw new Error("Failed to fetch updated jobs list");
      }
      updateJobs(jobsResponse.data.jobsData.reverse());
      toast.success("Job updated successfully!");
      navigate("/dashboard/manage-jobs");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error updating job");
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

  // Helper to display location as a string
  const getLocationString = (location) => {
    if (!location) return "";
    if (typeof location === "string") return location;
    if (typeof location === "object") {
      return [location.town, location.district, location.province]
        .filter(Boolean)
        .join(", ");
    }
    return "";
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
                    value={title}
                    onChange={handleChange}
                    placeholder="e.g. Senior React Developer"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all duration-200"
                  />
                  {title && (
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

              {/* Language Selection and Translation Preview (copy from AddJob) */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Languages className="h-5 w-5 text-gray-700" />
                    <h4 className="text-sm font-medium text-gray-900">
                      Language & Translation
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-gray-800 text-sm font-medium"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{showTranslation ? "Hide" : "Show"} Translation</span>
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-800 mb-1">
                      Original Language
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setOriginalLanguage("en")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          originalLanguage === "en"
                            ? "bg-gray-700 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setOriginalLanguage("krio")}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          originalLanguage === "krio"
                            ? "bg-gray-700 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Krio
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 mt-1">
                      Choose the language you're writing in. We'll automatically
                      translate to the other language.
                    </p>
                  </div>
                  {/* Translation Preview */}
                  {showTranslation && title && (
                    <div className="bg-white rounded-md p-3 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-4 w-4 text-gray-700" />
                        <span className="text-sm font-medium text-gray-900">
                          Translation Preview
                        </span>
                        {isTranslating && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                        )}
                      </div>
                      {translatedTitle && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-600">
                            {originalLanguage === "en" ? "Krio" : "English"}{" "}
                            Title:
                          </span>
                          <p className="text-sm text-gray-800 mt-1">
                            {translatedTitle}
                          </p>
                        </div>
                      )}
                      {translatedDescription && (
                        <div>
                          <span className="text-xs font-medium text-gray-600">
                            {originalLanguage === "en" ? "Krio" : "English"}{" "}
                            Description:
                          </span>
                          <div
                            className="text-sm text-gray-800 mt-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: translatedDescription,
                            }}
                          />
                        </div>
                      )}
                    </div>
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
                    value={salary || ""}
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
              disabled={!title || salary <= 0}
              className={`px-6 py-3 bg-white text-black border-2 border-black font-medium rounded-lg shadow-md hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 ${
                !title || salary <= 0 ? "opacity-50 cursor-not-allowed" : ""
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    {mainCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {mainCategory !== "Other" ? (
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    {jobCategories
                      .find((cat) => cat.label === mainCategory)
                      ?.subcategories?.map((subCat) => (
                        <option key={subCat.label} value={subCat.label}>
                          {subCat.icon} {subCat.label}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter custom job title"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all duration-200"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Type
                  </label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    {["Full-time", "Part-time", "Contract", "Internship"].map(
                      (type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Setup
                  </label>
                  <select
                    value={workSetup}
                    onChange={(e) => setWorkSetup(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    {["On-site", "Remote", "Hybrid"].map((setup) => (
                      <option key={setup} value={setup}>
                        {setup}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  name="level"
                  value={level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                >
                  <option value="Beginner level">Beginner level</option>
                  <option value="Intermediate level">Intermediate level</option>
                  <option value="Senior level">Senior level</option>
                </select>
              </div>

              {/* Location Section */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Town / Village
                  </label>
                  <select
                    value={townMode === "dropdown" ? town : "notfound"}
                    onChange={(e) => {
                      if (e.target.value === "notfound") {
                        setTownMode("manual");
                        setTown("");
                        setDistrict("");
                        setProvince("");
                      } else {
                        setTownMode("dropdown");
                        setTown(e.target.value);
                        const { district, province } =
                          getDistrictProvinceByCapital(e.target.value);
                        setDistrict(district);
                        setProvince(province);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                  >
                    <option value="" disabled>
                      Select major town
                    </option>
                    {capitalTowns.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                    <option value="notfound">Town not found</option>
                  </select>
                  {townMode === "manual" && (
                    <input
                      type="text"
                      placeholder="Enter town or village name"
                      value={manualTown}
                      onChange={(e) => setManualTown(e.target.value)}
                      className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all duration-200"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                    disabled={townMode === "dropdown"}
                  >
                    {sierraLeoneDistricts.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none bg-white transition-all duration-200"
                    disabled={townMode === "dropdown"}
                  >
                    {provinceOptions.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
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
                    {title || "Job Title"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {townMode === "manual" ? manualTown : town}, {district},{" "}
                      {province}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {mainCategory !== "Other" ? subCategory : otherCategory}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {level}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {workType}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {workSetup}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    Le {salary.toLocaleString()}
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
