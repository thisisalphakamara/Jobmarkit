import React, { useState } from "react";
import {
  FiBrain,
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiSmartphone,
  FiShield,
  FiGlobe,
  FiZap,
} from "react-icons/fi";

const AdvancedFeatures = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: FiBrain,
      title: "AI-Powered Job Matching",
      description:
        "Our advanced AI analyzes your skills, experience, and preferences to match you with the perfect job opportunities in Sierra Leone.",
      benefits: [
        "Smart recommendations",
        "Skill gap analysis",
        "Personalized job alerts",
        "Career path suggestions",
      ],
    },
    {
      icon: FiTrendingUp,
      title: "Salary Insights & Analytics",
      description:
        "Get real-time salary data and market insights to negotiate better compensation packages and understand industry trends.",
      benefits: [
        "Salary benchmarking",
        "Market trends",
        "Negotiation tips",
        "Industry reports",
      ],
    },
    {
      icon: FiUsers,
      title: "Career Coaching Network",
      description:
        "Connect with experienced professionals and career coaches who can guide you through your career journey in Sierra Leone.",
      benefits: [
        "1-on-1 mentoring",
        "Resume reviews",
        "Interview prep",
        "Career planning",
      ],
    },
    {
      icon: FiSmartphone,
      title: "Mobile-First Experience",
      description:
        "Access job opportunities on-the-go with our mobile app featuring offline job browsing and instant notifications.",
      benefits: [
        "Offline browsing",
        "Push notifications",
        "Quick apply",
        "Location-based jobs",
      ],
    },
    {
      icon: FiShield,
      title: "Verified Employers",
      description:
        "All companies are thoroughly verified to ensure you're applying to legitimate opportunities with reputable organizations.",
      benefits: [
        "Company verification",
        "Background checks",
        "Safe applications",
        "Trusted employers",
      ],
    },
    {
      icon: FiGlobe,
      title: "Local & International Jobs",
      description:
        "Find opportunities both within Sierra Leone and internationally, with special focus on remote work and diaspora connections.",
      benefits: [
        "Local opportunities",
        "Remote work",
        "Diaspora network",
        "Global connections",
      ],
    },
  ];

  const stats = [
    { number: "95%", label: "Job Match Accuracy" },
    { number: "10K+", label: "Active Users" },
    { number: "500+", label: "Verified Companies" },
    { number: "24/7", label: "Support Available" },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FiZap className="text-green-600" />
            Advanced Features
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Jobmarkit
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're not just another job board. We're your complete career
            partner, designed specifically for Sierra Leone's unique job market.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-[#6B46C1] bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                activeFeature === index ? "ring-2 ring-purple-500" : ""
              }`}
              onClick={() => setActiveFeature(index)}
            >
              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#6B46C1] mb-6`}
              >
                <feature.icon className="text-white text-2xl" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>

              {/* Benefits */}
              <div className="space-y-3">
                {feature.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl p-12 text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Career?
          </h3>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have found their dream jobs
            through Jobmarkit. Start your journey today and discover
            opportunities you never knew existed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              Get Started Free
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-green-600 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvancedFeatures;
