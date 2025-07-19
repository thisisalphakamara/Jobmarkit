import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { User, Mail, Lock, Eye, EyeOff, X, Github, Zap } from "lucide-react";

const CustomSignIn = ({ onClose, onSwitchToSignUp }) => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);

  // Check if this is a standalone page or modal
  const isStandalone = !onClose;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoaded) return;

    setIsLoading(true);

    try {
      // Handle sign in with Clerk
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Signed in successfully!");
        if (onClose) {
          onClose();
        }
        // Redirect to home page for regular users
        navigate("/");
      } else {
        // Handle multi-factor authentication or email verification if needed
        toast.info("Please complete the verification process");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error(
        err.errors?.[0]?.message ||
          "Sign in failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      toast.success("Password reset email sent! Please check your inbox.");
      setShowResetForm(true);
    } catch (err) {
      toast.error(
        err.errors?.[0]?.message ||
          "Failed to send password reset email. Please try again."
      );
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
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: resetPassword,
      });
      if (result.status === "complete") {
        toast.success("Password reset successful! You can now sign in.");
        setShowResetForm(false);
        setPassword("");
        setResetCode("");
        setResetPassword("");
        setResetConfirmPassword("");
      } else {
        toast.info("Please complete the verification process.");
      }
    } catch (err) {
      toast.error(
        err.errors?.[0]?.message ||
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
      navigate("/signup");
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
            Welcome Back
          </h1>
          <p className="text-xs text-center text-gray-500">
            Sign in to access your job portal
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showResetForm ? (
            <motion.form
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={formVariants}
              onSubmit={handleResetPassword}
              className="px-4 pb-4 space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1.5">
                  <Mail size={12} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
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
              <button
                type="submit"
                disabled={resetLoading}
                className="relative w-full py-3.5 mt-4 font-medium bg-gray-700 text-white hover:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-70 transition-all duration-300"
              >
                {resetLoading ? (
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
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowResetForm(false)}
                >
                  Back to sign in
                </button>
              </div>
            </motion.form>
          ) : (
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
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

              {/* Social login options */}
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
                    onClick={() =>
                      signIn.authenticateWithRedirect({
                        strategy: "oauth_google",
                      })
                    }
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
                    onClick={() =>
                      signIn.authenticateWithRedirect({
                        strategy: "oauth_github",
                      })
                    }
                  >
                    <Github size={20} />
                  </button>
                </div>
              </div>
            </motion.form>
          )}
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
                Sign up now
              </button>
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/80 transition-colors rounded-full hover:bg-white/20 hover:text-white focus:outline-none"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </motion.div>
  );

  return isStandalone ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={overlayVariants}
        className="w-full max-w-md"
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

export default CustomSignIn;
