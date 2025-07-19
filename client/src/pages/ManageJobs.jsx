import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { motion } from "framer-motion";

const ManageJobs = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { backendUrl, companyToken, recruiterToken, jobs, updateJobs } =
    useContext(AppContext);

  // Function to fetch company Job Applications
  const fetchCompanyJobs = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(backendUrl + "/api/company/list-jobs", {
        headers: { token: companyToken || recruiterToken },
      });

      if (data.success) {
        updateJobs(data.jobsData.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to change Job Visibility
  const changeJobVisiblity = async (id) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/company/change-visibility",
        { id },
        {
          headers: { token: companyToken || recruiterToken },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchCompanyJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      const { data } = await axios.delete(
        backendUrl + "/api/company/delete-job/" + id,
        {
          headers: { token: companyToken || recruiterToken },
        }
      );
      if (data.success) {
        toast.success("Job deleted successfully!");
        fetchCompanyJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (companyToken || recruiterToken) {
      fetchCompanyJobs();
    }
  }, [companyToken, recruiterToken]);

  if (isLoading) return <Loading />;

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-xl sm:text-2xl text-gray-600">
          No Jobs Available or posted
        </p>
      </div>
    );
  }

  return (
    <motion.div
      whileInView={{ opacity: 1, scale: 1 }}
      initial={{ opacity: 0, scale: 0.5 }}
      transition={{
        duration: 0.8,
        delay: 0.2,
        ease: [0, 0.71, 0.2, 1.01],
      }}
      viewport={{ once: true }}
    >
      <div className="container p-4 mx-auto">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Manage Jobs
          </h1>
          <p className="text-gray-600">
            View, update, and manage your job listings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-gray-500">
            <p className="text-gray-500 text-sm mb-1">Total Jobs</p>
            <p className="text-2xl font-bold text-gray-600">{jobs.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-sm mb-1">Active Jobs</p>
            <p className="text-2xl font-bold text-green-600">
              {jobs.filter((job) => job.visible).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 border-gray-500">
            <p className="text-gray-500 text-sm mb-1">Total Applicants</p>
            <p className="text-2xl font-bold text-gray-600">
              {jobs.reduce((sum, job) => sum + job.applicants, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold text-gray-700">
                    #
                  </th>
                  <th className="py-4 px-6 text-left sm:text-[16px] font-semibold text-gray-700">
                    Job Title
                  </th>
                  <th className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="py-4 px-6 text-left max-sm:hidden sm:text-[16px] font-semibold text-gray-700">
                    Location
                  </th>
                  <th className="py-4 px-6 text-center sm:text-[16px] font-semibold text-gray-700">
                    <span className="flex items-center justify-center">
                      Applicants
                    </span>
                  </th>
                  <th className="py-4 px-6 text-center sm:text-[16px] font-semibold text-gray-700">
                    Edit Job
                  </th>
                  <th className="py-4 px-6 text-center sm:text-[16px] font-semibold text-gray-700">
                    Delete Job
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => (
                  <tr
                    key={index}
                    className="text-gray-700 sm:text-[15px] border-b border-gray-100 hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="py-4 px-6 max-sm:hidden">{index + 1}</td>
                    <td className="py-4 px-6 font-medium text-gray-800">
                      {job?.title || "Untitled Job"}
                    </td>
                    <td className="py-4 px-6 max-sm:hidden">
                      {job?.date ? moment(job.date).format("ll") : "No Date"}
                    </td>
                    <td className="py-4 px-6 max-sm:hidden">
                      {job?.location
                        ? job.location.district
                          ? `${job.location.town}, ${job.location.district}`
                          : job.location.town
                        : "No Location"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            job.applicants > 0
                              ? "bg-gray-100 text-gray-800 border border-gray-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {job.applicants}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/edit-job/${job?._id}`)
                          }
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => deleteJob(job?._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate("/dashboard/add-job")}
            className="bg-gray-800 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 transition duration-300 ease-in-out flex items-center gap-2 shadow-sm border border-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add new Job
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ManageJobs;
