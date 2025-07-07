import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiSmartphone,
  FiDownload,
  FiBell,
  FiSearch,
  FiMapPin,
  FiHeart,
  FiShare,
  FiZap,
  FiCheck,
  FiPlay,
  FiStar,
} from "react-icons/fi";

const MobileApp = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const appFeatures = [
    {
      icon: FiSearch,
      title: "Smart Job Search",
      description:
        "AI-powered job matching with personalized recommendations based on your skills and preferences.",
    },
    {
      icon: FiBell,
      title: "Instant Notifications",
      description:
        "Get real-time alerts for new job postings, application updates, and interview invitations.",
    },
    {
      icon: FiMapPin,
      title: "Location-Based Jobs",
      description:
        "Find opportunities near you with GPS-enabled job discovery and commute time estimates.",
    },
    {
      icon: FiHeart,
      title: "Save & Apply",
      description:
        "Save interesting jobs, track your applications, and apply with just one tap.",
    },
    {
      icon: FiShare,
      title: "Easy Sharing",
      description:
        "Share job opportunities with friends and family through social media and messaging apps.",
    },
    {
      icon: FiZap,
      title: "Offline Browsing",
      description:
        "Browse saved jobs and your profile even without internet connection.",
    },
  ];

  const appStats = [
    { number: "50K+", label: "Downloads" },
    { number: "4.8", label: "App Store Rating" },
    { number: "24/7", label: "Available" },
    { number: "100%", label: "Free" },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FiSmartphone className="text-purple-400" />
              Mobile App
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your Career in Your{" "}
              <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                Pocket
              </span>
            </h2>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              Download the Jobmarkit mobile app and take your job search
              anywhere. Get instant notifications, apply on-the-go, and never
              miss the perfect opportunity.
            </p>

            {/* App Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {appStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <FiDownload className="text-2xl" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-sm">App Store</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <FiDownload className="text-2xl" />
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-sm">Google Play</div>
                </div>
              </motion.button>
            </div>

            {/* QR Code */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 inline-block">
              <div className="text-center">
                <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="text-xs text-gray-600">QR Code</div>
                  </div>
                </div>
                <p className="text-white/80 text-sm">Scan to download</p>
              </div>
            </div>
          </motion.div>

          {/* Mobile App Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="relative mx-auto w-80 h-[600px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-purple-50 to-purple-50 rounded-[2.5rem] overflow-hidden relative">
                {/* App Screen */}
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Jobmarkit</h3>
                      <FiBell className="text-2xl" />
                    </div>
                    <div className="bg-white/20 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <FiSearch className="text-white/80" />
                        <input
                          type="text"
                          placeholder="Search jobs..."
                          className="bg-transparent text-white placeholder-white/60 outline-none flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 space-y-4">
                    {/* Feature Cards */}
                    {appFeatures.slice(0, 3).map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-purple-600 to-purple-600 text-white p-4 rounded-xl"
                        onClick={() => setActiveFeature(index)}
                      >
                        <div className="flex items-center gap-3">
                          <feature.icon className="text-2xl" />
                          <div>
                            <h4 className="font-bold">{feature.title}</h4>
                            <p className="text-sm opacity-90">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-white rounded-xl p-4 text-center shadow-md">
                        <FiHeart className="text-purple-500 text-2xl mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-700">
                          Saved Jobs
                        </div>
                      </button>
                      <button className="bg-white rounded-xl p-4 text-center shadow-md">
                        <FiMapPin className="text-purple-500 text-2xl mx-auto mb-2" />
                        <div className="text-sm font-medium text-gray-700">
                          Nearby
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-purple-400 text-white p-3 rounded-full shadow-lg"
            >
              <FiStar className="text-2xl" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-purple-400 text-white p-3 rounded-full shadow-lg"
            >
              <FiCheck className="text-2xl" />
            </motion.div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            App Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-600 mb-4">
                  <feature.icon className="text-white text-2xl" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h4>
                <p className="text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Download the Jobmarkit app today and join thousands of professionals
            who have found their dream jobs on-the-go.
          </p>
          <button className="bg-gradient-to-r from-purple-400 to-purple-400 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-300 hover:to-purple-300 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto">
            <FiDownload />
            Download Now
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default MobileApp;
