import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiStar,
  FiMapPin,
  FiUsers,
  FiTrendingUp,
  FiAward,
  FiGlobe,
  FiHeart,
  FiZap,
  FiPlay,
  FiDownload,
  FiSmartphone,
  FiCheckCircle,
  FiMic,
  FiEye,
  FiShield,
  FiMessageCircle,
  FiVolume2,
  FiCamera,
  FiVideo,
  FiHeadphones,
  FiWifi,
  FiClock,
  FiBookOpen,
} from "react-icons/fi";
// import CtaBackground from "../assets/calltoaction.jpg";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleSearchClick = () => {
    navigate("/");
    setTimeout(() => {
      const jobListingElement = document.getElementById("job-list");
      if (jobListingElement) {
        jobListingElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleDownloadApp = () => {
    window.open("https://play.google.com/store", "_blank");
  };

  const handleWatchDemo = () => {
    console.log("Opening demo video");
  };

  // Unique features for accessibility and ease of use
  const uniqueFeatures = [
    {
      icon: FiMic,
      title: "Voice Search",
      description:
        "Search jobs by speaking in Krio, English, or local languages",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      icon: FiEye,
      title: "Visual Job Cards",
      description:
        "See job details with pictures and icons for easy understanding",
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      icon: FiVolume2,
      title: "Audio Descriptions",
      description: "Listen to job descriptions if you prefer audio over text",
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      icon: FiCamera,
      title: "Video Applications",
      description: "Apply with short video messages instead of written text",
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
    },
    {
      icon: FiHeadphones,
      title: "Voice Navigation",
      description: "Navigate the app completely by voice commands",
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
    },
    {
      icon: FiWifi,
      title: "Offline Mode",
      description: "Save jobs and work offline when internet is limited",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
    },
    {
      icon: FiClock,
      title: "Smart Reminders",
      description: "Get friendly reminders for interviews and deadlines",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
    {
      icon: FiBookOpen,
      title: "Learning Hub",
      description: "Free tutorials and guides for job seekers",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/20",
    },
  ];

  return (
    <section className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24 overflow-hidden">
      {/* Background with lighter purple themed gradient and pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Lighter purple themed background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100 via-purple-200 to-purple-300"></div>

        {/* Lighter purple pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-purple-300"></div>
          <div className="absolute top-1/3 left-0 w-full h-1/3 bg-purple-200"></div>
          <div className="absolute top-2/3 left-0 w-full h-1/3 bg-purple-400"></div>
        </div>

        {/* Lighter overlay */}
        <div className="absolute inset-0 bg-white/30"></div>

        {/* Abstract geometric shapes representing lighter purple theme */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-300/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-300/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Content container */}
      <div className="relative max-w-7xl mx-auto">
        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 rounded-3xl backdrop-blur-sm bg-white/80 border border-purple-200/50 shadow-2xl overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

          {/* Main content */}
          <div className="relative text-center">
            {/* Sierra Leone Flag Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-purple-100/80 backdrop-blur-sm border border-purple-300 px-4 py-2 rounded-full text-purple-800 text-sm font-medium mb-6"
            >
              <span className="text-2xl">🇸🇱</span>
              <span>Sierra Leone's Most Accessible Job Portal</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl lg:text-6xl mb-6"
            >
              <span className="block">Find Your Dream Job</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-500">
                Your Way, Your Language
              </span>
            </motion.h2>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-3xl mx-auto mt-6 text-xl text-gray-600 leading-relaxed"
            >
              Designed for every Sierra Leonean - whether you speak English,
              Krio, or local languages. Use voice, video, or text. We make job
              hunting simple for everyone.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col justify-center gap-4 mt-10 sm:flex-row sm:gap-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearchClick}
                className="flex items-center justify-center px-8 py-4 text-lg font-medium text-white transition-all duration-300 bg-purple-600 rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg hover:shadow-xl border-2 border-purple-500/20"
              >
                <FiSearch className="w-6 h-6 mr-3" />
                Start Your Search
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadApp}
                className="flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-700 transition-all duration-300 bg-white border-2 border-purple-300 rounded-xl hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg"
              >
                <FiDownload className="w-6 h-6 mr-3" />
                Download App
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWatchDemo}
                className="flex items-center justify-center px-8 py-4 text-lg font-medium text-purple-700 transition-all duration-300 bg-white border-2 border-purple-300 rounded-xl hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-lg"
              >
                <FiPlay className="w-6 h-6 mr-3" />
                See How It Works
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-sm text-gray-500"
            >
              Designed for all Sierra Leoneans - educated or not, English
              speakers or not
            </motion.div>
          </div>
        </motion.div>

        {/* Unique Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Built for Every Sierra Leonean
            </h3>
            <p className="text-gray-600 text-lg">
              Unique features that make job hunting accessible to everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {uniqueFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/90 backdrop-blur-sm border border-purple-200 rounded-xl p-6 hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-xl"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h4 className="text-gray-800 font-semibold text-lg mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-purple-100/80 backdrop-blur-sm border border-purple-300 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Find Your Perfect Job?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of Sierra Leoneans who are discovering new
              opportunities with our accessible platform
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearchClick}
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FiHeart className="w-6 h-6 mr-3" />
              Get Started Today
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
