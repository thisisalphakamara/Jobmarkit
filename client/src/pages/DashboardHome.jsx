import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import {
  Briefcase,
  UserPlus,
  MessageSquare,
  Calendar,
  PlusCircle,
  Eye,
} from "lucide-react";
import Loading from "../components/Loading";
import { Link, useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";

const StatCard = ({ title, value, icon, color, onClick, style }) => {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4`}
      onClick={onClick}
      style={style}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm font-medium text-gray-500">{title}</p>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  const { companyToken, recruiterToken, backendUrl, jobs, totalUnreadCount } =
    useContext(AppContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeJobs: 0,
    newApplications: 0,
    unreadMessages: 0,
    upcomingInterviews: 0,
    pipeline: [],
    totalApplicants: 0,
    topCandidates: [],
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = companyToken || recruiterToken;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch only essential data for speed
        const { data: jobData } = await axios.get(
          `${backendUrl}/api/company/list-jobs`,
          {
            headers: { token: token },
          }
        );
        const activeJobsCount = jobData.jobsData?.length || 0;

        // Set initial stats immediately for a fast perceived load
        setStats((prevStats) => ({
          ...prevStats,
          activeJobs: activeJobsCount,
        }));
        setLoading(false); // Stop the main loader

        // 2. Fetch the rest of the data in the background
        const { data: appData } = await axios.get(
          `${backendUrl}/api/company/applicants`,
          {
            headers: { token: token },
          }
        );

        if (appData.success) {
          // Filter out applications with missing job or user data to prevent crashes
          const applications = appData.applications.filter(
            (app) => app.jobId && app.userId
          );

          // 2. Calculate stats
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const newApplicationsCount = applications.filter(
            (app) => new Date(app.createdAt) >= today
          ).length;

          const upcomingInterviewsCount = applications.filter((app) => {
            return app.status && app.status.toLowerCase() === "interview";
          }).length;

          // 3. Calculate unread messages
          let unreadCount = 0;
          for (const applicant of applications) {
            try {
              const { data: messageData } = await axios.get(
                `${backendUrl}/api/simple-chat/${applicant._id}`
              );
              if (messageData.success) {
                unreadCount += messageData.messages.filter(
                  (msg) => msg.senderType === "applicant" && !msg.read
                ).length;
              }
            } catch (error) {
              console.error(
                "Error checking unread messages for an applicant:",
                error
              );
            }
          }

          // 4. Calculate pipeline (FIXED) and get top candidates/recent activity
          const pipeline = {
            Applied: { count: 0, color: "bg-blue-200" },
            Interview: { count: 0, color: "bg-purple-200" },
            Accepted: { count: 0, color: "bg-green-200" },
            Rejected: { count: 0, color: "bg-red-200" },
          };

          applications.forEach((app) => {
            const status = app.status?.toLowerCase();
            if (status === "pending") {
              pipeline["Applied"].count++;
            } else if (status === "interview") {
              pipeline["Interview"].count++;
            } else if (status === "accepted") {
              pipeline["Accepted"].count++;
            } else if (status === "rejected") {
              pipeline["Rejected"].count++;
            }
          });

          const pipelineArray = Object.keys(pipeline).map((key) => ({
            name: key,
            count: pipeline[key].count,
            color: pipeline[key].color,
          }));

          // Recent applicants: latest applicant per job (unique by jobId)
          const latestByJob = new Map();
          for (const app of applications) {
            const jobKey = app.jobId?._id || app.jobId; // handle populated or id
            const existing = latestByJob.get(jobKey);
            if (
              !existing ||
              new Date(app.createdAt) > new Date(existing.createdAt)
            ) {
              latestByJob.set(jobKey, app);
            }
          }
          const topCandidates = Array.from(latestByJob.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

          const recentActivities = [...applications]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

          setStats({
            activeJobs: activeJobsCount,
            newApplications: newApplicationsCount,
            unreadMessages: unreadCount,
            upcomingInterviews: upcomingInterviewsCount,
            pipeline: pipelineArray,
            totalApplicants: applications.length,
            topCandidates,
            recentActivities,
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setLoading(false); // Ensure loader stops on error
      }
    };

    fetchDashboardData();
  }, [companyToken, recruiterToken, backendUrl, jobs]);

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back! Here's a snapshot of your recruiting activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={<Briefcase size={24} className="text-blue-500" />}
          color="bg-blue-100"
          onClick={() => navigate("/dashboard/manage-jobs")}
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="New Applications (Today)"
          value={stats.newApplications}
          icon={<UserPlus size={24} className="text-emerald-500" />}
          color="bg-emerald-100"
          onClick={() =>
            navigate("/dashboard/view-applications", {
              state: { highlightToday: true },
            })
          }
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Unread Messages"
          value={totalUnreadCount}
          icon={<MessageSquare size={24} className="text-red-500" />}
          color="bg-red-100"
          onClick={() =>
            navigate("/dashboard/view-applications", {
              state: { sortUnreadTop: true },
            })
          }
          style={{ cursor: "pointer" }}
        />
        <StatCard
          title="Upcoming Interviews (Today)"
          value={stats.upcomingInterviews}
          icon={<Calendar size={24} className="text-amber-500" />}
          color="bg-amber-100"
          onClick={() =>
            navigate("/dashboard/view-applications", {
              state: { showInterviewsToday: true },
            })
          }
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/dashboard/add-job"
          className="bg-gray-700 text-white p-6 rounded-xl shadow-sm hover:bg-gray-800 transition-all flex items-center gap-4"
        >
          <PlusCircle size={32} />
          <div>
            <h2 className="text-xl font-bold">Post a New Job</h2>
            <p className="text-gray-300">
              Create a new listing to attract candidates.
            </p>
          </div>
        </Link>
        <Link
          to="/dashboard/view-applications"
          className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center gap-4"
        >
          <Eye size={32} className="text-gray-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Review Applications
            </h2>
            <p className="text-gray-500">
              See all candidates who have applied to your jobs.
            </p>
          </div>
        </Link>
      </div>

      {/* Applicant Pipeline */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Applicant Pipeline
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end h-48">
            {stats.pipeline.map((stage) => (
              <div
                key={stage.name}
                className="text-center w-1/4 px-4 h-full flex flex-col justify-end"
              >
                <div
                  className={`${stage.color} w-full rounded-lg transition-all duration-500`}
                  style={{
                    height: `${
                      stats.totalApplicants > 0
                        ? (stage.count / stats.totalApplicants) * 100
                        : 0
                    }%`,
                  }}
                ></div>
                <p className="text-lg font-bold text-gray-800 mt-3">
                  {stage.count}
                </p>
                <p className="text-base font-semibold text-gray-700 mt-1 whitespace-nowrap">
                  {stage.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applicants */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Recent Applicants
          </h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            {stats.topCandidates.length > 0 ? (
              stats.topCandidates.map((candidate) => (
                <div
                  key={candidate._id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={candidate.userId?.image || "/default-avatar.png"}
                      alt={candidate.userId?.name || "Candidate"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {candidate.userId?.name || "Unknown Applicant"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Applied for: {candidate.jobId?.title || "Deleted Job"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Link
                      to={`/dashboard/view-applications`} // Simplified link
                      className="text-sm text-blue-600 hover:underline mt-1"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No candidates to show yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            {stats.recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {stats.recentActivities.map((activity) => (
                  <li key={activity._id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <UserPlus size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">
                          {activity.userId?.name || "A new applicant"}
                        </span>{" "}
                        applied for the{" "}
                        <span className="font-semibold">
                          {activity.jobId?.title || "Deleted Job"}
                        </span>{" "}
                        position.
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
