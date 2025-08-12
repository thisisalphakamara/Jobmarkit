import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Eye,
  Users,
  Award,
  CheckCircle,
  Move,
  MapPin,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";
import { assets } from "../assets/assets";

const KanbanBoard = ({
  applicants,
  stages,
  onDragStart,
  onDragOver,
  onDrop,
  onStatusChange,
  onScheduleInterview,
  onMessage,
  getKanbanStage,
  unreadMessageCounts = {},
}) => {
  // Group applicants by stage
  const groupedApplicants = stages.reduce((acc, stage) => {
    acc[stage.id] = applicants.filter((app) => {
      const appStage = getKanbanStage(app.status);
      return appStage === stage.id;
    });
    return acc;
  }, {});

  // Kanban Candidate Card Component
  const KanbanCard = ({ applicant, index }) => (
    <motion.div
      key={applicant._id || index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      draggable
      onDragStart={(e) => onDragStart(e, applicant)}
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-move group ${
        applicant.status === "decision"
          ? "border-orange-300 bg-orange-50/30"
          : "border-gray-200"
      }`}
    >
      <div className="p-4">
        {/* Interview Scheduled Indicator */}
        {applicant.status === "interview" && applicant.interviewScheduled && (
          <div className="mb-3 p-2 bg-purple-100 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700 text-xs font-medium">
              <Calendar size={12} />
              <span>Interview Scheduled</span>
            </div>
            <div className="text-purple-600 text-xs mt-1">
              {new Date(applicant.interviewDate).toLocaleDateString()} at{" "}
              {applicant.interviewTime}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
              {applicant.userId?.image ? (
                <img
                  className="w-full h-full object-cover"
                  src={applicant.userId.image}
                  alt={`${applicant.userId.name || "Applicant"}'s avatar`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = assets.default_avatar;
                  }}
                />
              ) : (
                <img
                  className="w-full h-full object-cover"
                  src={assets.default_avatar}
                  alt="Default avatar"
                />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-800 text-sm">
                {applicant.userId?.name || "Unknown"}
              </div>
              <div className="text-gray-500 text-xs">
                {applicant.jobId?.title || "N/A"}
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Move size={14} className="text-gray-400" />
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin size={12} />
            <span>{applicant.jobId?.location || "Remote"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar size={12} />
            <span>
              Applied{" "}
              {new Date(
                applicant.createdAt || applicant.date
              ).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Removed Match Score */}

        {/* Actions */}
        <div className="flex gap-2">
          {typeof applicant.userId === "object" && applicant.userId?.resume && (
            <a
              href={applicant.userId.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              <FileText size={12} />
              Resume
            </a>
          )}

          {applicant.status === "pending" && (
            <button
              onClick={() => onScheduleInterview(applicant)}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
            >
              <Calendar size={12} />
              Schedule
            </button>
          )}

          {/* Message Button - Always visible */}
          <button
            onClick={() => onMessage(applicant)}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors relative ${
              unreadMessageCounts[applicant._id] > 0
                ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
            title="Send message to applicant"
          >
            <MessageSquare size={12} />
            Message
            {unreadMessageCounts[applicant._id] > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {unreadMessageCounts[applicant._id]}
              </span>
            )}
          </button>
        </div>

        {/* Quick Actions - Show for all stages except accepted and rejected */}
        {applicant.status !== "accepted" &&
          applicant.status !== "hired" &&
          applicant.status !== "Rejected" && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex gap-1 flex-wrap">
                {/* Stage-specific actions */}
                {applicant.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "screening", applicant)
                      }
                      className="flex-1 bg-yellow-100 text-yellow-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                    >
                      Screen
                    </button>
                    <button
                      onClick={() => onScheduleInterview(applicant)}
                      className="flex-1 bg-purple-100 text-purple-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "accepted", applicant)
                      }
                      className="flex-1 bg-green-100 text-green-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "Rejected", applicant)
                      }
                      className="flex-1 bg-red-100 text-red-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}

                {applicant.status === "screening" && (
                  <>
                    <button
                      onClick={() => onScheduleInterview(applicant)}
                      className="flex-1 bg-purple-100 text-purple-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "accepted", applicant)
                      }
                      className="flex-1 bg-green-100 text-green-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "Rejected", applicant)
                      }
                      className="flex-1 bg-red-100 text-red-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}

                {applicant.status === "interview" && (
                  <>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "accepted", applicant)
                      }
                      className="flex-1 bg-green-100 text-green-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        onStatusChange(applicant._id, "Rejected", applicant)
                      }
                      className="flex-1 bg-red-100 text-red-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
      </div>
    </motion.div>
  );

  return (
    <div className="p-6">
      <div className="flex gap-4 overflow-x-auto pb-4 min-w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72 lg:w-80"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div
              className={`flex items-center justify-between mb-4 p-3 rounded-lg border ${stage.color}`}
            >
              <div className="flex items-center gap-2">
                {stage.icon}
                <div>
                  <h3 className="font-semibold text-sm">{stage.title}</h3>
                  <p className="text-xs opacity-75">{stage.description}</p>
                </div>
              </div>
              <div className="bg-white/50 rounded-full px-2 py-1 text-xs font-semibold">
                {stage.count}
              </div>
            </div>

            {/* Stage Content */}
            <div className="space-y-3 min-h-[400px]">
              {groupedApplicants[stage.id]?.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  No candidates
                </div>
              ) : (
                groupedApplicants[stage.id]?.map((applicant, index) => (
                  <KanbanCard
                    key={applicant._id || index}
                    applicant={applicant}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
