import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  Briefcase,
  Building,
  Globe,
  Zap,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";

const RecruiterLogin = ({ onClose, onSwitchToSignUp }) => {
  const navigate = useNavigate();
  const { setRecruiterAuth } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/recruiters/login`,
        {
          email,
          password,
        }
      );

      if (response.data.success) {
        // Store token and recruiter data using context
        setRecruiterAuth(response.data.token, response.data.recruiter);
        toast.success("Login successful!");
        if (onClose) {
          onClose();
        }
        // Redirect to recruiter dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 423) {
        toast.error("Account is temporarily locked. Please try again later.");
      } else if (error.response?.status === 401) {
        toast.error(
          "Invalid credentials. Please check your email and password."
        );
      } else {
        toast.error(
          error.response?.data?.message || "Login failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleForgotPassword to pre-fill forgotEmail with email
  const handleForgotPassword = async () => {
    setForgotEmail(email); // Pre-fill with login form email
    setShowForgotModal(true);
  };
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/recruiters/request-password-reset`,
        { email: forgotEmail }
      );
      toast.success("Password reset code sent! Please check your inbox.");
      setShowResetForm(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to send password reset email."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(resetCode)) {
      toast.error("Reset code must be exactly 6 digits.");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/recruiters/reset-password`,
        {
          email: forgotEmail,
          code: resetCode,
          newPassword: resetPassword,
        }
      );
      toast.success("Password reset successful! You can now sign in.");
      setResetSuccess(true);
      setShowResetForm(false);
      setForgotEmail("");
      setResetCode("");
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to reset password. Please check your code and try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const switchMode = () => {
    if (onSwitchToSignUp) {
      onSwitchToSignUp();
    } else {
      navigate("/recruiter-signup");
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/");
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

  // Check if this is a standalone page or modal
  const isStandalone = !onClose;

  return isStandalone ? (
    <motion.div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={modalVariants}
        className="w-full max-w-sm"
      >
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl">
          {/* Glass effect top area with gray gradient */}
          <div className="relative h-24 bg-gray-700 flex items-center justify-center">
            {/* Blurred circles for decoration */}
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gray-500 opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gray-500 opacity-20 blur-xl"></div>

            {/* Floating avatar container */}
            <div className="absolute -bottom-10 flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg p-1">
              <div className="flex items-center justify-center w-full h-full bg-gray-700 rounded-full">
                <Briefcase size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Header text */}
          <div className="px-4 pt-10 pb-2">
            <h1 className="text-xl font-bold text-center text-gray-800 mb-1">
              Recruiter Login
            </h1>
            <p className="text-xs text-center text-gray-500">
              Access your recruiter account
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
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5"
                >
                  <Mail size={12} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5"
                >
                  <Lock size={12} className="text-gray-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Enter your password"
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          {/* Account toggle */}
          <div className="py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-8">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-bold text-gray-700 hover:text-gray-800 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-white/80 transition-colors rounded-full hover:bg-white/20 hover:text-white focus:outline-none"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </motion.div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Reset Password</h2>
            {resetSuccess ? (
              <div className="text-center">
                <p className="mb-4 text-green-600 font-semibold">
                  Password reset successful! You can now sign in.
                </p>
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSuccess(false);
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : showResetForm ? (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Mail size={12} className="text-gray-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-gray-500" />
                    Reset Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                    placeholder="Enter the code from your email"
                    required
                    name="resetCode"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-gray-500" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                    >
                      {showResetPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-gray-500" />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetConfirmPassword ? "text" : "password"}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowResetConfirmPassword(!showResetConfirmPassword)
                      }
                    >
                      {showResetConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onClick={() => {
                      setShowForgotModal(false);
                      setShowResetForm(false);
                      setResetCode("");
                      setResetPassword("");
                      setResetConfirmPassword("");
                      setResetLoading(false);
                    }}
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  ) : (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial="hidden"
      animate="visible"
      variants={overlayVariants}
    >
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
                <Briefcase size={28} className="text-white" />
              </div>
            </div>
          </div>

          {/* Header text */}
          <div className="px-4 pt-10 pb-2">
            <h1 className="text-xl font-bold text-center text-gray-800 mb-1">
              Recruiter Login
            </h1>
            <p className="text-xs text-center text-gray-500">
              Access your recruiter account
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
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5"
                >
                  <Mail size={12} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5"
                >
                  <Lock size={12} className="text-gray-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Enter your password"
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          {/* Account toggle */}
          <div className="py-5 bg-gray-50 border-t border-gray-100 rounded-b-3xl">
            <div className="flex justify-center px-8">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-bold text-gray-700 hover:text-gray-800 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </div>

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-white/80 transition-colors rounded-full hover:bg-white/20 hover:text-white focus:outline-none"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </motion.div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Reset Password</h2>
            {resetSuccess ? (
              <div className="text-center">
                <p className="mb-4 text-green-600 font-semibold">
                  Password reset successful! You can now sign in.
                </p>
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSuccess(false);
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : showResetForm ? (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Mail size={12} className="text-gray-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-gray-500" />
                    Reset Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                    placeholder="Enter the code from your email"
                    required
                    name="resetCode"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-gray-500" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                    >
                      {showResetPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                    <Lock size={12} className="text-gray-500" />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetConfirmPassword ? "text" : "password"}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowResetConfirmPassword(!showResetConfirmPassword)
                      }
                    >
                      {showResetConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onClick={() => {
                      setShowForgotModal(false);
                      setShowResetForm(false);
                      setResetCode("");
                      setResetPassword("");
                      setResetConfirmPassword("");
                      setResetLoading(false);
                    }}
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecruiterLogin;
