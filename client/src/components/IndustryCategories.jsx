import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiMining,
  FiLeaf,
  FiBuilding,
  FiSmartphone,
  FiShield,
  FiGlobe,
  FiTrendingUp,
  FiUsers,
  FiBookOpen,
  FiHeart,
  FiZap,
  FiTarget,
} from "react-icons/fi";

const IndustryCategories = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      icon: FiMining,
      title: "Mining & Natural Resources",
      description: "Diamond, gold, bauxite, and iron ore mining opportunities",
      jobs: "2,500+",
      companies: "50+",
    },
    {
      icon: FiLeaf,
      title: "Agriculture & Farming",
      description: "Rice, cocoa, coffee, and palm oil farming positions",
      jobs: "1,800+",
      companies: "120+",
    },
    {
      icon: FiBuilding,
      title: "Construction & Infrastructure",
      description: "Building, roads, bridges, and development projects",
      jobs: "3,200+",
      companies: "80+",
    },
    {
      icon: FiSmartphone,
      title: "Technology & Telecommunications",
      description: "IT, software, mobile networks, and digital services",
      jobs: "1,500+",
      companies: "40+",
    },
    {
      icon: FiShield,
      title: "Government & NGOs",
      description:
        "Public sector, international organizations, and development",
      jobs: "2,800+",
      companies: "200+",
    },
    {
      icon: FiGlobe,
      title: "Tourism & Hospitality",
      description: "Hotels, restaurants, travel, and cultural tourism",
      jobs: "1,200+",
      companies: "90+",
    },
    {
      icon: FiTrendingUp,
      title: "Finance & Banking",
      description: "Banks, microfinance, insurance, and financial services",
      jobs: "1,600+",
      companies: "60+",
    },
    {
      icon: FiUsers,
      title: "Healthcare & Education",
      description: "Hospitals, schools, universities, and training centers",
      jobs: "2,100+",
      companies: "150+",
    },
  ];

  const popularJobs = [
    "Software Developer",
    "Project Manager",
    "Data Analyst",
    "Marketing Specialist",
    "Sales Executive",
    "Customer Service",
    "Accountant",
    "Teacher",
    "Nurse",
    "Engineer",
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FiTarget className="text-green-600" />
            Industry Categories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Explore Jobs by{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Industry
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover opportunities across Sierra Leone's key industries, from
            traditional sectors to emerging technology fields.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 ${
                activeCategory === index
                  ? "border-green-500 shadow-lg"
                  : "border-gray-200"
              } bg-gradient-to-br from-gray-50 to-green-50`}
              onClick={() => setActiveCategory(index)}
            >
              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 mb-4`}
              >
                <category.icon className="text-white text-2xl" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {category.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {category.description}
              </p>

              {/* Stats */}
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <div className="font-bold text-gray-900">{category.jobs}</div>
                  <div className="text-gray-500">Active Jobs</div>
                </div>
                <div className="text-sm">
                  <div className="font-bold text-gray-900">
                    {category.companies}
                  </div>
                  <div className="text-gray-500">Companies</div>
                </div>
              </div>

              {/* Hover Effect */}
              <motion.div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 opacity-0 hover:opacity-10 transition-opacity duration-300`}
                whileHover={{ scale: 1.02 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Popular Jobs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Most Popular Job Titles
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These are the most sought-after positions across Sierra Leone.
              Click any job title to see current opportunities.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {popularJobs.map((job, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FiZap className="text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{job}</div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              View All Job Categories
            </button>
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
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Can't Find Your Industry?
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            We're constantly adding new industries and job categories. Let us
            know what you're looking for!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all duration-300">
              Suggest New Category
            </button>
            <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-green-600 hover:text-white transition-all duration-300">
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default IndustryCategories;
