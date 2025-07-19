import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiHeart,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiMapPin,
  FiBriefcase,
} from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import JobCard from "../components/JobCard";
import { AppContext } from "../context/AppContext";

const SavedJobs = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { backendUrl, userData } = useContext(AppContext);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch saved jobs on component mount
  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    if (!userData) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.get(`${backendUrl}/api/users/saved-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSavedJobs(response.data.savedJobs || []);
      } else {
        toast.error("Failed to load saved jobs");
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      toast.error("Error loading saved jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search and filters
  const filteredJobs = savedJobs
    .filter((job) => job && job._id && job.title)
    .filter((job) => {
      const matchesSearch =
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || job.category === selectedCategory;
      const matchesLocation =
        selectedLocation === "all" || job.location === selectedLocation;

      return matchesSearch && matchesCategory && matchesLocation;
    });

  // Get unique categories and locations for filter options
  const categories = [
    "all",
    ...new Set(savedJobs.map((job) => job.category).filter(Boolean)),
  ];
  const locations = [
    "all",
    ...new Set(savedJobs.map((job) => job.location).filter(Boolean)),
  ];

  // Handle job unsave
  const handleUnsaveJob = async (jobId) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `${backendUrl}/api/users/unsave-job`,
        { jobId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSavedJobs((prev) => prev.filter((job) => job._id !== jobId));
        toast.success("Job removed from saved jobs");
      } else {
        toast.error("Failed to remove job from saved jobs");
      }
    } catch (error) {
      console.error("Error unsaving job:", error);
      toast.error("Error removing job from saved jobs");
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiHeart className="text-gray-400 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Please Login
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to view your saved jobs.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
              <p className="text-gray-600 mt-1">
                {savedJobs.length} job{savedJobs.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-gray-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-gray-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiFilter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search saved jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location === "all" ? "All Locations" : location}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-12">
            <FiHeart className="text-gray-400 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Saved Jobs Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start saving jobs you're interested in by clicking the heart icon
              on any job card.
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div>
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <FiSearch className="text-gray-400 text-6xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  No Jobs Found
                </h2>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or filters to find what you're
                  looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedLocation("all");
                  }}
                  className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Jobs Grid/List */}
                {viewMode === "grid" ? (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredJobs.map((job) => (
                      <JobCard
                        key={job._id}
                        job={job}
                        onUnsave={() => handleUnsaveJob(job._id)}
                        isSaved={true}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 },
                      },
                    }}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {filteredJobs.map((job) => (
                      <motion.div
                        key={job._id}
                        variants={{
                          hidden: { y: 20, opacity: 0 },
                          visible: { y: 0, opacity: 1 },
                        }}
                        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={job.companyId?.image}
                            alt={job.companyId?.name}
                            className="w-12 h-12 rounded-lg object-contain"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {job.title}
                            </h3>
                            <p className="text-gray-600">
                              {job.companyId?.name}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FiMapPin /> {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiBriefcase /> {job.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => navigate(`/apply/${job._id}`)}
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Apply Now
                          </button>
                          <button
                            onClick={() => handleUnsaveJob(job._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiHeart className="w-6 h-6 fill-current" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
