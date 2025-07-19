import Quill from "quill";
import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Languages, Globe } from "lucide-react";
import { jobCategories } from "../assets/assets"; // Import the new categories

const workTypes = ["Full-time", "Part-time", "Contract", "Internship"];
const workSetups = ["On-site", "Remote", "Hybrid"];

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
  // North West districts moved to Northern:
  // (If any districts in your original data had province: "North West", change them to "Northern" here)
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

const mainCategories = jobCategories.map((cat) => cat.label);

// Prepare capital towns for dropdown (add Lunsar, Masiaka, Lungi for Port Loko)
const capitalTowns = [
  ...sierraLeoneDistricts.map((d) => d.capital),
  "Lunsar",
  "Masiaka",
  "Lungi",
];

// Define icon maps for work types, work setups, and experience levels
const workTypeIcons = {
  "Full-time": "🕒",
  "Part-time": "⏰",
  Contract: "📄",
  Internship: "🎓",
};
const workSetupIcons = {
  "On-site": "🏢",
  Remote: "💻",
  Hybrid: "🌐",
};
const experienceLevelIcons = {
  "Beginner level": "🟢",
  "Intermediate level": "🟡",
  "Senior level": "🔴",
};

const AddJob = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [province, setProvince] = useState("Western Area");
  const [district, setDistrict] = useState("Western Area Urban");
  const [town, setTown] = useState("");

  // New Category States
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
  const [otherCategory, setOtherCategory] = useState(""); // For custom category input

  const [level, setLevel] = useState("Junior Level");
  const [salary, setSalary] = useState(0);
  const [workType, setWorkType] = useState("Full-time");
  const [workSetup, setWorkSetup] = useState("On-site");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);
  const [originalLanguage, setOriginalLanguage] = useState("en");
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [salaryType, setSalaryType] = useState("Paid");

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const { backendUrl, companyToken, recruiterToken } = useContext(AppContext);

  const [townMode, setTownMode] = useState("dropdown"); // 'dropdown' or 'manual'
  const [manualTown, setManualTown] = useState("");

  // Helper to get district/province by capital (handle Lunsar, Masiaka, Lungi)
  const getDistrictProvinceByCapital = (capital) => {
    if (["Lunsar", "Masiaka", "Lungi"].includes(capital)) {
      return { district: "Port Loko", province: "Northern" };
    }
    const found = sierraLeoneDistricts.find((d) => d.capital === capital);
    return found
      ? { district: found.district, province: found.province }
      : { district: "", province: "" };
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300); // Brief delay for perceived loading
    return () => clearTimeout(timer);
  }, []);

  // Update sub-category options when main category changes
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

  // Validate the form
  useEffect(() => {
    const hasValidTown =
      townMode === "manual" ? manualTown.trim() : town.trim();
    if (
      title.trim() &&
      (salaryType === "Unpaid" || (salaryType === "Paid" && salary > 0)) &&
      hasValidTown
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [title, salary, salaryType, town, manualTown, townMode]);

  // Auto-translate when language changes or content changes
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

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please fill all required fields");
      return;
    }

    // Additional validation for town
    const finalTown = townMode === "manual" ? manualTown : town;
    if (!finalTown.trim()) {
      toast.error("Please select or enter a town/village");
      return;
    }

    try {
      setIsSubmitting(true);
      // Safety Check: ensure quillRef exists before getting its content
      const description = quillRef.current
        ? quillRef.current.root.innerHTML
        : "";

      // Determine the category to be sent
      const finalCategory =
        mainCategory === "Other" ? otherCategory : subCategory;

      if (!finalCategory) {
        toast.error("Please specify a job category.");
        return;
      }

      const finalTown = townMode === "manual" ? manualTown : town;

      const { data } = await axios.post(
        backendUrl + "/api/company/post-job",
        {
          title,
          description,
          location: {
            province,
            district,
            town: finalTown,
          },
          mainCategory: mainCategory, // Send main category
          category: finalCategory, // Send subcategory or custom category
          level,
          salary: salaryType === "Paid" ? salary : 0,
          salaryType,
          workType,
          workSetup,
          originalLanguage,
        },
        { headers: { token: companyToken || recruiterToken } }
      );

      if (data.success) {
        toast.success(data.message);
        setTitle("");
        setSalary(0);
        // Safety Check: ensure quillRef exists before clearing it
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
        setFormStep(1);
        setOriginalLanguage("en");
        setTranslatedTitle("");
        setTranslatedDescription("");
        setShowTranslation(false);
        setProvince("Western Area");
        setDistrict("Western Area Urban");
        setTown("");
        setManualTown("");
        setTownMode("dropdown");
        setMainCategory(mainCategories[0]);
        setSubCategory(
          jobCategories.find((cat) => cat.label === mainCategories[0])
            ?.subcategories[0]?.label || ""
        );
        setOtherCategory("");
        setWorkType("Full-time");
        setWorkSetup("On-site");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Re-applying the fix: Initiate Quill only once Step 2 is active.
    if (formStep === 2 && !quillRef.current && editorRef.current) {
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
    }
  }, [formStep]); // Rerun this effect when the form step changes.

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <svg
          className="animate-spin h-10 w-10 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Post a New Position
        </h2>
        <p className="text-gray-500 mt-1">
          Create a job listing to attract the perfect candidates
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Basic Info</span>
          <span className="text-sm font-medium text-gray-700">Job Details</span>
          <span className="text-sm font-medium text-gray-700">
            Preview & Post
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-700 transition-all duration-300 ease-in-out"
            style={{ width: `${(formStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={onSubmitHandler} className="relative">
        {/* Step 1: Basic Info */}
        <motion.div
          className={`${formStep === 1 ? "block" : "hidden"}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold mr-3">
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
                    placeholder="e.g. Senior React Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition-all duration-200"
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

              {/* Language Selection */}
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
                  Salary Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              {salaryType === "Paid" && (
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
                      min={0}
                      placeholder="e.g. 75000"
                      value={salary || ""}
                      onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
                      required={salaryType === "Paid"}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the monthly salary in Leones
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFormStep(2)}
              disabled={!title || (salaryType === "Paid" && salary <= 0)}
              className={`px-6 py-3 bg-white text-gray-700 border-2 border-gray-700 font-medium rounded-lg shadow-md hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 transition-all duration-200 ${
                !title || (salaryType === "Paid" && salary <= 0)
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
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold mr-3">
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
                    Work Type
                  </label>
                  <select
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                  >
                    {workTypes.map((type) => (
                      <option key={type} value={type}>
                        {workTypeIcons[type] || ""} {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Setup
                  </label>
                  <select
                    value={workSetup}
                    onChange={(e) => setWorkSetup(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                  >
                    {workSetups.map((setup) => (
                      <option key={setup} value={setup}>
                        {workSetupIcons[setup] || ""} {setup}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <select
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                  >
                    {jobCategories.map((cat) => (
                      <option key={cat.label} value={cat.label}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  {mainCategory !== "Other" ? (
                    <select
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition-all duration-200"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Town / Village <span className="text-red-500">*</span>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                  >
                    <option value="" disabled>
                      Select major town
                    </option>
                    {capitalTowns.map((cap) => (
                      <option key={cap} value={cap}>
                        {cap}
                      </option>
                    ))}
                    <option value="notfound">Town/Village not found</option>
                  </select>
                  {townMode === "manual" && (
                    <input
                      type="text"
                      placeholder="Enter town or village name"
                      value={manualTown}
                      onChange={(e) => setManualTown(e.target.value)}
                      className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none transition-all duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                    disabled={townMode === "dropdown"}
                  >
                    {provinceOptions.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-700 focus:border-gray-700 outline-none bg-white transition-all duration-200"
                  >
                    <option value="Beginner level">
                      {experienceLevelIcons["Beginner level"]} Beginner level
                    </option>
                    <option value="Intermediate level">
                      {experienceLevelIcons["Intermediate level"]} Intermediate
                      level
                    </option>
                    <option value="Senior level">
                      {experienceLevelIcons["Senior level"]} Senior level
                    </option>
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
              Back
            </button>
            <button
              type="button"
              onClick={() => setFormStep(3)}
              className="px-6 py-3 bg-gray-700 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 transition-all duration-200"
            >
              Preview Job
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

        {/* Step 3: Preview & Submit */}
        <motion.div
          className={`${formStep === 3 ? "block" : "hidden"}`}
          initial="hidden"
          animate="visible"
          variants={formVariants}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold mr-3">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                Preview & Post
              </h3>
            </div>

            <div className="space-y-6">
              <div className="p-6 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {title || "Job Title"}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {town}, {district}, {province}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {subCategory}
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
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center mt-8">
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
              Back to Details
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 min-w-[150px]"
            >
              Post Job
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
};

export default AddJob;
