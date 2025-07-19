import React, { useState, useRef } from "react";
import { useSignUp } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
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
  Github,
  Linkedin,
  Zap,
} from "lucide-react";

const CustomSignUp = ({ onClose, onSwitchToSignIn }) => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if this is a standalone page or modal
  const isStandalone = !onClose;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength when password changes
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
    // Clear password error when user types
    if (name === "confirmPassword" || name === "password") {
      setPasswordError("");
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

  const validateStep1 = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.firstName ||
      !formData.lastName
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (passwordStrength < 3) {
      toast.warning("Please use a stronger password for better security");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Step 2 is now just for additional info, no required fields
    return true;
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

  const handleResendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.success("A new verification code has been sent to your email.");
    } catch (err) {
      toast.error("Failed to resend code. Please try again.");
    }
  };

  const isCodeComplete = codeDigits.every((d) => d.length === 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (pendingVerification) {
      if (!isCodeComplete) {
        toast.warning("Please enter the 6-digit verification code.");
        return;
      }
      setIsLoading(true);
      try {
        const code = codeDigits.join("");
        console.log("[DEBUG] Sending verification code to Clerk:", code);
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
          toast.success("Account created successfully! Welcome to Jobmarkit!");
          if (onClose) onClose();
          navigate("/");
        } else {
          toast.error("Verification failed. Please try again.");
        }
      } catch (err) {
        console.error("[DEBUG] Clerk verification error:", err);
        toast.error(err.errors?.[0]?.message || "Invalid verification code.");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Account created successfully! Welcome to Jobmarkit!");
        if (onClose) onClose();
        navigate("/");
      } else {
        // Always prepare for email verification and show code input UI
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setPendingVerification(true);
        toast.info("Please check your email for the verification code.");
      }
    } catch (err) {
      toast.error(
        err.errors?.[0]?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    });
    setCurrentStep(1);
    setPasswordStrength(0);
  };

  const switchMode = () => {
    if (onSwitchToSignIn) {
      onSwitchToSignIn();
    } else {
      navigate("/signin");
    }
  };

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

  const renderStep1 = () => (
    <>
      <div className="space-y-3">
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
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
            <Lock size={12} className="text-gray-500" />
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                passwordError ? "border-red-500" : ""
              }`}
              placeholder="Confirm Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && (
            <div className="text-xs text-red-500 mt-1">{passwordError}</div>
          )}
        </div>
      </div>
      <div className="mt-5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 text-gray-500 bg-white">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5 justify-center">
          <button
            type="button"
            className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors text-gray-600"
            onClick={() => {
              if (!isLoaded) return;
              if (typeof signUp.authenticateWithRedirect !== "function") {
                alert(
                  "Social sign up is not available. Please contact support."
                );
                console.error(
                  "[DEBUG] signUp.authenticateWithRedirect is not a function:",
                  signUp
                );
                return;
              }
              signUp.authenticateWithRedirect({ strategy: "oauth_google" });
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                fill="currentColor"
                d="M12 11v2h5.5c-.2 1.1-1.5 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.4-2.4C16.4 2 14.4 1 12 1 6.5 1 2 5.5 2 11s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
              />
            </svg>
          </button>
          <button
            type="button"
            className="flex justify-center items-center py-2.5 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 transition-colors text-gray-600"
            onClick={() => {
              if (!isLoaded) return;
              if (typeof signUp.authenticateWithRedirect !== "function") {
                alert(
                  "Social sign up is not available. Please contact support."
                );
                console.error(
                  "[DEBUG] signUp.authenticateWithRedirect is not a function:",
                  signUp
                );
                return;
              }
              signUp.authenticateWithRedirect({ strategy: "oauth_github" });
            }}
          >
            <Github size={20} />
          </button>
        </div>
      </div>
    </>
  );

  const renderVerificationStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800 text-center">
        Verify your email
      </h2>
      <p className="text-sm text-gray-600 text-center">
        Enter the verification code sent to your email
      </p>
      <div className="text-center text-xs text-gray-500 font-medium mb-2">
        {formData.email}
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

  const content = (
    <motion.div className="relative w-full max-w-sm" variants={modalVariants}>
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl">
        {/* Glass effect top area with gray gradient */}
        <div className="relative h-24 bg-gray-700 flex items-center justify-center">
          {/* Blurred circles for decoration */}
          <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gray-500 opacity-20 blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gray-500 opacity-20 blur-xl"></div>

          {/* Floating avatar container */}
          <div className="absolute -bottom-10 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg p-1">
            <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded-full">
              <Zap size={28} className="text-white" />
            </div>
          </div>
        </div>

        {/* Header text */}
        <div className="px-4 pt-10 pb-2">
          <h1 className="text-xl font-bold text-center text-gray-800 mb-1">
            Create Account
          </h1>
          <p className="text-xs text-center text-gray-500">
            Sign up to get started
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
            {pendingVerification ? renderVerificationStep() : renderStep1()}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 1 && (
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
                disabled={
                  isLoading ||
                  !isLoaded ||
                  (pendingVerification && !isCodeComplete)
                }
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
                    Creating account...
                  </span>
                ) : currentStep === 1 ? (
                  "Continue"
                ) : (
                  "Create Account"
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
                onClick={switchMode}
                className="font-bold text-gray-700 hover:text-gray-800 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Close button */}
        {!isStandalone && (
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

  return isStandalone ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={overlayVariants}
        className="w-full max-w-sm"
      >
        {content}
      </motion.div>
    </div>
  ) : (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
      {content}
    </motion.div>
  );
};

export default CustomSignUp;
