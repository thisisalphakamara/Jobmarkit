import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiQuote,
  FiStar,
  FiMapPin,
  FiBriefcase,
  FiArrowLeft,
  FiArrowRight,
  FiPlay,
  FiLinkedin,
  FiTwitter,
} from "react-icons/fi";

const SuccessStories = () => {
  const [currentStory, setCurrentStory] = useState(0);

  const stories = [
    {
      name: "Aminata Kamara",
      role: "Software Developer",
      company: "Africell Sierra Leone",
      location: "Freetown",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      quote:
        "Jobmarkit helped me find my dream job in just 2 weeks! The AI matching was incredibly accurate and the career coaching helped me ace my interview.",
      rating: 5,
      salary: "SLL 15M/year",
      timeToJob: "2 weeks",
      video: "https://example.com/video1.mp4",
    },
    {
      name: "Mohamed Sesay",
      role: "Project Manager",
      company: "Sierra Rutile Limited",
      location: "Bonthe",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      quote:
        "After 6 months of searching, Jobmarkit connected me with the perfect opportunity. The salary insights helped me negotiate a 30% higher salary!",
      rating: 5,
      salary: "SLL 25M/year",
      timeToJob: "3 weeks",
      video: "https://example.com/video2.mp4",
    },
    {
      name: "Fatima Conteh",
      role: "Marketing Specialist",
      company: "Orange Sierra Leone",
      location: "Bo",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      quote:
        "The platform's focus on Sierra Leone's job market made all the difference. I found opportunities I never knew existed in my hometown.",
      rating: 5,
      salary: "SLL 12M/year",
      timeToJob: "1 week",
      video: "https://example.com/video3.mp4",
    },
    {
      name: "Ibrahim Koroma",
      role: "Data Analyst",
      company: "Bank of Sierra Leone",
      location: "Freetown",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      quote:
        "Jobmarkit's AI recommendations were spot-on. They matched me with a role that perfectly aligned with my skills and career goals.",
      rating: 5,
      salary: "SLL 18M/year",
      timeToJob: "4 weeks",
      video: "https://example.com/video4.mp4",
    },
  ];

  const nextStory = () => {
    setCurrentStory((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentStory((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FiStar className="text-purple-400" />
            Success Stories
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Real Stories from{" "}
            <span className="bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
              Sierra Leone
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Discover how Jobmarkit has transformed careers and created
            opportunities for professionals across Sierra Leone.
          </p>
        </motion.div>

        {/* Success Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">2,500+</div>
            <div className="text-white/70 text-sm">Jobs Found</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">95%</div>
            <div className="text-white/70 text-sm">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">3.2</div>
            <div className="text-white/70 text-sm">Avg. Weeks to Job</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">25%</div>
            <div className="text-white/70 text-sm">Higher Salaries</div>
          </div>
        </motion.div>

        {/* Story Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 md:p-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Story Content */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <FiQuote className="text-purple-400 text-2xl" />
                    <div className="flex">
                      {[...Array(stories[currentStory].rating)].map((_, i) => (
                        <FiStar
                          key={i}
                          className="text-purple-400 fill-current"
                        />
                      ))}
                    </div>
                  </div>

                  <blockquote className="text-2xl md:text-3xl text-white font-medium mb-8 leading-relaxed">
                    "{stories[currentStory].quote}"
                  </blockquote>

                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={stories[currentStory].image}
                      alt={stories[currentStory].name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-white">
                        {stories[currentStory].name}
                      </h4>
                      <p className="text-white/80">
                        {stories[currentStory].role}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-sm text-white/60">Company</div>
                      <div className="text-white font-medium">
                        {stories[currentStory].company}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-sm text-white/60">Location</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        <FiMapPin className="text-purple-400" />
                        {stories[currentStory].location}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-sm text-white/60">Salary</div>
                      <div className="text-white font-medium">
                        {stories[currentStory].salary}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="text-sm text-white/60">Time to Job</div>
                      <div className="text-white font-medium">
                        {stories[currentStory].timeToJob}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="bg-gradient-to-r from-purple-400 to-purple-300 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-300 hover:to-purple-200 transition-all duration-300 flex items-center gap-2">
                      <FiPlay />
                      Watch Story
                    </button>
                    <button className="border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                      <FiLinkedin />
                      Connect
                    </button>
                  </div>
                </div>

                {/* Video Preview */}
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-purple-600 to-purple-600 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <FiPlay className="text-white text-6xl mx-auto mb-4" />
                      <p className="text-white/70">
                        Video testimonial coming soon!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <button
            onClick={prevStory}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all duration-300"
          >
            <FiArrowLeft />
          </button>
          <button
            onClick={nextStory}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg border border-white/20 text-white p-3 rounded-full hover:bg-white/20 transition-all duration-300"
          >
            <FiArrowRight />
          </button>

          {/* Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStory(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStory ? "bg-purple-400" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Write Your Success Story?
          </h3>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their careers
            with Jobmarkit.
          </p>
          <button className="bg-gradient-to-r from-purple-400 to-purple-300 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-300 hover:to-purple-200 transition-all duration-300 transform hover:scale-105">
            Start Your Journey Today
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default SuccessStories;
