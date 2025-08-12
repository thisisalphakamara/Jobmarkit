import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, FileText, MessageSquare } from "lucide-react";

const Card = ({ title, desc, to, icon: Icon }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
        <Icon size={18} className="text-gray-700" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm mb-5">{desc}</p>
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-lg"
    >
      Get started
      <Sparkles size={16} />
    </Link>
  </div>
);

const AIToolsSection = () => {
  return (
    <section className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            AI Tools to boost your applications
          </h2>
          <p className="text-gray-600 mt-2">
            Create tailored resumes, cover letters, and prep for interviews in
            minutes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="AI Resume Generator"
            desc="Generate an ATS-friendly resume optimized for jobs in Sierra Leone."
            to="/ai/resume"
            icon={FileText}
          />
          <Card
            title="AI Cover Letter"
            desc="Craft personalized cover letters aligned to each job posting."
            to="/ai/cover-letter"
            icon={MessageSquare}
          />
          <Card
            title="Interview Prep"
            desc="Get role-specific questions and sample answers to practice."
            to="/ai/interview-prep"
            icon={Sparkles}
          />
        </div>
      </div>
    </section>
  );
};

export default AIToolsSection;

