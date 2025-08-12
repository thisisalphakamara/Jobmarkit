import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import bgimage from "../assets/jobserach.jpg";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";

// Import company logos directly
import companyLogo1 from "../assets/ayv.jpg";
import companyLogo2 from "../assets/christex.png";
import companyLogo3 from "../assets/connaught.png";
import companyLogo4 from "../assets/pavifort.png";
import companyLogo5 from "../assets/np.jpg";
import companyLogo6 from "../assets/Africell.png";
import companyLogo7 from "../assets/capitolfoods.jpg";
import companyLogo8 from "../assets/lim.jpg";

// Canonical Sierra Leone towns list (same as JobListing filter)
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
  { district: "Western Area Rural", province: "Western Area", capital: "Waterloo" },
  { district: "Western Area Urban", province: "Western Area", capital: "Freetown" },
];
const capitalTowns = [
  ...sierraLeoneDistricts.map((d) => d.capital),
  "Lunsar",
  "Masiaka",
  "Lungi",
];

const Hero = ({ jobListingRef }) => {
  const { setSearchFilter, setIsSearched, jobs } = useContext(AppContext);
  const whatRef = useRef(null);
  const whereRef = useRef(null);
  const dropdownRef = useRef(null);
  const [activeTag, setActiveTag] = useState(null);
  const [locationInput, setLocationInput] = useState("");
  const [showTownList, setShowTownList] = useState(false);
  const [filteredTowns, setFilteredTowns] = useState([]);

  // Canonical list from JobListing filter
  const allTowns = useMemo(() => {
    return Array.from(new Set(capitalTowns)).sort((a, b) =>
      a.localeCompare(b)
    );
  }, []);

  useEffect(() => {
    // Initialize or update filtered list when towns or input changes
    const q = locationInput.trim().toLowerCase();
    if (!q) {
      setFilteredTowns(allTowns);
    } else {
      setFilteredTowns(
        allTowns.filter((t) => t.toLowerCase().includes(q))
      );
    }
  }, [allTowns, locationInput]);

  useEffect(() => {
    // Close dropdown on outside click
    const onDocMouseDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowTownList(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

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
      location: (locationInput || whereRef.current?.value || "").trim(),
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
      <section className="relative overflow-visible mx-4 my-6 lg:mx-8 lg:my-10 rounded-3xl shadow-2xl">
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
              className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-visible"
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
                {/* Where Field with Town Dropdown */}
                <div
                  className="flex-1 px-6 py-4 border-b lg:border-b-0 border-gray-200 relative"
                  ref={dropdownRef}
                >
                  <div className="flex items-center">
                    <FiMapPin className="text-gray-400 text-xl mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      ref={whereRef}
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onFocus={() => setShowTownList(true)}
                      placeholder="Location (choose a town)"
                      className="w-full text-lg outline-none placeholder-gray-400"
                      autoComplete="off"
                    />
                  </div>
                  {showTownList && filteredTowns.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl h-64 overflow-y-auto overscroll-contain custom-scrollbar">
                      {filteredTowns.map((town) => (
                        <button
                          key={town}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-800"
                          onClick={() => {
                            setLocationInput(town);
                            setShowTownList(false);
                            // keep input ref in sync, though we read from state on submit
                            if (whereRef.current) whereRef.current.value = town;
                          }}
                        >
                          {town}
                        </button>
                      ))}
                      {filteredTowns.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">No towns found</div>
                      )}
                    </div>
                  )}
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
            Trusted by companies Nationwide
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
