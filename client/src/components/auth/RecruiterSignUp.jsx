import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../../context/AppContext";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  MapPin,
  Phone,
  Briefcase,
  Building,
  Globe,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
} from "lucide-react";

const RecruiterSignUp = ({ onClose, onSwitchToSignIn }) => {
  const navigate = useNavigate();
  const { setRecruiterAuth } = useContext(AppContext);
  const fileInputRef = useRef(null);

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 350, damping: 25 },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 },
    },
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [recruiterType, setRecruiterType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationType, setVerificationType] = useState(""); // "email" or "phone"
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState(null);

  const inputRefs = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];

  // Ensure verificationType is set when reaching verification step
  useEffect(() => {
    if (currentStep === 3 && !verificationType) {
      setVerificationType("email");
    }
  }, [currentStep, verificationType]);

  const handleResendCode = async () => {
    try {
      const recruiterId = localStorage.getItem("tempRecruiterId");
      if (!recruiterId) {
        toast.error("No verification session found");
        return;
      }

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/recruiters/resend-verification`,
        {
          recruiterId,
          type: "email",
        }
      );

      if (response.data.success) {
        toast.success("New verification code sent to your email");
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast.error(error.response?.data?.message || "Failed to resend code");
    }
  };

  const [formData, setFormData] = useState({
    // Basic fields
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Company/Organization fields
    organizationName: "",
    contactPersonName: "",
    businessRegistrationNumber: "",
    officeAddress: "",
    website: "",
    industry: "",
    organizationSize: "",
    foundedYear: "",
    organizationType: "", // New field to distinguish between company, NGO, government, etc.

    // Individual fields
    firstName: "",
    lastName: "",
  });

  const recruiterTypes = [
    {
      type: "Individual",
      title: "Individual Recruiter",
      icon: User,
      color: "bg-purple-500",
    },
    {
      type: "Company",
      title: "Company & Organization",
      icon: Building,
      color: "bg-blue-500",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Only allow digits
      if (!/^[0-9]*$/.test(value)) return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength when password changes
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleCodeInput = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;
    const newDigits = [...codeDigits];
    newDigits[idx] = val[val.length - 1];
    setCodeDigits(newDigits);
    if (idx < 5 && val) {
      inputRefs[idx + 1].current.focus();
    }
  };

  const handleCodeKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (codeDigits[idx]) {
        const newDigits = [...codeDigits];
        newDigits[idx] = "";
        setCodeDigits(newDigits);
      } else if (idx > 0) {
        inputRefs[idx - 1].current.focus();
      }
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const digits = pastedText.replace(/[^0-9]/g, "").slice(0, 6);

    if (digits.length === 0) return;

    const newDigits = [...codeDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = digits[i] || "";
    }
    setCodeDigits(newDigits);

    // Focus the next empty input or the last input
    const nextEmptyIndex = newDigits.findIndex((digit) => digit === "");
    const focusIndex =
      nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(digits.length, 5);
    if (inputRefs[focusIndex]?.current) {
      inputRefs[focusIndex].current.focus();
    }
  };

  const validateStep1 = () => {
    if (!recruiterType) {
      toast.error("Please select a recruiter type");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const requiredFields = ["email", "password", "phone"];

    if (recruiterType === "Company") {
      requiredFields.push("organizationName", "officeAddress");
      // Add password confirmation validation for Company
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
    } else if (recruiterType === "Individual") {
      requiredFields.push("firstName", "lastName");
      // Add password confirmation validation for Individual
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return false;
      }
    }

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(
          `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }

    if (passwordStrength < 3) {
      toast.warning("Please use a stronger password for better security");
      return false;
    }

    // Individual specific validations
    if (recruiterType === "Individual") {
      // No additional validations needed for Individual
    }

    // Company specific validations
    if (recruiterType === "Company") {
      // No additional validations needed for Company
    }

    // Validate email domain for government organizations
    if (
      recruiterType === "Company" &&
      formData.organizationType === "Government" &&
      !formData.email.includes("@gov.sl")
    ) {
      toast.error(
        "Government organizations must use official government email (@gov.sl)"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) return;

      setIsLoading(true);
      try {
        const formDataToSend = new FormData();

        // Add basic fields
        formDataToSend.append("recruiterType", recruiterType);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("phone", formData.phone);

        // Add type-specific fields
        if (recruiterType === "Company") {
          formDataToSend.append("organizationName", formData.organizationName);
          formDataToSend.append("officeAddress", formData.officeAddress);
          formDataToSend.append("website", formData.website);
          formDataToSend.append("industry", formData.industry);
          formDataToSend.append("organizationSize", formData.organizationSize);
          formDataToSend.append("foundedYear", formData.foundedYear);
          formDataToSend.append("organizationType", formData.organizationType);
          // Add business license file
          if (businessLicenseFile) {
            formDataToSend.append("businessLicenseFile", businessLicenseFile);
          }
        } else if (recruiterType === "Individual") {
          formDataToSend.append(
            "fullName",
            `${formData.firstName} ${formData.lastName}`
          );
        }

        // Add logo file if selected
        if (selectedFile) {
          formDataToSend.append("logo", selectedFile);
        }

        // Debug: Log what's being sent
        console.log("Form data being sent:", {
          recruiterType,
          email: formData.email,
          phone: formData.phone,
          organizationName: formData.organizationName,
          contactPersonName: formData.contactPersonName,
          businessRegistrationNumber: formData.businessRegistrationNumber,
          officeAddress: formData.officeAddress,
          website: formData.website,
          hasLogo: !!selectedFile,
          hasBusinessLicense: !!businessLicenseFile,
        });

        console.log("Debug - Current form data state:", formData);

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/recruiters/register`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          // Store the recruiter ID for verification
          localStorage.setItem("tempRecruiterId", response.data.recruiter.id);
          toast.success(
            "Registration successful! Please verify your email to complete registration."
          );
          setPendingVerification(true);
          setVerificationType("email"); // Set verification type to email first
          setCurrentStep(3);
        }
      } catch (error) {
        console.error("Registration error:", error);
        toast.error(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle verification
    if (currentStep === 3) {
      const code = codeDigits.join("");
      if (code.length !== 6) {
        toast.error("Please enter the complete verification code");
        return;
      }

      if (!verificationType) {
        // Fallback: set to email if not set
        setVerificationType("email");
        toast.info("Starting with email verification...");
      }

      setIsLoading(true);
      try {
        const recruiterId = localStorage.getItem("tempRecruiterId");
        console.log("Debug - Verification attempt:", {
          recruiterId,
          code,
          verificationType,
          url: `${
            import.meta.env.VITE_API_BASE_URL
          }/api/recruiters/verify-${verificationType}`,
        });

        const response = await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/recruiters/verify-${verificationType}`,
          {
            recruiterId,
            code,
          }
        );

        if (response.data.success) {
          // Store the token and recruiter data using context
          setRecruiterAuth(response.data.token, response.data.recruiter);
          localStorage.removeItem("tempRecruiterId"); // Clean up

          console.log("Recruiter verification successful:", {
            token: response.data.token,
            recruiter: response.data.recruiter,
          });

          toast.success(
            "Email verified successfully! Welcome to your dashboard."
          );
          if (onClose) onClose();
          // Route to unified dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Verification error:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Verification failed. Please try again.";
        console.log("Debug - Verification error details:", {
          status: error.response?.status,
          data: error.response?.data,
          message: errorMessage,
        });
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Your Account Type
        </h2>
        <p className="text-sm text-gray-600">
          Select the type of recruiter account that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recruiterTypes.map((type) => (
          <motion.button
            key={type.type}
            type="button"
            onClick={() => setRecruiterType(type.type)}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg ${
              recruiterType === type.type
                ? "border-gray-500 bg-gray-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Selection indicator */}
            {recruiterType === type.type && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
            )}

            {/* Icon */}
            <div className="flex items-center justify-center mb-4">
              <div
                className={`w-16 h-16 rounded-full ${type.color} flex items-center justify-center shadow-lg`}
              >
                <type.icon size={28} className="text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {type.title}
              </h3>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          {recruiterType} Registration
        </h2>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Basic Information - Only for NGO, Government */}
        {recruiterType === "NGO" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Lock size={12} className="text-gray-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicator */}
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      passwordStrength >= level ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Government fields */}
        {recruiterType === "Government" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Lock size={12} className="text-gray-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicator */}
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      passwordStrength >= level ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Company Registration - Step by Step */}
        {recruiterType === "Company" && (
          <>
            {/* Step 1: Organization Name */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Building size={12} className="text-gray-500" />
                Organization Name
              </label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Organization Name"
                required
              />
            </div>

            {/* Step 2: Office Address */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <MapPin size={12} className="text-gray-500" />
                Office Address
              </label>
              <input
                type="text"
                name="officeAddress"
                value={formData.officeAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Office Address"
                required
              />
            </div>

            {/* Step 3: Website (Optional) */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Globe size={12} className="text-gray-500" />
                Website (Optional)
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="https://example.com"
              />
            </div>

            {/* Step 4: Email */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Mail size={12} className="text-gray-500" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Email Address"
                required
              />
            </div>

            {/* Step 5: Password */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Lock size={12} className="text-gray-500" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicator */}
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      passwordStrength >= level ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 6: Confirm Password */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Lock size={12} className="text-gray-500" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Confirm Password"
                required
              />
            </div>

            {/* Step 7: Phone Number */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Phone size={12} className="text-gray-500" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Phone Number"
                required
              />
            </div>
          </>
        )}

        {/* NGO Registration - Keep existing structure for now */}
        {recruiterType === "NGO" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Building size={12} className="text-gray-500" />
                  Organization Name
                </label>
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Organization Name"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-gray-500" />
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Contact Person Name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <FileText size={12} className="text-gray-500" />
                  Business Registration Number
                </label>
                <input
                  type="text"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Business Registration Number"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Globe size={12} className="text-gray-500" />
                  Website (Optional)
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <MapPin size={12} className="text-gray-500" />
                Office Address
              </label>
              <input
                type="text"
                name="officeAddress"
                value={formData.officeAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Office Address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Briefcase size={12} className="text-gray-500" />
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Industry"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Building size={12} className="text-gray-500" />
                  Organization Size
                </label>
                <select
                  name="organizationSize"
                  value={formData.organizationSize}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>
          </>
        )}

        {recruiterType === "Individual" && (
          <>
            {/* Step 1: Image/Logo Upload */}
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Upload size={12} className="text-gray-500" />
                Profile Photo (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
              >
                {filePreview ? (
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src={filePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Upload Photo</p>
                  </div>
                )}
              </div>
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">JPG, PNG - Max 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Step 2: First Name and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-gray-500" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="First Name"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-gray-500" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>

            {/* Step 3: Email and Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Email Address"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-500" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Phone Number"
                  autoComplete="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            {/* Step 4: Password and Confirm Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Lock size={12} className="text-gray-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        passwordStrength >= level
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Lock size={12} className="text-gray-500" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Confirm Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {recruiterType === "Government" && (
          <>
            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <Building size={12} className="text-gray-500" />
                Ministry/Department/Agency
              </label>
              <input
                type="text"
                name="ministryDepartmentAgency"
                value={formData.ministryDepartmentAgency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Ministry/Department/Agency Name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <User size={12} className="text-gray-500" />
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Contact Person Name"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Briefcase size={12} className="text-gray-500" />
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Designation"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                <FileText size={12} className="text-gray-500" />
                Authorization Letter Number
              </label>
              <input
                type="text"
                name="authorizationLetterNumber"
                value={formData.authorizationLetterNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Authorization Letter Number"
                required
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderVerificationStep = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 text-center">
            Verify your {verificationType}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Enter the verification code sent to your {verificationType}
        </p>

        <div className="text-center text-xs text-gray-500 font-medium mb-2">
          {verificationType === "email" ? formData.email : formData.phone}
        </div>
        <div className="text-center text-xs text-gray-400 mb-4">
          {verificationType === "email"
            ? "Check your email for the verification code"
            : "Check your phone for the verification code"}
        </div>

        <div className="flex justify-center gap-2 mb-2">
          {codeDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeInput(e, idx)}
              onKeyDown={(e) => handleCodeKeyDown(e, idx)}
              onPaste={handleCodePaste}
              className="w-10 h-12 text-center text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
            />
          ))}
        </div>

        <div className="text-center text-xs text-gray-500">
          Didn't receive a code?{" "}
          <button
            type="button"
            onClick={handleResendCode}
            className="text-blue-600 hover:underline font-medium"
          >
            Resend
          </button>
        </div>
      </div>
    );
  };

  const content = (
    <motion.div className="relative w-full max-w-md" variants={modalVariants}>
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="relative h-24 bg-gray-700 flex items-center justify-center">
          <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gray-500 opacity-20 blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gray-500 opacity-20 blur-xl"></div>

          <div className="absolute -bottom-10 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg p-1">
            <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded-full">
              <Briefcase size={28} className="text-white" />
            </div>
          </div>
        </div>

        <div className="px-4 pt-10 pb-2">
          <h1 className="text-xl font-bold text-center text-gray-800 mb-1">
            Recruiter Registration
          </h1>
          <p className="text-xs text-center text-gray-500">
            Join Jobmarkit Sierra Leone
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={formVariants}
            onSubmit={handleSubmit}
            className="px-4 pb-4 space-y-3"
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderVerificationStep()}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 1 && currentStep < 3 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3.5 mt-4 font-medium bg-gray-700 text-white hover:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-70 transition-all duration-300"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {currentStep === 3 ? "Verifying..." : "Creating account..."}
                  </span>
                ) : currentStep === 1 ? (
                  "Continue"
                ) : currentStep === 2 ? (
                  "Create Account"
                ) : (
                  "Verify"
                )}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>

        {/* Account toggle */}
        <div className="py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
          <div className="flex justify-center px-8">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="font-bold text-gray-700 hover:text-gray-800 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 transition-colors rounded-full hover:bg-white/20 hover:text-white focus:outline-none"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );

  // Check if this is a standalone page or modal
  const isStandalone = !onClose;

  return isStandalone ? (
    <motion.div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-6"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={overlayVariants}
        className="w-full max-w-md max-h-screen"
      >
        {content}
      </motion.div>
    </motion.div>
  ) : (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
      <div className="w-full max-w-md max-h-screen">{content}</div>
    </motion.div>
  );
};

export default RecruiterSignUp;
