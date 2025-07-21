import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiUsers,
  FiBriefcase,
  FiGlobe,
  FiShield,
  FiCheckCircle,
  FiHeart,
} from "react-icons/fi";
import { Zap } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Use full backend URL in production, proxy in development
  const API_BASE = import.meta.env.PROD ? "https://jobmarkit.onrender.com" : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (email) {
      try {
        const res = await fetch(`${API_BASE}/api/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.success) {
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 3000);
          setEmail("");
        } else {
          setError(data.message || "Failed to subscribe.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <footer className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Newsletter Section */}
        <div className="mb-20">
          <div className="bg-white rounded-2xl p-16 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-12 items-center">
              <div className="lg:col-span-7">
                <div className="mb-8">
                  <h2 className="font-bold text-3xl md:text-4xl text-gray-800">
                    Join the Jobmarkit Community
                  </h2>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Be among the first to discover job opportunities in Sierra
                  Leone. Get early access to new features, career insights, and
                  exclusive resources as we build Sierra Leone&apos;s premier
                  job portal together.
                </p>
              </div>

              <div className="lg:col-span-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 px-6 py-4 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300 text-lg"
                    placeholder="Enter your email address"
                    required
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300
                      ${
                        submitted
                          ? "bg-gray-400 text-gray-800 cursor-default"
                          : "bg-gray-700 text-white hover:bg-gray-800"
                      }
                    `}
                    disabled={submitted}
                  >
                    {submitted ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiCheckCircle className="w-5 h-5" />
                        Successfully Subscribed!
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FiHeart className="w-5 h-5" />
                        Subscribe Now
                      </span>
                    )}
                  </motion.button>
                  {error && (
                    <div className="text-red-600 text-sm mt-2 text-center">
                      {error}
                    </div>
                  )}
                </form>

                <p className="text-sm text-gray-500 mt-3 text-center">
                  Join the early community of Sierra Leone professionals
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center shadow-sm">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Jobmarkit</h3>
                  <p className="text-gray-600 text-sm font-medium">
                    Sierra Leone&apos;s #1 Job Portal
                  </p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Connecting talented professionals with top employers across
                Sierra Leone. Your career journey starts here.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Freetown, Sierra Leone</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">+232 XX XXX XXXX</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <FiMail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">info@jobmarkit.sl</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Seekers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
              <FiUsers className="w-5 h-5 text-gray-500" />
              Job Seekers
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/jobs"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  <FiBriefcase className="w-4 h-4 text-gray-500" />
                  <span>Browse Jobs</span>
                </a>
              </li>
              <li>
                <a
                  href="/resume-builder"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  <FiBriefcase className="w-4 h-4 text-gray-500" />
                  <span>Resume Builder</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-gray-500" />
              Employers
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/post-job"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  <FiBriefcase className="w-4 h-4 text-gray-500" />
                  <span>Post a Job</span>
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  <FiBriefcase className="w-4 h-4 text-gray-500" />
                  <span>Pricing Plans</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200 flex items-center gap-2">
              <FiGlobe className="w-5 h-5 text-gray-500" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/about"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  <FiGlobe className="w-4 h-4 text-gray-500" />
                  <span>About Us</span>
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                  <FiGlobe className="w-4 h-4 text-gray-500" />
                  <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <FiShield className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Verified Platform</span>
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center">
            © 2025 Jobmarkit SL. All rights reserved.
          </div>

          <div className="flex space-x-6">
            <a
              href="/privacy"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
