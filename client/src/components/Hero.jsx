import React, { useContext, useRef, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import bgimage from "../assets/jobserach.jpg";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiMapPin,
  FiArrowRight,
  FiChevronDown,
  FiBriefcase,
} from "react-icons/fi";
import { JobLocations, JobCategories } from "../assets/assets";

// Import company logos directly
import companyLogo1 from "../assets/ayv.jpg";
import companyLogo2 from "../assets/christex.png";
import companyLogo3 from "../assets/connaught.png";
import companyLogo4 from "../assets/pavifort.png";
import companyLogo5 from "../assets/np.jpg";
import companyLogo6 from "../assets/Africell.png";
import companyLogo7 from "../assets/capitolfoods.jpg";
import companyLogo8 from "../assets/lim.jpg";

const Hero = ({ jobListingRef }) => {
  const { setSearchFilter, setIsSearched } = useContext(AppContext);
  const whatRef = useRef(null);
  const whereRef = useRef(null);
  const [activeTag, setActiveTag] = useState(null);

  // Simplified popular tags for Sierra Leone context
  const popularTags = [
    "Driver",
    "Teacher",
    "Nurse",
    "Farmer",
    "Sales",
    "Security",
  ];

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    if (whatRef.current) whatRef.current.value = tag;
  };

  const onSearch = (e) => {
    e.preventDefault();
    setSearchFilter({
      title: whatRef.current.value,
      location: whereRef.current.value,
    });
    setIsSearched(true);
    // Scroll to job listing
    if (jobListingRef && jobListingRef.current) {
      jobListingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const companyLogos = [
    companyLogo1,
    companyLogo2,
    companyLogo3,
    companyLogo4,
    companyLogo5,
    companyLogo6,
    companyLogo7,
    companyLogo8,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Floating container with margin on all sides */}
      <section className="relative overflow-hidden mx-4 my-6 lg:mx-8 lg:my-10 rounded-3xl shadow-2xl">
        {/* Background with original gradient overlay */}
        <div className="absolute inset-0">
          <img
            src={bgimage}
            alt="Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gray-800/80 mix-blend-multiply"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              Find Your Dream Job
              <br />
              With Salone Jobmarkit
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-white/90 max-w-2xl mx-auto mb-10"
            >
              Your next big career move starts here. Explore thousands of job
              opportunities and take control of your future.
            </motion.p>

            <motion.form
              onSubmit={onSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* What Field */}
                <div className="flex-1 flex items-center px-6 py-4 border-b lg:border-b-0 lg:border-r border-gray-200">
                  <FiSearch className="text-gray-400 text-xl mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    ref={whatRef}
                    placeholder="Job title, keywords, or company"
                    className="w-full text-lg outline-none placeholder-gray-400"
                    defaultValue={activeTag || ""}
                  />
                </div>
                {/* Where Field */}
                <div className="flex-1 flex items-center px-6 py-4 border-b lg:border-b-0 border-gray-200">
                  <FiMapPin className="text-gray-400 text-xl mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    ref={whereRef}
                    placeholder="Location (e.g. 'Freetown')"
                    className="w-full text-lg outline-none placeholder-gray-400"
                  />
                </div>
                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-gray-700 text-white hover:bg-gray-800 px-8 py-4 font-semibold text-lg flex items-center justify-center transition-all duration-300"
                >
                  Search Jobs
                  <FiArrowRight className="ml-2" />
                </button>
              </div>
            </motion.form>

            {/* Popular Job Types */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-8 text-white/90"
            >
              <span className="mr-4 text-lg font-medium">Popular jobs:</span>
              {popularTags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => handleTagClick(tag)}
                  className={`inline-block mr-3 mb-2 px-4 py-2 rounded-full text-base transition-all duration-200 ${
                    activeTag === tag
                      ? "bg-white/30 text-white font-medium"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white py-11 shadow-xl rounded-xl border border-gray-100 mx-2 md:mx-7 lg:mx-20 xl:mx-8"
      >
        {/* Background elements remain the same */}
        <div className="absolute inset-0 overflow-hidden">
          {/* ... background animation elements ... */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.p
            className="text-center text-gray-800 font-medium mb-8 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Trusted by innovative companies Nationwide
          </motion.p>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {companyLogos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  y: 20,
                  rotate: index % 2 === 0 ? -5 : 5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotate: 0,
                }}
                transition={{
                  delay: 1.2 + index * 0.1,
                  duration: 0.8,
                  type: "spring",
                  damping: 6,
                }}
                whileHover={{
                  scale: 1.15,
                  rotate: index % 2 === 0 ? -3 : 3,
                  y: -5,
                }}
                whileTap={{ scale: 0.95 }}
                className="h-20 w-20 md:h-24 md:w-30 relative group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-lg bg-gray-100/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Logo container */}
                <div className="h-full w-full transition-all duration-500">
                  <img
                    src={logo}
                    alt={`Company ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Pulse animation */}
                <motion.div
                  className="absolute inset-0 border-2 border-transparent rounded-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* ... particle animations ... */}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Hero;
