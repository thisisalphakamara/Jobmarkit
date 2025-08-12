import React from "react";
import JobListing from "../components/JobListing";

const Jobs = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Browse Jobs</h1>
      <JobListing />
    </div>
  );
};

export default Jobs;
